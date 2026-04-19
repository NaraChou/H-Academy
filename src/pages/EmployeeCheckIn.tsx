import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Loader2, LogIn, LogOut } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 頁面：EmployeeCheckIn
 * 角色：接收掃描參數 (t) 並執行簽到打卡動作。
 * 狀態：驗證中、驗證失敗(過期/未登入)、打卡成功。
 */

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[70vh] w-full px-4',
  card: 'flex flex-col items-center p-8 bg-[var(--ui-white)] border border-[var(--brand-primary)] shadow-xl rounded-3xl w-full max-w-sm text-center',
  title: 'text-2xl font-black tracking-widest text-[var(--brand-primary)] mt-4 mb-2',
  subtitle: 'text-sm text-[var(--text-sub)] mb-8',
  buttonGroup: 'flex flex-col w-full gap-4',
  btnPrimary: 'flex items-center justify-center gap-2 w-full py-4 bg-[var(--brand-primary)] text-white rounded-xl font-bold tracking-widest transition-transform active:scale-95 hover:bg-black/80',
  btnSecondary: 'flex items-center justify-center gap-2 w-full py-4 bg-white border border-[var(--ui-border)] text-[var(--text-main)] rounded-xl font-bold tracking-widest transition-transform active:scale-95 hover:bg-neutral-50',
  statusBox: 'flex flex-col items-center w-full py-8',
} as const;

export const EmployeeCheckIn: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // Validation States
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState<'check_in' | 'check_out' | null>(null);

  useEffect(() => {
    const initCheck = async () => {
      // 1. Check Auth (Must be logged in to check-in)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Encode current search params so login page can redirect back here
        const redirectParams = encodeURIComponent(location.pathname + location.search);
        navigate(`/staff/login?redirect=${redirectParams}`);
        return; // Redirecting, stop execution
      }
      setUser(session.user);

      // 2. Validate URL Timestamp
      const params = new URLSearchParams(location.search);
      const t = params.get('t');

      if (!t) {
        setErrorMsg('無效的簽到連結 (缺少時間憑證)');
        setLoading(false);
        return;
      }

      const qrTimestamp = parseInt(t, 10);
      const now = Date.now();
      const diffInSeconds = (now - qrTimestamp) / 1000;

      // Ensure timestamp is within the last 60 seconds (accounting for 30s refresh + 30s buffer)
      if (diffInSeconds > 60 || diffInSeconds < -5) {
        setErrorMsg('此 QR Code 已過期，請重新掃描系統最新的條碼');
        setIsValid(false);
      } else {
        setIsValid(true);
      }
      
      setLoading(false);
    };

    initCheck();
  }, [location, navigate]);

  const handleAction = async (type: 'check_in' | 'check_out') => {
    if (!user) return;
    setIsSubmitting(true);

    // Calculate tardiness state based on time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    let status = 'Ok';
    if (type === 'check_in') {
      // If after 09:00 exact
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        status = 'Late';
      }
    }

    try {
      // Supabase insertion
      const { error } = await supabase
        .from('attendance_logs')
        .insert([{
          user_id: user.id,
          check_type: type,
          status: status
        }]);

      if (error) {
        console.error('Attendance Log Error:', error);
        setErrorMsg('系統記錄失敗，請聯繫行政主管');
        setIsValid(false);
      } else {
        setSuccessMode(type);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('網路異常，請稍後重試');
      setIsValid(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // View: Loading Validation
  if (loading || isSubmitting) {
    return (
      <div className={STYLES.wrapper}>
        <div className={STYLES.card}>
          <Loader2 className="animate-spin text-[var(--brand-primary)]" size={48} />
          <h2 className={STYLES.title}>處理中</h2>
          <p className={STYLES.subtitle}>正在與安全伺服器溝通...</p>
        </div>
      </div>
    );
  }

  // View: Success
  if (successMode) {
    return (
      <div className={STYLES.wrapper}>
        <div className={STYLES.card}>
          <div className={STYLES.statusBox}>
            <CheckCircle2 size={64} className="text-[#10B981] mb-6" />
            <h2 className="text-2xl font-black text-[var(--brand-primary)] tracking-widest mb-2">
              {successMode === 'check_in' ? '簽到成功' : '簽退成功'}
            </h2>
            <p className="text-[var(--text-sub)]">
              現在時間：{new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={() => navigate('/staff/dashboard')} className={STYLES.btnSecondary}>
            前往個人儀表板
          </button>
        </div>
      </div>
    );
  }

  // View: Error (Expired or Invalid)
  if (!isValid) {
    return (
      <div className={STYLES.wrapper}>
        <div className={STYLES.card}>
          <div className={STYLES.statusBox}>
            <AlertCircle size={64} className="text-[#EF4444] mb-6" />
            <h2 className="text-2xl font-black text-[var(--brand-primary)] tracking-widest mb-2">
              無法打卡
            </h2>
            <p className="text-[#EF4444] font-medium leading-relaxed">{errorMsg}</p>
          </div>
          <button onClick={() => navigate('/staff/dashboard')} className={STYLES.btnSecondary}>
            返回主頁
          </button>
        </div>
      </div>
    );
  }

  // View: Action Selection (Valid QR)
  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.card}>
        <div className="w-16 h-16 rounded-full bg-[var(--ui-bg)] border flex items-center justify-center mb-2">
          <span className="font-bold text-xl">{user?.email?.[0].toUpperCase()}</span>
        </div>
        <h2 className={STYLES.title}>出勤打卡系統</h2>
        <p className={STYLES.subtitle}>
          認證成功，請選擇您的打卡項目
        </p>

        <div className={STYLES.buttonGroup}>
          <button 
            className={STYLES.btnPrimary}
            onClick={() => handleAction('check_in')}
          >
            <LogIn size={20} />
            上班簽到
          </button>
          
          <button 
            className={STYLES.btnSecondary}
            onClick={() => handleAction('check_out')}
          >
            <LogOut size={20} />
            下班簽退
          </button>
        </div>
      </div>
    </div>
  );
};
