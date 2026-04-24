import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Delete, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 櫃檯專用打卡頁面 (Layer 05) - 優化版 v2
 * 視覺語言：圓角設計、高對比、1px Border。
 * 空間優化：增加按鈕間距 (mt-10) 與底部留白 (mb-32)。
 */

const STYLES = {
  wrapper: 'flex flex-col items-center justify-center min-h-screen w-full max-w-lg mx-auto px-4 py-20',
  card: 'w-full bg-white border border-black/10 rounded-[2.5rem] p-10 md:p-16 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] mb-32 theme-transition',
  header: 'flex justify-between items-start mb-12',
  title: 'text-3xl font-black tracking-tighter uppercase',
  subtitle: 'text-[10px] font-bold tracking-[0.2em] text-neutral-400 uppercase mt-1',
  display: 'w-full h-28 bg-neutral-50 border border-black/5 rounded-3xl flex items-center justify-center text-5xl font-black tracking-[0.2em] mb-12 theme-transition',
  keypadGrid: 'grid grid-cols-3 gap-4 w-full',
  letterGrid: 'grid grid-cols-6 gap-2 w-full mt-4 mb-10',
  key: 'h-20 flex items-center justify-center bg-white border border-black/5 rounded-2xl text-xl font-bold hover:bg-black hover:text-white transition-all active:scale-95 shadow-sm',
  letterKey: 'h-14 flex items-center justify-center bg-neutral-50 border border-black/5 rounded-xl text-sm font-black hover:bg-black hover:text-white transition-all active:scale-95',
  actionKey: 'h-20 flex items-center justify-center bg-neutral-100 border border-black/5 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-red-500 hover:text-white transition-all',
  // 增加 mt-10 確保與上方按鍵有足夠呼吸空間
  submitBtn: 'w-full mt-10 h-20 bg-black text-white rounded-3xl flex items-center justify-center gap-4 text-sm font-black tracking-[0.3em] uppercase hover:opacity-90 transition-all disabled:opacity-30 shadow-xl',
  statusOverlay: 'fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center',
  statusIcon: 'w-24 h-24 mb-6',
  statusTitle: 'text-4xl font-black mb-4 uppercase tracking-tighter',
  statusText: 'text-base font-medium text-neutral-500 mb-10',
} as const;

export const CheckIn = () => {
  const [studentNo, setStudentNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [studentName, setStudentName] = useState('');
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (studentNo.length < 12) {
      setStudentNo(prev => (prev + key).toUpperCase());
    }
  };

  const handleDelete = () => setStudentNo(prev => prev.slice(0, -1));
  const handleClear = () => setStudentNo('');

  const handleSubmit = async () => {
    if (!studentNo || isSubmitting) return;
    setIsSubmitting(true);
    try {
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
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className={STYLES.wrapper}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={STYLES.card}
      >
        <div className={STYLES.header}>
          <div>
            <h1 className={STYLES.title}>學生簽到</h1>
            <p className={STYLES.subtitle}>櫃檯自助簽到系統</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="p-4 bg-neutral-50 rounded-2xl hover:bg-black hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className={STYLES.display}>
          {studentNo || <span className="opacity-5 text-3xl tracking-normal">A1001...</span>}
        </div>

        {/* 字母快速輸入區 (常用字母) */}
        <div className={STYLES.letterGrid}>
          {['A', 'B', 'C', 'S', 'T', 'H'].map(char => (
            <button key={char} onClick={() => handleKeyPress(char)} className={STYLES.letterKey}>
              {char}
            </button>
          ))}
        </div>

        {/* 數字鍵盤區 */}
        <div className={STYLES.keypadGrid}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} onClick={() => handleKeyPress(num.toString())} className={STYLES.key}>
              {num}
            </button>
          ))}
          <button onClick={handleClear} className={STYLES.actionKey}>清除</button>
          <button onClick={() => handleKeyPress('0')} className={STYLES.key}>0</button>
          <button onClick={handleDelete} className={STYLES.actionKey}>
            <Delete size={24} />
          </button>
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={!studentNo || isSubmitting}
          className={STYLES.submitBtn}
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
          {isSubmitting ? '處理中...' : '確認簽到'}
        </button>
      </motion.div>

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
                    initial={{ scale: 0 }} animate={{ scale: 1.2 }}
                    className="absolute inset-0 bg-green-500/10 rounded-full -z-10"
                  />
                </div>
                <h2 className={STYLES.statusTitle}>簽到成功</h2>
                <p className={STYLES.statusText}><span className="text-black font-black text-xl block mb-2">{studentName}</span>{message}</p>
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
