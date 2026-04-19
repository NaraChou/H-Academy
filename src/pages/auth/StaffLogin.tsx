import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 頁面：StaffLogin (教職員與管理員入口)
 * 設計：Kiki Design Style — 極簡黑白、專業、高對比。
 * 結構：精簡居中的登入框，加粗邊框。
 */

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[80vh] w-full px-6 py-20 bg-[var(--ui-white)] theme-transition',
  card: 'w-full max-w-sm p-8 bg-[var(--ui-white)] border-2 border-[var(--brand-primary)] rounded-none shadow-xl md:p-12',
  title: 'text-2xl font-black tracking-widest text-[var(--brand-primary)] text-center mb-2 uppercase',
  subtitle: 'text-xs text-[var(--text-sub)] text-center mb-8 font-bold tracking-[0.2em] uppercase',
  form: 'flex flex-col gap-6 w-full',
  
  // Input group
  inputGroup: 'flex flex-col gap-2',
  label: 'text-[10px] font-black tracking-widest text-[var(--text-main)] uppercase',
  input: 'w-full px-0 py-2 bg-transparent border-b-2 border-[var(--ui-border)] text-sm text-[var(--text-main)] transition-colors duration-300 focus:outline-none focus:border-[var(--brand-primary)] rounded-none',
  
  // Button
  button: 'w-full flex justify-center items-center py-4 mt-6 bg-[var(--brand-primary)] text-[var(--ui-white)] text-xs font-black tracking-widest uppercase transition-transform duration-300 hover:bg-black hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
  
  // Error message
  errorWrap: 'mb-6 text-xs text-[#EF4444] font-bold text-center border-l-4 border-[#EF4444] pl-3 py-1',
} as const;

export const StaffLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const cleanupSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          await supabase.auth.signOut();
        }
      } catch (err) {
        await supabase.auth.signOut();
      }
    };
    cleanupSession();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('請填寫所有欄位');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), 10000)
      );

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

      if (error) throw error;

      if (data.user) {
        // Query role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        const role = profile?.role || 'student';

        if (role === 'admin') {
          const searchParams = new URLSearchParams(location.search);
          const redirectTo = searchParams.get('redirect') || '/staff/dashboard';
          navigate(redirectTo);
        } else if (role === 'staff') {
          const searchParams = new URLSearchParams(location.search);
          // 導向掃碼打卡頁面
          const redirectTo = searchParams.get('redirect') || '/staff/check-in';
          navigate(redirectTo);
        } else {
          // Reject and logout
          setErrorMsg('權限不足，請由正確入口登入');
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        setErrorMsg('連線逾時，請檢查網路或重新登入');
      } else {
        setErrorMsg('登入失敗，請確認帳號密碼');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={STYLES.wrapper} aria-label="教職員登入頁面">
      <div className={STYLES.card}>
        <h1 className={STYLES.title}>Staff Portal</h1>
        <p className={STYLES.subtitle}>Restricted Access Only</p>

        {errorMsg && (
          <div className={STYLES.errorWrap} role="alert">
            {errorMsg}
          </div>
        )}

        <form className={STYLES.form} onSubmit={handleLogin} noValidate>
          <div className={STYLES.inputGroup}>
            <label htmlFor="email" className={STYLES.label}>Work Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={STYLES.input}
              placeholder="staff@hsinyu.tw"
              required
              disabled={isLoading}
            />
          </div>

          <div className={STYLES.inputGroup}>
            <label htmlFor="password" className={STYLES.label}>Access Code</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={STYLES.input}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className={STYLES.button}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={16} /> : 'Authenticate'}
          </button>
        </form>
      </div>
    </section>
  );
};
