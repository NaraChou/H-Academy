import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Delete, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 櫃檯專用打卡頁面 (Layer 05) - P2 修正 v2.1
 * 視覺語言：圓角設計、高對比、1px Border。
 * 空間優化：增加按鈕間距 (mt-10) 與底部留白 (mb-32)。
 *
 * P2 修正 (2026-04-25)：
 * - handleSubmit 加入 supabase null check（原本直接呼叫 supabase.from() 無防禦）
 * - 未設定 Supabase 時顯示明確錯誤訊息，不讓頁面靜默崩潰
 * - STYLES 排序微調：transition- / hover: / disabled: 統一歸入 State 區
 */

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:      'flex flex-col items-center justify-center min-h-screen w-full max-w-lg mx-auto px-4 py-20',
  card:         'w-full mb-32 p-10 bg-white border border-black/10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] theme-transition md:p-16',
  header:       'flex justify-between items-start mb-12',
  title:        'text-3xl font-black tracking-tighter uppercase',
  subtitle:     'mt-1 text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase',
  display:      'flex items-center justify-center w-full h-28 mb-12 bg-neutral-50 border border-black/5 rounded-3xl text-5xl font-black tracking-[0.2em] theme-transition',

  // 字母快速輸入
  letterGrid:   'grid grid-cols-6 gap-2 w-full mt-4 mb-10',
  letterKey:    'flex items-center justify-center h-14 bg-neutral-50 border border-black/5 rounded-xl text-sm font-black transition-all active:scale-95 hover:bg-black hover:text-white',

  // 數字鍵盤
  keypadGrid:   'grid grid-cols-3 gap-4 w-full',
  key:          'flex items-center justify-center h-20 bg-white border border-black/5 rounded-2xl shadow-sm text-xl font-bold transition-all active:scale-95 hover:bg-black hover:text-white',
  actionKey:    'flex items-center justify-center h-20 bg-neutral-100 border border-black/5 rounded-2xl text-[10px] font-black tracking-widest uppercase transition-all hover:bg-red-500 hover:text-white',

  // 送出按鈕
  // [P2] disabled: 歸入 State 區尾端
  submitBtn:    'flex items-center justify-center gap-4 w-full mt-10 h-20 bg-black text-white rounded-3xl text-sm font-black tracking-[0.3em] uppercase shadow-xl transition-all hover:opacity-90 disabled:opacity-30',

  // 狀態覆蓋層
  statusOverlay:'fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 bg-white/95 text-center backdrop-blur-sm',
  statusTitle:  'text-4xl font-black tracking-tighter uppercase mb-4',
  statusText:   'text-base font-medium text-neutral-500 mb-10',
} as const;

// 字母快捷鍵（學號常見前綴字母）
const LETTER_KEYS = ['A', 'B', 'C', 'S', 'T', 'H'] as const;

