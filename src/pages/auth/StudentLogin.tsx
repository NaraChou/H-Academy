import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 頁面：StudentLogin (學生與家長入口)
 * 設計：Kiki Design Style — 親切、簡潔、明亮、圓潤。
 */

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[70vh] w-full px-6 py-20 bg-[var(--ui-bg)] theme-transition',
  card: 'w-full max-w-md p-8 bg-white border border-[var(--ui-border)] rounded-3xl shadow-sm md:p-12',
  title: 'text-2xl font-bold tracking-widest text-[var(--brand-primary)] text-center mb-2',
  subtitle: 'text-sm text-[var(--text-sub)] text-center mb-8 font-medium',
  form: 'flex flex-col gap-5 w-full',
  
  // Input group
  inputGroup: 'flex flex-col gap-2',
  label: 'text-sm font-bold text-[var(--text-main)]',
  input: 'w-full px-4 py-3 bg-[var(--ui-bg)] border border-transparent rounded-2xl text-sm text-[var(--text-main)] transition-colors duration-300 focus:outline-none focus:border-[var(--hsinyu-blue)] focus:bg-white',
  
  // Button
  button: 'w-full flex justify-center items-center py-4 mt-4 bg-[var(--hsinyu-blue)] text-white text-sm font-bold tracking-widest rounded-2xl transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--hsinyu-blue)]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
  
  // Error message
  errorWrap: 'mb-4 text-sm text-[#EF4444] font-medium text-center bg-[#EF4444]/10 py-3 rounded-xl',
} as const;

export const StudentLogin: React.FC = () => {
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

        if (role === 'student') {
          const searchParams = new URLSearchParams(location.search);
          const redirectTo = searchParams.get('redirect') || '/student/dashboard';
          navigate(redirectTo);
        } else {
          // Reject and logout
          setErrorMsg('此入口僅供學生與家長登入，請由專屬入口使用');
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      if (err.message === 'TIMEOUT') {
        setErrorMsg('連線逾時，請檢查網路或重新登入');
      } else {
        setErrorMsg('帳號或密碼錯誤');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={STYLES.wrapper} aria-label="學生與家長登入頁面">
      <div className={STYLES.card}>
        <h1 className={STYLES.title}>歡迎回來</h1>
        <p className={STYLES.subtitle}>查看您的個人成績與聯絡簿</p>

        {errorMsg && (
          <div className={STYLES.errorWrap} role="alert">
            {errorMsg}
          </div>
        )}

        <form className={STYLES.form} onSubmit={handleLogin} noValidate>
          <div className={STYLES.inputGroup}>
            <label htmlFor="student-email" className={STYLES.label}>登入信箱</label>
            <input
              id="student-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={STYLES.input}
              placeholder="student@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className={STYLES.inputGroup}>
            <label htmlFor="student-password" className={STYLES.label}>密碼</label>
            <input
              id="student-password"
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
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : '登入系統'}
          </button>
        </form>
      </div>
    </section>
  );
};
