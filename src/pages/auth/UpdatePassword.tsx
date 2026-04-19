import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[calc(100vh-80px)] w-full px-6',
  card: 'w-full max-w-[400px] border border-black p-8',
  title: 'text-2xl font-black tracking-widest mb-2',
  subtitle: 'text-xs text-neutral-500 tracking-widest mb-8 uppercase',
  inputGroup: 'flex flex-col gap-2 mb-6',
  label: 'text-[10px] font-bold tracking-widest uppercase',
  input: 'w-full border border-black p-3 text-sm focus:outline-none focus:ring-1 focus:ring-black',
  btn: 'w-full bg-black text-white py-4 text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50',
  error: 'text-[#EF4444] text-[10px] font-bold tracking-widest mb-4',
} as const;

export const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMsg('密碼不一致');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('密碼長度至少需 6 位');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Successfully updated
      navigate('/student/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || '更新失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={STYLES.wrapper} aria-label="設定新密碼">
      <div className={STYLES.card}>
        <h1 className={STYLES.title}>設定新密碼</h1>
        <p className={STYLES.subtitle}>請設定您的登入密碼</p>

        {errorMsg && <div className={STYLES.error}>{errorMsg}</div>}

        <form onSubmit={handleUpdate} className="flex flex-col">
          <div className={STYLES.inputGroup}>
            <label className={STYLES.label}>新密碼</label>
            <input
              type="password"
              className={STYLES.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={STYLES.inputGroup}>
            <label className={STYLES.label}>確認密碼</label>
            <input
              type="password"
              className={STYLES.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={STYLES.btn} disabled={isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : '確認設定'}
          </button>
        </form>
      </div>
    </section>
  );
};
