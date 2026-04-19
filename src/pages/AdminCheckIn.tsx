import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { LAYOUT } from '../styles/layout';
import { Scan, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * [A] 視覺資訊備註
 * 頁面：AdminCheckIn
 * 角色：教職員專用動態 QRCode 簽到板
 * 視覺：延續 Kiki Design 乾淨高黑白對比，無邊框 QRcode，顯眼倒數計時。
 */

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-[80vh] w-full',
  container: 'flex flex-col items-center p-12 bg-[var(--ui-white)] border border-[var(--brand-primary)] shadow-2xl rounded-3xl max-w-lg w-full',
  header: 'flex items-center gap-3 mb-8',
  title: 'text-3xl font-black tracking-widest text-[var(--brand-primary)]',
  qrWrapper: 'p-6 bg-white border-2 border-[var(--brand-primary)] rounded-2xl flex items-center justify-center mb-8 relative',
  timerBox: 'flex items-center gap-2 mt-6 px-6 py-3 bg-[var(--ui-bg)] rounded-full border border-[var(--ui-border)]',
  timerText: 'text-lg font-bold font-mono tracking-widest',
} as const;

const REFRESH_INTERVAL = 30; // 30秒更新一次

export const AdminCheckIn: React.FC = () => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(REFRESH_INTERVAL);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      // Replace hardcoded check with Supabase profiles table check
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
          setIsAdmin(true);
      } else {
          // If not admin and visiting this page, redirect them.
          navigate('/staff/dashboard');
      }
    };
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!isAdmin) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimestamp(Date.now());
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAdmin]);

  if (!isAdmin) return null;

  // The url that employees will scan and go to
  const baseUrl = window.location.origin;
  const qrUrl = `${baseUrl}/staff/check-in?t=${timestamp}`;

  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.container}>
        <div className={STYLES.header}>
          <Scan size={32} className="text-[var(--brand-primary)]" />
          <h1 className={STYLES.title}>員工遷到系統</h1>
        </div>
        
        <p className="text-[var(--text-sub)] text-sm mb-8 tracking-widest text-center">
          請使用手機開啟相機掃描下方 QRCode<br />
          進行當日簽到與簽退
        </p>

        <div className={STYLES.qrWrapper}>
          <QRCodeSVG 
            value={qrUrl} 
            size={240} 
            level="H"
            fgColor="var(--brand-primary)"
            bgColor="transparent"
          />
          {/* Scan Line effect could go here */}
        </div>

        <div className={STYLES.timerBox}>
          <Clock size={18} className="text-[var(--brand-primary)] animate-pulse" />
          <span className={`${STYLES.timerText} ${timeLeft <= 5 ? 'text-red-500' : 'text-[var(--brand-primary)]'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mt-2">QRCode 每 {REFRESH_INTERVAL} 秒自動更新以確保安全</p>
      </div>
    </div>
  );
};
