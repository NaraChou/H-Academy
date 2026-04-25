import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

/**
 * [A] 視覺資訊備註
 * 頁面：Login 登入頁面
 * 設計：Kiki Design Style — 極簡約、大面積留白、明確元件邊界、平滑過渡。
 * 結構：垂直置中表單，帶有纖細邊框與微柔和陰影。
 */

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[70vh] w-full px-6 py-20 theme-transition',
  card: 'w-full max-w-md p-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm transition-all duration-500 theme-transition hover:shadow-md md:p-12',
  title: 'mb-2 text-center text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition',
  subtitle: 'mb-8 text-center text-sm font-light tracking-widest text-[var(--text-sub)]',
  form: 'flex flex-col gap-6 w-full',
  
  // Input group
  inputGroup: 'flex flex-col gap-2',
  label: 'text-xs font-bold tracking-widest text-[var(--text-main)] uppercase theme-transition',
  input: 'w-full px-4 py-3 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-xl text-sm text-[var(--text-main)] transition-colors duration-300 focus:border-[var(--hsinyu-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--hsinyu-blue)]',
  
  // Button
  button: 'flex w-full items-center justify-center py-4 mt-2 bg-[var(--brand-primary)] text-[var(--ui-white)] text-sm font-bold tracking-widest rounded-xl transition-all duration-300 hover:bg-[var(--hsinyu-blue)] hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
  
  // Error message
  errorWrap: 'mb-6 px-4 py-3 text-center text-sm font-medium text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg',
} as const;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setErrorMsg('Supabase 尚未設定，無法進行登入。');
      return;
    }

    if (!email || !password) {
      setErrorMsg('請填寫所有欄位。');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('信箱未驗證')) {
          setErrorMsg('您的信箱尚未驗證。請檢查您的收件夾並點擊驗證連結。');
          setIsLoading(false);
          return;
        }
        throw error;
      }

      if (data.user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (err.message.includes('無效的登入憑證')) {
        setErrorMsg('信箱或密碼錯誤，請重新檢查。');
      } else {
        setErrorMsg(err.message || '登入失敗，請稍後再試。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={STYLES.wrapper} aria-label="登入頁面">
      <div className={STYLES.card}>
        <h1 className={STYLES.title}>歡迎回來</h1>
        <p className={STYLES.subtitle}>請登入以繼續探索</p>

        {errorMsg && (
          <div className={STYLES.errorWrap} role="alert">
            {errorMsg}
          </div>
        )}

        <form className={STYLES.form} onSubmit={handleLogin} noValidate>
          <div className={STYLES.inputGroup}>
            <label htmlFor="email" className={STYLES.label}>電子郵件</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={STYLES.input}
              placeholder="您的電子郵件"
              required
              disabled={isLoading}
            />
          </div>

          <div className={STYLES.inputGroup}>
            <label htmlFor="password" className={STYLES.label}>密碼</label>
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
            {isLoading ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </section>
  );
};
