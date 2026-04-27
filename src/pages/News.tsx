import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Tag, Calendar, ChevronRight, X, ChevronLeft } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/**
 * [A] 視覺資訊備註
 * 角色：公告中心 (News Page)
 * 視覺：黑白高對比、極簡卡片、分頁瀏覽。
 *
 * P1 修正 (2026-04-25)：
 * - GSAP gsap.fromTo 包入 gsap.context()，useEffect cleanup 加 ctx.revert()
 *   防止分頁切換殘留動畫污染新頁面卡片
 * - STYLES 全面重排：Layout → Visual → State → Responsive
 * - card：flex flex-col 移至 Layout 區首；cursor- / transition- / hover: 歸入 State 區
 */

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority?: boolean;
}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  section:    'pt-32 pb-24 px-4 max-w-[1400px] mx-auto md:px-12',
  // [P1 FIX] grid 屬於 Layout 區，gap 緊接
  grid:       'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',

  // [P1 FIX] flex flex-col 移至 Layout 首；cursor- / transition- / hover: 歸入 State 區
  card:       'group relative flex flex-col p-8 bg-white border border-[var(--ui-border)] shadow-sm cursor-pointer transition-all duration-500 hover:shadow-xl',
  latestCard: 'lg:col-span-2 lg:row-span-1',

  // [P1 FIX] inline-flex / items- / gap- 屬 Layout；px-,py- 屬 Visual；mb- 尾端
  tag:        'inline-flex items-center gap-1.5 px-3 py-1 mb-4 bg-black text-white text-[9px] font-black tracking-[0.2em] uppercase',
  // [P1 FIX] flex / items- / gap- 屬 Layout；mt-auto / pt- / border-t 歸 Visual；text- / uppercase 歸 Visual
  date:       'flex items-center gap-2 mt-auto pt-6 border-t border-black/5 text-[10px] font-mono text-neutral-400 uppercase',
  // [P1 FIX] text-2xl / font- 屬 Visual；group-hover: 歸 State
  title:      'text-2xl font-black leading-tight mb-3 transition-colors group-hover:text-[var(--brand-primary)]',
  excerpt:    'flex-1 mb-6 text-sm font-light leading-relaxed text-neutral-500 line-clamp-3',

  // Pagination
  pagination: 'flex justify-center items-center gap-6 mt-16 pt-10 border-t border-[var(--ui-border)]',
  // [P1 FIX] flex / items- / gap- 屬 Layout；px-,py- / border 屬 Visual；transition- / hover: / disabled: 歸 State
  pageBtn:    'flex items-center gap-2 px-6 py-3 border border-black text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-black hover:text-white disabled:opacity-20 disabled:pointer-events-none',

  // Modal
  // [P1 FIX] fixed / inset- / z- / flex 屬 Layout；bg- / backdrop- 屬 Visual
  modalOverlay:  'fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md',
  // [P1 FIX] w- / max-w- / flex / flex-col / overflow- / max-h- / p- 屬 Layout；bg- / border / shadow- 屬 Visual
  modalContent:  'relative flex flex-col overflow-hidden max-h-[90vh] w-full max-w-3xl p-8 bg-white border border-black shadow-[0_0_50px_rgba(0,0,0,0.1)] md:p-12',
  modalLine:     'absolute top-0 left-0 w-full h-1 bg-black',
  modalBody:     'flex-1 overflow-y-auto pr-4 mt-6',
} as const;

