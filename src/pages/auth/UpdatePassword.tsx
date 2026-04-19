import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    // 頁面載入時檢查 Session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session || error) {
        setErrorMsg('您的登入狀態已過期，請重新透過邀請連結確認，或要求管理員重新發送邀請');
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Frontend validation
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
      // 檢查 Session 是否還存在
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('AUTH_SESSION_MISSING');
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Successfully updated
      navigate('/student/dashboard');
    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.message === 'AUTH_SESSION_MISSING' || err.status === 422 || err.message?.includes('session')) {
        setErrorMsg('連結已過期或狀態異常，請聯繫管理員重新發送邀請');
      } else {
        setErrorMsg(err.message || '更新失敗，請稍候重試');
      }
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
