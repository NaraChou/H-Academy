import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LAYOUT } from '../styles/layout';

/**
 * [A] 視覺資訊備註
 * 頁面：帳號啟用 (Activate)
 * 角色：學生收到邀請信點擊連結後，Supabase 自動帶入 session，
 *       此頁負責將 profiles.status: 'invited' → 'active'，並寫入 activated_at。
 * 狀態機 UI：loading / success / already_active / error，純 CSS transition 無 GSAP。
 * 無 rAF 動畫，故無 GSAP_SELECTORS。
 */

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:    'flex flex-col items-center justify-center min-h-[80vh] w-full px-6 py-20 bg-[var(--ui-bg)] theme-transition',
  card:       'flex flex-col items-center w-full max-w-md p-10 bg-[var(--ui-white)] border border-[var(--ui-border)] shadow-sm theme-transition',
  iconWrap:   'flex items-center justify-center w-20 h-20 rounded-full border border-[var(--ui-border)] mb-8 theme-transition',
  title:      'text-2xl font-black tracking-tight text-[var(--brand-primary)] text-center mb-3 theme-transition',
  desc:       'text-sm font-light text-[var(--text-sub)] text-center leading-relaxed mb-8 theme-transition',
  button:     'w-full py-4 bg-[var(--brand-primary)] text-[var(--ui-white)] text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 hover:bg-[var(--hsinyu-blue)] hover:shadow-lg active:scale-[0.98] theme-transition',
  errorBox:   'mt-4 w-full px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-600 text-center leading-relaxed',
} as const;

type ActivateStatus = 'loading' | 'success' | 'already_active' | 'error';

// [C] 元件主體
export const Activate: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ActivateStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!supabase) {
        setErrorMsg('Supabase 尚未設定，無法完成啟用。');
        setStatus('error');
        return;
      }

      // [視覺體驗] 邀請連結點擊後 Supabase 自動建立 session，此處直接取得
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

      if (sessionErr || !session?.user) {
        setErrorMsg('無法取得登入資訊，邀請連結可能已過期或無效，請聯絡管理員重新發送。');
        setStatus('error');
        return;
      }

      const uid = session.user.id;

      // 讀取目前 profile 的啟用狀態
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', uid)
        .single();

      if (profileErr || !profile) {
        setErrorMsg('找不到帳號資料，請聯絡管理員確認您的帳號是否已建立。');
        setStatus('error');
        return;
      }

      // 已是 active → 直接告知並準備導向
      if (profile.status === 'active') {
        setStatus('already_active');
        return;
      }

      // 非 invited 狀態（suspended / archived）
      if (profile.status !== 'invited') {
        setErrorMsg(`帳號目前為「${profile.status}」狀態，無法啟用，請聯絡管理員。`);
        setStatus('error');
        return;
      }

      // [視覺體驗] invited → active，冪等防護：.eq('status', 'invited') 確保不重複觸發
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
        })
        .eq('id', uid)
        .eq('status', 'invited');

      if (updateErr) {
        setErrorMsg(`啟用失敗：${updateErr.message}`);
        setStatus('error');
        return;
      }

      setStatus('success');
    };

    run();
  }, []);

  const goToDashboard = () => navigate('/dashboard');
  const goToLogin    = () => navigate('/login');

  // 狀態對應內容資料（DRY：集中管理，減少重複 JSX）
  const STATE_CONTENT: Record<
    Exclude<ActivateStatus, 'loading'>,
    { icon: React.ReactNode; borderColor: string; title: string; desc: string; btnLabel: string; btnAction: () => void }
  > = {
    success: {
      icon: <CheckCircle2 size={32} className="text-[var(--hsinyu-blue)]" aria-hidden="true" />,
      borderColor: 'border-[var(--hsinyu-blue)]',
      title: '啟用成功！',
      desc:  '您的帳號已完成啟用，歡迎加入欣育文理數位學習平台。請點擊下方按鈕進入個人儀表板。',
      btnLabel: '進入儀表板',
      btnAction: goToDashboard,
    },
    already_active: {
      icon: <CheckCircle2 size={32} className="text-[var(--hsinyu-blue)]" aria-hidden="true" />,
      borderColor: 'border-[var(--hsinyu-blue)]',
      title: '帳號已啟用',
      desc:  '您的帳號先前已完成啟用，可直接進入儀表板。',
      btnLabel: '進入儀表板',
      btnAction: goToDashboard,
    },
    error: {
      icon: <AlertCircle size={32} className="text-red-500" aria-hidden="true" />,
      borderColor: 'border-red-300',
      title: '啟用失敗',
      desc:  '帳號啟用過程中發生問題，請確認邀請連結是否有效或聯絡管理員。',
      btnLabel: '返回登入頁',
      btnAction: goToLogin,
    },
  };

  return (
    <section className={STYLES.wrapper} aria-label="帳號啟用頁面">
      <div className={STYLES.card}>

        {/* Loading 狀態 */}
        {status === 'loading' && (
          <>
            <div className={STYLES.iconWrap}>
              <Loader2 size={32} className="text-[var(--hsinyu-blue)] animate-spin" aria-hidden="true" />
            </div>
            <h1 className={STYLES.title}>帳號啟用中</h1>
            <p className={STYLES.desc}>正在驗證您的身份並完成啟用，請稍候…</p>
          </>
        )}

        {/* 非 loading 狀態：以資料物件驅動，零重複 JSX */}
        {status !== 'loading' && (() => {
          const content = STATE_CONTENT[status];
          return (
            <>
              <div className={`${STYLES.iconWrap} ${content.borderColor}`}>
                {content.icon}
              </div>
              <h1 className={STYLES.title}>{content.title}</h1>
              <p className={STYLES.desc}>{content.desc}</p>
              {status === 'error' && errorMsg && (
                <div className={STYLES.errorBox} role="alert">{errorMsg}</div>
              )}
              <button
                onClick={content.btnAction}
                className={`${STYLES.button} ${status === 'error' ? 'mt-8' : ''}`}
                aria-label={content.btnLabel}
              >
                {content.btnLabel}
              </button>
            </>
          );
        })()}

      </div>
    </section>
  );
};