export const News: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page,          setPage]          = useState(0);
  const [total,         setTotal]         = useState(0);
  const [viewingDetail, setViewingDetail] = useState<Announcement | null>(null);
  const [isLoading,     setIsLoading]     = useState(true);

  const itemsPerPage   = 10;
  const containerRef   = useRef<HTMLDivElement>(null);
  // [P1 FIX] ctx ref：讓 cleanup 能正確拿到 gsap.context 參考
  const gsapCtxRef     = useRef<ReturnType<typeof gsap.context> | null>(null);

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const from = page * itemsPerPage;
      const { data, count, error } = await supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + itemsPerPage - 1);

      if (!error && data) {
        setAnnouncements(data);
        setTotal(count || 0);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // [P1 FIX] GSAP 動畫包入 gsap.context，cleanup 加 ctx.revert()
  // 原始問題：分頁切換後，上一頁殘留的 GSAP 動畫 target 仍指向舊 DOM，
  // 新頁面卡片出現時會觸發舊 fromTo，造成視覺閃爍
  useEffect(() => {
    if (!announcements.length || !containerRef.current) return;

    // 先清除上一次的 context，防止多次 effect 累積
    gsapCtxRef.current?.revert();

    gsapCtxRef.current = gsap.context(() => {
      gsap.fromTo(
        '.news-card',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out' }
      );
    }, containerRef); // scope 限定在 containerRef 內，不污染全域

    return () => {
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, [announcements]);

  return (
    <div className={STYLES.section}>
      <header className="mb-16 border-b border-black/5 pb-10">
        <div className="flex items-center gap-3 mb-4 text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase">
          <Clock size={12} aria-hidden="true" /> Academic Portal
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase leading-[0.9] md:text-6xl">
          公告中心<br /><br />
          <span className="text-stroke text-block">Announcements</span>
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
                {/* 透明全覆蓋按鈕提升點擊面積，不影響視覺 */}
                <button
                  className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                  onClick={() => setViewingDetail(ann)}
                  aria-label={`查看公告詳情：${ann.title}`}
                />
                <div className="flex flex-col h-full">
                  <header>
                    <span className={STYLES.tag}>
                      <Tag size={10} aria-hidden="true" /> {ann.priority ? '重要通知' : '一般公告'}
                    </span>
                    <h2 className={STYLES.title}>{ann.title}</h2>
                  </header>

                  <p className={STYLES.excerpt}>{ann.content}</p>

                  <div className={STYLES.date}>
                    <Calendar size={10} aria-hidden="true" />
                    {new Date(ann.created_at)
                      .toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
                      .replace(/\//g, '.')}
                    <div className="ml-auto transition-transform group-hover:translate-x-1">
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {announcements.length === 0 && !isLoading && (
              <div className="col-span-full py-20 text-center text-neutral-400 font-light italic">
                暫時沒有可顯示的公告。
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Pagination */}
        <div className={STYLES.pagination}>
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className={STYLES.pageBtn}
            aria-label="上一頁"
          >
            <ChevronLeft size={16} /> PREV
          </button>

          <div className="flex flex-col items-center">
            <span className="mb-1 text-[10px] font-black tracking-widest text-black/20">PAGE</span>
            <span className="text-xl font-black text-black">
              {page + 1}{' '}
              <span className="text-xs font-medium text-black/30">
                / {Math.max(1, Math.ceil(total / itemsPerPage))}
              </span>
            </span>
          </div>

          <button
            disabled={(page + 1) * itemsPerPage >= total}
            onClick={() => setPage((p) => p + 1)}
            className={STYLES.pageBtn}
            aria-label="下一頁"
          >
            NEXT <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
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

              <button
                onClick={() => setViewingDetail(null)}
                aria-label="關閉公告詳情"
                className="absolute top-8 right-8 z-10 p-2 transition-transform duration-500 hover:rotate-90"
              >
                <X size={24} />
              </button>

              <div className="mb-6">
                <span className={STYLES.tag}>
                  {viewingDetail.priority ? '重要通知' : '學務公告'}
                </span>
                <p className="mt-4 text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                  POSTED ON{' '}
                  {new Date(viewingDetail.created_at)
                    .toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    .replace(/\//g, '.')}
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tighter uppercase leading-none md:text-5xl">
                  {viewingDetail.title}
                </h2>
              </div>

              <div className={STYLES.modalBody}>
                <div className="whitespace-pre-wrap text-base font-light leading-relaxed text-neutral-600 md:text-lg">
                  {viewingDetail.content}
                </div>
              </div>

              <div className="flex justify-end mt-12 pt-8 border-t border-black/5">
                <button
                  onClick={() => setViewingDetail(null)}
                  className="px-12 py-4 bg-black text-white text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:scale-105 active:scale-95 shadow-xl"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
