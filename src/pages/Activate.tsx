import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * [A] 視覺資訊備註
 * 頁面：帳號啟用與密碼設定 (Activate & Set Password)
 * 視覺：極簡黑白、1px Border、高對比。
 * 邏輯：處理邀請連結的 Session 驗證與初始密碼設定。
 *
 * 規範修正 (2026-04-27)：
 * - 補 supabase null check
 *   原本 initCheck 直接呼叫 supabase.auth.getSession()，
 *   在 VITE_SUPABASE_URL 未設定的本機預覽環境會 TypeError 崩潰。
 *   修正：函式最前加 null guard，直接導向 error 狀態。
 * - handleActivate 中的 supabase.auth.updateUser 同樣補 null guard。
 */

// [B] 樣式常數（Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:    'flex flex-col items-center justify-center min-h-screen w-full px-6 py-20 bg-white',
  card:       'flex flex-col items-center w-full max-w-md p-10 bg-white border border-black shadow-sm',
  iconWrap:   'flex items-center justify-center w-20 h-20 rounded-full border border-black mb-8',
  title:      'text-2xl font-black tracking-tight text-black text-center mb-3 uppercase',
  desc:       'text-sm text-gray-500 text-center leading-relaxed mb-8',
  form:       'w-full space-y-6',
  inputGroup: 'relative border-b border-black py-2 transition-colors focus-within:border-gray-400',
  input:      'w-full bg-transparent border-none py-2 px-1 text-sm text-black leading-tight outline-none appearance-none',
  button:     'w-full py-4 bg-black text-white text-xs font-bold tracking-widest uppercase transition-all hover:bg-gray-800 disabled:opacity-50',
  errorBox:   'mt-4 w-full p-3 bg-red-50 border border-red-100 text-xs italic text-red-500 text-center',
} as const;

// [C] 元件主體
export const Activate: React.FC = () => {
  const [password, setPassword] = useState('');
  const [status,   setStatus]   = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initCheck = async () => {
      // [修正] null check：supabase 未設定時直接進入 error 狀態，避免 TypeError
      if (!supabase) {
        setStatus('error');
        setErrorMsg('系統尚未連線，請確認環境設定。');
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          setStatus('form');
        } else {
          setStatus('error');
          setErrorMsg('邀請連結已失效或已逾期，請聯繫管理員重新發送。');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || '驗證失敗，請稍後再試。');
      }
    };

    initCheck();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setErrorMsg('密碼長度需至少 6 個字元。');
      return;
    }

    // [修正] 同樣補 null guard
    if (!supabase) {
      setStatus('error');
      setErrorMsg('系統尚未連線，無法設定密碼。');
      return;
    }

    setStatus('loading');
    setErrorMsg(null);

    try {
      // 1. 更新密碼
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. 更新 Profile status → active
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
      }

      setStatus('success');
      // 2 秒後跳轉儀表板
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || '啟用失敗，請稍後再試。');
    }
  };

  return (
    <main className={STYLES.wrapper} aria-label="帳號啟用頁面">
      <div className={STYLES.card}>

        {/* 處理中 */}
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className={STYLES.iconWrap}>
              <Loader2 className="animate-spin text-black" size={32} aria-hidden="true" />
            </div>
            <h1 className={STYLES.title}>處理中</h1>
            <p className={STYLES.desc}>請稍候...</p>
          </div>
        )}

        {/* 設定密碼表單 */}
        {status === 'form' && (
          <>
            <div className={STYLES.iconWrap}>
              <Lock size={32} aria-hidden="true" />
            </div>
            <h1 className={STYLES.title}>設定密碼</h1>
            <p className={STYLES.desc}>請為您的帳號設定初始登入密碼（至少 6 個字元）。</p>

            <form onSubmit={handleActivate} className={STYLES.form}>
              <div className={STYLES.inputGroup}>
                <input
                  type="password"
                  placeholder="新密碼"
                  className={STYLES.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-label="新密碼"
                />
              </div>
              {errorMsg && (
                <div className={STYLES.errorBox} role="alert">{errorMsg}</div>
              )}
              <button type="submit" className={STYLES.button}>啟用帳號</button>
            </form>
          </>
        )}

        {/* 成功 */}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className={STYLES.iconWrap}>
              <CheckCircle2 size={32} aria-hidden="true" />
            </div>
            <h1 className={STYLES.title}>啟用成功</h1>
            <p className={STYLES.desc}>密碼設定完成，即將跳轉至儀表板...</p>
          </div>
        )}

        {/* 失敗 */}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className={`${STYLES.iconWrap} border-red-500`}>
              <AlertCircle size={32} className="text-red-500" aria-hidden="true" />
            </div>
            <h1 className={STYLES.title}>發生錯誤</h1>
            <p className={STYLES.desc}>{errorMsg}</p>
            <button onClick={() => navigate('/login')} className={STYLES.button}>
              返回登入頁
            </button>
          </div>
        )}

      </div>
    </main>
  );
};