// 數字鍵盤排列
const NUMBER_KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const CheckIn = () => {
  const [studentNo,    setStudentNo]    = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status,       setStatus]       = useState<'idle' | 'success' | 'error'>('idle');
  const [message,      setMessage]      = useState('');
  const [studentName,  setStudentName]  = useState('');
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // [視覺體驗] 狀態覆蓋層自動 3 秒後重置，讓下一位同學可以繼續打卡
  useEffect(() => {
    if (status !== 'idle') {
      timerRef.current = setTimeout(() => {
        setStatus('idle');
        setStudentNo('');
        setStudentName('');
        setMessage('');
      }, 3000);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [status]);

  const handleKeyPress = (key: string) => {
    if (status !== 'idle') return;
    if (studentNo.length < 12) setStudentNo((prev) => (prev + key).toUpperCase());
  };

  const handleDelete = () => setStudentNo((prev) => prev.slice(0, -1));
  const handleClear  = () => setStudentNo('');

  const handleSubmit = async () => {
    if (!studentNo || isSubmitting) return;

    // [P2 FIX] supabase null check
    // 原始問題：supabase 未設定時直接呼叫 supabase.from() 會靜默崩潰（TypeError）
    // 修正：明確檢查並顯示友善錯誤訊息
    if (!supabase) {
      setStatus('error');
      setMessage('系統尚未連線，請聯繫管理員確認 Supabase 設定。');
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1：查詢學號對應的學生 profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('student_no', studentNo.toUpperCase())
        .single();

      if (profileError || !profile) {
        setStatus('error');
        setMessage(`找不到學號 [${studentNo}]，請確認輸入是否正確。`);
        return;
      }

      // Step 2：寫入打卡紀錄
      setStudentName(profile.full_name || '學生');
      const { error: checkInError } = await supabase
        .from('attendance_logs')
        .insert([{ student_id: profile.id, check_type: 'in' }]);

      if (checkInError) throw checkInError;

      setStatus('success');
      setMessage('簽到成功！歡迎來到欣育。');
    } catch (err) {
      setStatus('error');
      setMessage('系統連線異常，請聯繫管理員。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={STYLES.wrapper}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={STYLES.card}
      >
        {/* Header */}
        <div className={STYLES.header}>
          <div>
            <h1 className={STYLES.title}>學生簽到</h1>
            <p className={STYLES.subtitle}>櫃檯自助簽到系統</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="返回儀表板"
            className="p-4 bg-neutral-50 rounded-2xl transition-all hover:bg-black hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* 學號顯示區 */}
        <div className={STYLES.display}>
          {studentNo || <span className="text-3xl tracking-normal opacity-5">A1001...</span>}
        </div>

        {/* 字母快速輸入區 */}
        <div className={STYLES.letterGrid}>
          {LETTER_KEYS.map((char) => (
            <button
              key={char}
              onClick={() => handleKeyPress(char)}
              aria-label={`輸入字母 ${char}`}
              className={STYLES.letterKey}
            >
              {char}
            </button>
          ))}
        </div>

        {/* 數字鍵盤 */}
        <div className={STYLES.keypadGrid}>
          {NUMBER_KEYS.map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              aria-label={`輸入數字 ${num}`}
              className={STYLES.key}
            >
              {num}
            </button>
          ))}
          <button onClick={handleClear} aria-label="清除所有輸入" className={STYLES.actionKey}>清除</button>
          <button onClick={() => handleKeyPress('0')} aria-label="輸入數字 0" className={STYLES.key}>0</button>
          <button onClick={handleDelete} aria-label="刪除最後一個字元" className={STYLES.actionKey}>
            <Delete size={24} />
          </button>
        </div>

        {/* 確認送出 */}
        <button
          onClick={handleSubmit}
          disabled={!studentNo || isSubmitting}
          aria-label="確認簽到"
          className={STYLES.submitBtn}
        >
          {isSubmitting
            ? <Loader2 className="animate-spin" size={20} />
            : <UserCheck size={20} />}
          {isSubmitting ? '處理中...' : '確認簽到'}
        </button>
      </motion.div>

      {/* 狀態覆蓋層 */}
      <AnimatePresence>
        {status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={STYLES.statusOverlay}
          >
            {status === 'success' ? (
              <>
                <div className="relative mb-8">
                  <CheckCircle2 className="w-32 h-32 text-green-500" />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.2 }}
                    className="absolute inset-0 -z-10 rounded-full bg-green-500/10"
                  />
                </div>
                <h2 className={STYLES.statusTitle}>簽到成功</h2>
                <p className={STYLES.statusText}>
                  <span className="block mb-2 text-xl font-black text-black">{studentName}</span>
                  {message}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="w-32 h-32 text-red-500 mb-8" />
                <h2 className={STYLES.statusTitle}>簽到失敗</h2>
                <p className={STYLES.statusText}>{message}</p>
              </>
            )}
            <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-neutral-300 uppercase">
              <div className="w-8 h-[1px] bg-neutral-200" />
              自動重置中
              <div className="w-8 h-[1px] bg-neutral-200" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
