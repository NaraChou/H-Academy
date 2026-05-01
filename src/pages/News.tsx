import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Tag, Calendar, ChevronRight, X, ChevronLeft } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/**
 * [A] 視覺資訊備註
 * 頁面：公告中心 (News Page)
 *
 * 規範修正 (2026-04-27)：
 * - fetchAnnouncements 補 isMountedRef 防護
 *   分頁切換時 fetch 在元件 unmount 後可能觸發 setAnnouncements。
 *   修正：useRef 追蹤 mount 狀態，setState 前先確認。
 * - GSAP 進場包入 gsap.context()，補 ctx.revert() cleanup。
 */

interface Announcement {
  id: string; title: string; content: string; created_at: string; priority?: boolean;
}

const STYLES = {
  section:      'pt-32 pb-24 px-4 md:px-12 max-w-[1400px] mx-auto',
  grid:         'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  card:         'group relative flex flex-col p-8 bg-white border border-[var(--ui-border)] shadow-sm transition-all duration-500 cursor-pointer hover:shadow-xl',
  latestCard:   'lg:col-span-2 lg:row-span-1',
  tag:          'inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-[9px] font-black tracking-[0.2em] text-white bg-black uppercase',
  date:         'flex items-center gap-2 mt-auto pt-6 border-t border-black/5 text-[10px] font-mono text-neutral-400 uppercase',
  cardTitle:    'text-2xl font-black mb-3 leading-tight transition-colors group-hover:text-[var(--brand-primary)]',
  excerpt:      'text-sm leading-relaxed font-light text-neutral-500 mb-6 line-clamp-3',
  pagination:   'flex justify-center items-center gap-6 mt-16 pt-10 border-t border-[var(--ui-border)]',
  pageBtn:      'flex items-center gap-2 px-6 py-3 border border-black text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black',
  modalOverlay: 'fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md',
  modalContent: 'relative flex flex-col w-full max-w-3xl bg-white border border-black p-8 shadow-[0_0_50px_rgba(0,0,0,0.1)] overflow-hidden max-h-[90vh] md:p-12',
  modalLine:    'absolute top-0 left-0 w-full h-1 bg-black',
  modalBody:    'flex-1 overflow-y-auto pr-4 mt-6',
} as const;

export const News: React.FC = () => {
  // [修正] isMountedRef 追蹤 mount 狀態
  const isMountedRef  = useRef(true);
  const containerRef  = useRef<HTMLDivElement>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page,          setPage]          = useState(0);
  const [total,         setTotal]         = useState(0);
  const [viewingDetail, setViewingDetail] = useState<Announcement | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // [修正] fetch 加 isMountedRef 守衛
  const fetchAnnouncements = async () => {
    if (!supabase) return;
    if (isMountedRef.current) setIsLoading(true);
    try {
      const from = page * itemsPerPage;
      const { data, count, error } = await supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('priority',   { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + itemsPerPage - 1);

      if (!isMountedRef.current) return; // unmount 後不 setState
      if (!error && data) { setAnnouncements(data); setTotal(count || 0); }
    } catch (err) {
      console.error('News fetch error:', err);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // [修正] GSAP 包入 context，補 cleanup
  useEffect(() => {
    if (!announcements.length || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.news-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out' }
      );
    }, containerRef);
    return () => { ctx.revert(); };
  }, [announcements]);

  return (
    <div className={STYLES.section}>
      <header className="mb-16 pb-10 border-b border-black/5">
        <div className="flex items-center gap-3 mb-4 text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase">
          <Clock size={12} aria-hidden="true" /> Academic Portal
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] md:text-6xl">
          公告中心<br /><br />
          <span className="opacity-20">Announcements</span>
        </h1>
      </header>

      <div ref={containerRef} className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className={STYLES.grid}
          >
            {announcements.map((ann, idx) => (
              <article
                key={ann.id}
                className={`news-card ${STYLES.card} ${idx === 0 && page === 0 ? STYLES.latestCard : ''}`}
              >
                <button
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  onClick={() => setViewingDetail(ann)}
                  aria-label={`查看公告詳情：${ann.title}`}
                />
                <div className="flex flex-col h-full">
                  <header>
                    <span className={STYLES.tag}>
                      <Tag size={10} aria-hidden="true" />
                      {ann.priority ? '重要通知' : '一般公告'}
                    </span>
                    <h2 className={STYLES.cardTitle}>{ann.title}</h2>
                  </header>
                  <p className={STYLES.excerpt}>{ann.content}</p>
                  <div className={STYLES.date}>
                    <Calendar size={10} aria-hidden="true" />
                    {new Date(ann.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                    <div className="ml-auto transition-transform group-hover:translate-x-1"><ChevronRight size={14} aria-hidden="true" /></div>
                  </div>
                </div>
              </article>
            ))}
            {announcements.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center text-neutral-400 italic font-light">暫時沒有可顯示的公告。</div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className={STYLES.pagination}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className={STYLES.pageBtn} aria-label="上一頁"><ChevronLeft size={16} aria-hidden="true" /> PREV</button>
          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-black tracking-widest text-black/20">PAGE</span>
            <span className="text-xl font-black text-black">{page + 1}<span className="text-xs font-medium text-black/30"> / {Math.max(1, Math.ceil(total / itemsPerPage))}</span></span>
          </div>
          <button disabled={(page + 1) * itemsPerPage >= total} onClick={() => setPage((p) => p + 1)} className={STYLES.pageBtn} aria-label="下一頁">NEXT <ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </div>

      {/* 詳情 Modal */}
      <AnimatePresence>
        {viewingDetail && (
          <div className={STYLES.modalOverlay} onClick={() => setViewingDetail(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={STYLES.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={STYLES.modalLine} />
              <button onClick={() => setViewingDetail(null)} className="absolute top-8 right-8 p-2 z-10 transition-transform duration-500 hover:rotate-90" aria-label="關閉公告詳情"><X size={24} aria-hidden="true" /></button>
              <header className="mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black tracking-[0.2em] text-white bg-black uppercase">{viewingDetail.priority ? '重要通知' : '學務公告'}</span>
                <p className="mt-4 text-[10px] font-mono tracking-widest text-neutral-400 uppercase">POSTED ON {new Date(viewingDetail.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}</p>
                <h2 className="mt-4 text-3xl font-black leading-none tracking-tighter uppercase md:text-5xl">{viewingDetail.title}</h2>
              </header>
              <div className={STYLES.modalBody}>
                <div className="whitespace-pre-wrap text-base font-light leading-relaxed text-neutral-600 md:text-lg">{viewingDetail.content}</div>
              </div>
              <div className="flex justify-end mt-12 pt-8 border-t border-black/5">
                <button onClick={() => setViewingDetail(null)} className="px-12 py-4 bg-black text-white text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:scale-105 active:scale-95 shadow-xl">Close View</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
