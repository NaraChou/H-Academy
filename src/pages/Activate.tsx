import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * [A] 視覺資訊備註
 * 頁面：帳號啟用與密碼設定 (Activate & Set Password)
 * 視覺：極簡黑白、1px Border、高對比語彙。
 * 邏輯：處理邀請連結的 Session 驗證與初始密碼設定。
 */

// [B] 樣式常數 (定義在導出之前，確保作用域最優先讀取)
const STYLES = {
  wrapper:    'flex flex-col items-center justify-center min-h-screen w-full px-6 py-20 bg-white',
  card:       'flex flex-col items-center w-full max-w-md p-10 bg-white border border-black shadow-sm',
  iconWrap:   'flex items-center justify-center w-20 h-20 rounded-full border border-black mb-8',
  title:      'text-2xl font-black tracking-tight text-black text-center mb-3 uppercase',
  desc:       'text-sm text-gray-500 text-center leading-relaxed mb-8',
  form:       'w-full space-y-6',
  inputGroup: 'relative border-b border-black py-2 focus-within:border-gray-400 transition-colors',
  input:      'appearance-none bg-transparent border-none w-full text-black mr-3 py-2 px-1 leading-tight focus:outline-none text-sm',
  button:     'w-full py-4 bg-black text-white hover:bg-gray-800 transition-all uppercase tracking-widest text-xs font-bold disabled:opacity-50',
  errorBox:   'mt-4 p-3 bg-red-50 border border-red-100 text-red-500 text-xs italic w-full'
};

// [C] 核心元件：使用具名導出 (Named Export) 以匹配 App.tsx
export const Activate: React.FC = () => {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // [D] 初始身分檢查 (元件的記憶)
  useEffect(() => {
    const initCheck = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // 成功抓取 Session 代表邀請連結有效
        if (data.session) {
          setStatus('form');
        } else {
          setStatus('error');
          setErrorMsg('邀請連結已失效或已逾期。');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || '驗證失敗');
      }
    };
    initCheck();
  }, []);

  // [E] 連動效果：提交密碼並啟用帳號
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('密碼長度需至少 6 個字元');
      return;
    }

    setStatus('loading');
    try {
      // 1. 更新使用者密碼
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. 更新 Profile 狀態為 active (轉正)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ status: 'active' })
          .eq('id', user.id);
      }

      setStatus('success');
      // 視覺停留 2 秒後跳轉
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || '啟用失敗');
    }
  };

  return (
    <main className={STYLES.wrapper} aria-label="Activate Account Page">
      <div className={STYLES.card}>
        
        {/* 狀態：處理中 */}
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className={STYLES.iconWrap}>
              <Loader2 className="animate-spin text-black" size={32} />
            </div>
            <h1 className={STYLES.title}>處理中</h1>
          </div>
        )}

        {/* 狀態：設定密碼表單 */}
        {status === 'form' && (
          <>
            <div className={STYLES.iconWrap}><Lock size={32} /></div>
            <h1 className={STYLES.title}>設定密碼</h1>
            <p className={STYLES.desc}>請為您的帳號設定初始登入密碼。</p>
            
            <form onSubmit={handleActivate} className={STYLES.form}>
              <div className={STYLES.inputGroup}>
                <input
                  type="password"
                  placeholder="新密碼"
                  className={STYLES.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {errorMsg && <div className={STYLES.errorBox}>{errorMsg}</div>}
              <button type="submit" className={STYLES.button}>啟用帳號</button>
            </form>
          </>
        )}

        {/* 狀態：成功 */}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className={STYLES.iconWrap}><CheckCircle2 size={32} /></div>
            <h1 className={STYLES.title}>成功</h1>
            <p className={STYLES.desc}>密碼設定成功，即將跳轉...</p>
          </div>
        )}

        {/* 狀態：失敗 */}
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className={`${STYLES.iconWrap} border-red-500`}>
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className={STYLES.title}>錯誤</h1>
            <p className={STYLES.desc}>{errorMsg}</p>
            <button onClick={() => navigate('/login')} className={STYLES.button}>返回登入頁</button>
          </div>
        )}

      </div>
    </main>
  );
};