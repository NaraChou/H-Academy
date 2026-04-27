import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  RefreshCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

/**
 * [A] 視覺資訊備註
 * 元件角色：教職員打卡區塊
 * 視覺語言：高對比、圓角、精確資訊展示。
 *
 * P1 修正 (2026-04-25)：
 * - grid Mobile First：grid-cols-1 sm:grid-cols-2
 * - STYLES 全面重排：Layout → Visual → State → Responsive
 *
 * P2 修正 (2026-04-25)：
 * - successMsg text-emerald-600 → text-[var(--color-success)]
 * - errorMsg text-[var(--color-danger)]（與 P1 globals.css Token 對齊）
 * - in-range badge：border-emerald-500 text-emerald-600 → Token 化
 * - 消滅全部 Tailwind 命名色（emerald-*）殘留
 */

type ToastType = 'success' | 'error';

interface StaffCheckInProps {
  onToast?: (message: string, type?: ToastType) => void;
}

const SCHOOL_LOCATION = {
  lat: 24.1751304214824,
  lng: 120.67276787047567,
  radiusMeters: 100,
};

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  root:        'flex flex-col w-full h-full bg-transparent',
  header:      'flex items-center justify-between mb-3 md:mb-2',
  headerLabel: 'text-[10px] font-black tracking-[0.2em] text-black/40 uppercase',
  statusBadge: 'px-2 py-1 border rounded-full text-[8px] font-black tracking-[0.16em] uppercase md:text-[7px]',
  locationInfo:'flex items-center gap-2 mb-3 text-[11px] font-medium text-[var(--text-sub)] md:mb-2 md:text-[10px]',

  // [P1 FIX] Mobile First：手機單欄，sm: 才並排
  grid:        'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-2',
  actionBtn:   'flex flex-col items-center justify-center h-16 border rounded-xl text-[8px] font-black tracking-[0.2em] uppercase transition-all duration-300 disabled:cursor-not-allowed sm:h-11 sm:text-[7px]',

  footer:      'mt-2 min-h-[18px] text-[10px]',
  // [P2 FIX] text-emerald-600 → var(--color-success)
  errorMsg:    'flex items-center gap-1 text-[var(--color-danger)]',
  successMsg:  'block text-[var(--color-success)]',
  refreshBtn:  'inline-flex items-center gap-1 mt-2 text-[8px] font-black tracking-[0.16em] text-black/30 uppercase transition-colors hover:text-black',
} as const;

const toRadians = (v: number) => (v * Math.PI) / 180;

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371000;
  const φ1 = toRadians(lat1), φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1), Δλ = toRadians(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const StaffCheckIn: React.FC<StaffCheckInProps> = ({ onToast }) => {
  const [location,       setLocation]       = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isLocating,     setIsLocating]     = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [lastActionText, setLastActionText] = useState('');

  const isInRange = useMemo(() => {
    if (distanceMeters === null) return false;
    return distanceMeters <= SCHOOL_LOCATION.radiusMeters;
  }, [distanceMeters]);

  const locate = () => {
    if (!navigator.geolocation) {
      const message = '目前裝置不支援定位功能。';
      setError(message);
      onToast?.(message, 'error');
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const distance = getDistanceMeters(latitude, longitude, SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng);
        setLocation({ lat: latitude, lng: longitude });
        setDistanceMeters(distance);
        setIsLocating(false);
      },
      (geoError) => {
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? '請允許定位權限後再嘗試。'
          : '定位失敗，請檢查網路與 GPS。';
        setError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  useEffect(() => { locate(); }, []);

  const handleCheckAction = async (checkType: 'in' | 'out') => {
    if (!supabase) { onToast?.('尚未設定 Supabase。', 'error'); return; }
    if (!location || !isInRange || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('無法辨識目前登入者。');

      const { error: insertError } = await supabase.from('staff_attendance').insert([{
        staff_id:     user.id,
        check_type:   checkType,
        location_lat: location.lat,
        location_lng: location.lng,
      }]);
      if (insertError) throw insertError;

      const actionText = checkType === 'in' ? '上班打卡完成' : '下班打卡完成';
      setLastActionText(`${actionText}・${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`);
      onToast?.(actionText, 'success');
    } catch (err: any) {
      const message = err?.message || '打卡失敗，請稍後再試。';
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // [P2 FIX] badge 樣式：in-range 改用 CSS Token，不硬編碼 emerald-*
  const badgeClass = isLocating
    ? 'border-black/15 text-black/40'
    : isInRange
      ? 'border-[var(--color-success)] text-[var(--color-success)]'
      : 'border-[var(--color-danger)] text-[var(--color-danger)]';

  const btnActiveClass   = 'bg-black text-white border-black hover:bg-neutral-800';
  const btnDisabledClass = 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed';

  return (
    <div className={STYLES.root}>
      <div className={STYLES.header}>
        <span className={STYLES.headerLabel}>員工打卡</span>
        <span className={`${STYLES.statusBadge} ${badgeClass}`}>
          {isLocating ? '定位中' : isInRange ? '校區範圍內' : '超出範圍'}
        </span>
      </div>

      <div className={STYLES.locationInfo}>
        <MapPin size={14} />
        {distanceMeters !== null ? (
          <span>
            目前距離校區（北屯區水湳里018鄰中清東一街３１之４號）{Math.round(distanceMeters)}公尺（範圍 {SCHOOL_LOCATION.radiusMeters}公尺）
          </span>
        ) : (
          <span>尚未取得定位</span>
        )}
      </div>

      <div className={STYLES.grid}>
        <button
          onClick={() => handleCheckAction('in')}
          disabled={!isInRange || isLocating || isSubmitting}
          aria-label="上班打卡"
          className={`${STYLES.actionBtn} ${isInRange ? btnActiveClass : btnDisabledClass}`}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          <span>上班打卡</span>
        </button>

        <button
          onClick={() => handleCheckAction('out')}
          disabled={!isInRange || isLocating || isSubmitting}
          aria-label="下班打卡"
          className={`${STYLES.actionBtn} ${isInRange ? btnActiveClass : btnDisabledClass}`}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          <span>下班打卡</span>
        </button>
      </div>

      <div className={STYLES.footer}>
        {error ? (
          <div className={STYLES.errorMsg}>
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        ) : (
          <motion.span
            key={lastActionText || 'idle'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={STYLES.successMsg}
          >
            {lastActionText || (isLocating ? '定位中...' : '請完成上下班打卡')}
          </motion.span>
        )}
      </div>

      <button onClick={locate} className={STYLES.refreshBtn} aria-label="重新取得定位">
        <RefreshCcw size={11} />
        重新取得定位
      </button>
    </div>
  );
};
