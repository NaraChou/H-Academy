// supabase/functions/invite-student/index.ts
//
// [A] Edge Function 角色說明
// 只有後端可以呼叫 supabase.auth.admin.inviteUserByEmail()，
// 因為這個 API 需要 SERVICE_ROLE key（絕對不能暴露在前端）。
// 此 Function 會：
//  1. 驗證 JWT → 確認呼叫者是 admin（role = 'admin'）。
//  2. 呼叫 Admin API 發送邀請信（Supabase 內建邀請 email）。
//  3. 若該 email 已存在且狀態為 active → 改發「重設密碼」信，不重複邀請。
//  4. 若已存在且狀態為 invited → 重發邀請。
//  5. 同步更新 profiles 的 full_name / class_name / student_no。

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── CORS headers（允許從前端網域呼叫） ────────────────────────────
// 必須包含 supabase.functions.invoke() 自動帶入的 apikey / x-client-info
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  // supabase.functions.invoke() 會帶 apikey / x-client-info
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Preflight（瀏覽器 CORS 預檢）
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  // ── 1. 取得環境變數 ─────────────────────────────────────────────
  const supabaseUrl     = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const siteUrl         = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError('Function secrets 缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY', 500);
  }

  // Admin client（service_role，只存在伺服器端）
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 2. 驗證呼叫者 JWT，確認是 admin ────────────────────────────
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonError('未提供 Authorization header', 401);
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: callerUser }, error: jwtErr } = await adminClient.auth.getUser(token);
  if (jwtErr || !callerUser) return jsonError('JWT 驗證失敗', 401);

  // 讀取 caller 的 profile，確認 role = 'admin'
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role, status')
    .eq('id', callerUser.id)
    .single();

  if (callerProfile?.role !== 'admin' || callerProfile?.status !== 'active') {
    return jsonError('權限不足：僅限管理員呼叫此 API', 403);
  }

  // ── 3. 解析請求 body ────────────────────────────────────────────
  let body: {
    email: string;
    full_name?: string | null;
    class_name?: string | null;
    student_no?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return jsonError('無法解析 JSON body', 400);
  }

  const { email, full_name, class_name, student_no } = body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return jsonError('請提供合法的 email 地址', 400);
  }

  // ── 4. 查詢 profiles 是否已存在 ────────────────────────────────
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, status, email')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  // ── 容錯邀請輔助函式 ────────────────────────────────────────────
  // 優先帶 redirectTo；若 Supabase 回報 redirect URL 不在白名單，
  // 則降級為不帶 redirectTo 再試一次（避免 non-2xx 錯誤）
  const inviteWithFallback = async (targetEmail: string) => {
    let inviteRes = await adminClient.auth.admin.inviteUserByEmail(targetEmail, {
      redirectTo: `${siteUrl}/activate`,
      data: { role: 'student' },
    });

    // redirectTo 不在 allow list → 降級重試
    if (inviteRes.error?.message?.toLowerCase().includes('redirect')) {
      inviteRes = await adminClient.auth.admin.inviteUserByEmail(targetEmail, {
        data: { role: 'student' },
      });
    }

    return inviteRes;
  };

  if (existingProfile) {
    // active → 改發重設密碼信（不重複邀請）
    if (existingProfile.status === 'active') {
      const { error: resetErr } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
        options: { redirectTo: `${siteUrl}/login` },
      });
      if (resetErr) return jsonError(`重設密碼信發送失敗：${resetErr.message}`, 500);
      return jsonOk({ message: '帳號已存在且已啟用，已改寄重設密碼信。', action: 'password_reset' });
    }

    // invited → 重發邀請（含容錯）
    if (existingProfile.status === 'invited') {
      const { error: resendErr } = await inviteWithFallback(normalizedEmail);
      if (resendErr) return jsonError(`重發邀請失敗：${resendErr.message}`, 500);

      // 同步更新 profile 附加資訊
      await adminClient.from('profiles').update({
        full_name:  full_name ?? undefined,
        class_name: class_name ?? undefined,
        student_no: student_no ?? undefined,
        invited_at: new Date().toISOString(),
      }).eq('id', existingProfile.id);

      return jsonOk({ message: '邀請信已重新發送。', action: 'reinvited' });
    }

    // suspended / archived → 拒絕
    return jsonError(`帳號目前為「${existingProfile.status}」狀態，請先由管理員解鎖後再邀請。`, 409);
  }

  // ── 5. 全新邀請（含容錯）────────────────────────────────────────
  const { data: inviteData, error: inviteErr } = await inviteWithFallback(normalizedEmail);

  // 某些情況 profiles 尚未建立，但 auth.users 已有該 email，此時改走重設密碼信
  if (inviteErr?.message?.toLowerCase().includes('already')) {
    const { error: resetErr } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${siteUrl}/login` },
    });

    if (resetErr) return jsonError(`帳號已存在，但重設密碼信發送失敗：${resetErr.message}`, 500);

    return jsonOk({
      message: '此信箱已存在帳號，系統已改寄重設密碼信。',
      action: 'password_reset_existing_auth',
    });
  }

  if (inviteErr) return jsonError(`邀請失敗：${inviteErr.message}`, 500);

  // 觸發器（handle_new_user）會自動建立 profiles 列，
  // 這裡補充額外欄位（full_name / class_name / student_no）
  if (inviteData.user?.id) {
    await adminClient.from('profiles').update({
      full_name:  full_name ?? null,
      class_name: class_name ?? null,
      student_no: student_no ?? null,
      email: normalizedEmail,
    }).eq('id', inviteData.user.id);
  }

  return jsonOk({ message: `邀請信已成功寄送至 ${normalizedEmail}`, action: 'invited' });
});

// ── 工具函式 ─────────────────────────────────────────────────────
function jsonOk(data: object): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
