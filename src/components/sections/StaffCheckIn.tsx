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

type ToastType = 'success' | 'error';

interface StaffCheckInProps {
  onToast?: (message: string, type?: ToastType) => void;
}

// 地點修改：406臺中市北屯區中清東一街31號
// 經緯度參考：24.1972742, 120.719938
// 校區範圍可依需求調整（100 公尺）
const SCHOOL_LOCATION = {
  lat: 24.1972742,
  lng: 120.719938,
  radiusMeters: 100,
};

const STYLES = {
  root: 'h-full w-full bg-transparent flex flex-col',
  statusBadge:
    'px-2 py-1 rounded-full text-[8px] md:text-[7px] font-black tracking-[0.16em] uppercase border',
  actionBtn:
    'h-14 md:h-11 rounded-xl flex flex-col items-center justify-center gap-1 text-[8px] md:text-[7px] font-black tracking-[0.2em] uppercase transition-all duration-300 border',
} as const;

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadius = 6371000;
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaPhi = toRadians(lat2 - lat1);
  const deltaLambda = toRadians(lon2 - lon1);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

export const StaffCheckIn: React.FC<StaffCheckInProps> = ({ onToast }) => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(
          latitude,
          longitude,
          SCHOOL_LOCATION.lat,
          SCHOOL_LOCATION.lng,
        );

        setLocation({ lat: latitude, lng: longitude });
        setDistanceMeters(distance);
        setIsLocating(false);
      },
      (geoError) => {
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? '請允許定位權限後再嘗試。'
            : '定位失敗，請檢查網路與 GPS。';
        setError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  };

  useEffect(() => {
    locate();
  }, []);

  const handleCheckAction = async (checkType: 'in' | 'out') => {
    if (!supabase) {
      onToast?.('尚未設定 Supabase。', 'error');
      return;
    }

    if (!location || !isInRange || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('無法辨識目前登入者。');
      }

      const { error: insertError } = await supabase.from('staff_attendance').insert([
        {
          staff_id: user.id,
          check_type: checkType,
          location_lat: location.lat,
          location_lng: location.lng,
        },
      ]);

      if (insertError) {
        throw insertError;
      }

      const actionText = checkType === 'in' ? '上班打卡完成' : '下班打卡完成';
      setLastActionText(`${actionText}・${new Date().toLocaleTimeString('zh-TW', { hour12: false })}`);
      onToast?.(actionText, 'success');
    } catch (checkError: any) {
      const message = checkError?.message || '打卡失敗，請稍後再試。';
      setError(message);
      onToast?.(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={STYLES.root}>
      <div className="mb-3 md:mb-2 flex items-center justify-between">
        <span className="text-[10px] font-black tracking-[0.2em] text-black/40 uppercase">
          員工打卡
        </span>
        <span
          className={`${STYLES.statusBadge} ${
            isLocating
              ? 'border-black/15 text-black/40'
              : isInRange
                ? 'border-emerald-500 text-emerald-600'
                : 'border-red-500 text-red-500'
          }`}
        >
          {isLocating ? '定位中' : isInRange ? '校區範圍內' : '超出範圍'}
        </span>
      </div>

      <div className="mb-3 md:mb-2 flex items-center gap-2 text-[11px] md:text-[10px] font-medium text-[var(--text-sub)]">
        <MapPin size={14} />
        {distanceMeters !== null ? (
          <span>
            目前距離校區（406臺中市北屯區中清東一街31號）{Math.round(distanceMeters)}公尺（範圍 {SCHOOL_LOCATION.radiusMeters}公尺）
          </span>
        ) : (
          <span>尚未取得定位</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleCheckAction('in')}
          disabled={!isInRange || isLocating || isSubmitting}
          className={`${STYLES.actionBtn} ${
            isInRange
              ? 'bg-black text-white border-black hover:bg-neutral-800'
              : 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
          <span>上班打卡</span>
        </button>

        <button
          onClick={() => handleCheckAction('out')}
          disabled={!isInRange || isLocating || isSubmitting}
          className={`${STYLES.actionBtn} ${
            isInRange
              ? 'bg-black text-white border-black hover:bg-neutral-800'
              : 'bg-neutral-50 text-neutral-300 border-neutral-100 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}
          <span>下班打卡</span>
        </button>
      </div>

      <div className="mt-2 min-h-[18px] text-[10px]">
        {error ? (
          <div className="flex items-center gap-1 text-red-500">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        ) : (
          <motion.span
            key={lastActionText || 'idle'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-emerald-600"
          >
            {lastActionText || (isLocating ? '定位中...' : '請完成上下班打卡')}
          </motion.span>
        )}
      </div>

      <button
        onClick={locate}
        className="mt-2 inline-flex items-center gap-1 text-[8px] font-black tracking-[0.16em] uppercase text-black/30 hover:text-black transition-colors"
      >
        <RefreshCcw size={11} />
        重新取得定位
      </button>
    </div>
  );
};
