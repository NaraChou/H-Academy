import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { motion, AnimatePresence } from 'motion/react';
import { Clock, Tag, Calendar, ChevronRight, X, ChevronLeft } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  priority?: boolean;
}

const STYLES = {
  section: 'pt-32 pb-24 px-4 md:px-12 max-w-[1400px] mx-auto',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  card: 'group relative bg-white border border-[var(--ui-border)] p-8 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col',
  latestCard: 'lg:col-span-2 lg:row-span-1',
  tag: 'inline-flex items-center gap-1.5 px-3 py-1 mb-4 text-[9px] font-black tracking-[0.2em] text-white bg-black uppercase',
  date: 'flex items-center gap-2 text-[10px] font-mono text-neutral-400 mt-auto pt-6 border-t border-black/5 uppercase',
  title: 'text-2xl font-black mb-3 group-hover:text-[var(--brand-primary)] transition-colors leading-tight',
  excerpt: 'text-sm text-neutral-500 leading-relaxed font-light line-clamp-3 mb-6',
  
  // Pagination
  pagination: 'flex justify-center items-center gap-6 mt-16 pt-10 border-t border-[var(--ui-border)]',
  pageBtn: 'flex items-center gap-2 px-6 py-3 border border-black text-[10px] font-black tracking-[0.3em] uppercase transition-all hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black',
  
  // Modal
  modalOverlay: 'fixed inset-0 z-[500] bg-black/40 backdrop-blur-md flex items-center justify-center p-4',
  modalContent: 'w-full max-w-3xl bg-white border border-black p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.1)] relative overflow-hidden max-h-[90vh] flex flex-col',
  modalLine: 'absolute top-0 left-0 w-full h-1 bg-black',
  modalBody: 'flex-1 overflow-y-auto pr-4 custom-scrollbar mt-6',
};

export const News: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [viewingDetail, setViewingDetail] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 10;
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const from = page * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, count, error } = await supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

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

  useEffect(() => {
    if (announcements.length > 0 && containerRef.current) {
        gsap.fromTo('.news-card', 
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power4.out' }
        );
    }
  }, [announcements]);

  return (
    <div className={STYLES.section}>
      <header className="mb-16 border-b border-black/5 pb-10">
        <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] text-neutral-400 uppercase mb-4">
          <Clock size={12} /> Academic Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
          公告中心<br/><br/>
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
	                className={`${STYLES.card} ${idx === 0 && page === 0 ? STYLES.latestCard : ''}`}
	              >
                  <button 
                    className="absolute inset-0 w-full h-full z-10 opacity-0 cursor-pointer"
                    onClick={() => setViewingDetail(ann)}
                    aria-label={`查看公告詳情：${ann.title}`}
                  />
                <div className="flex flex-col h-full">
                  <header>
                    <span className={STYLES.tag}>
                      <Tag size={10} /> {ann.priority ? '重要通知' : '一般公告'}
                    </span>
                    <h2 className={STYLES.title}>{ann.title}</h2>
                  </header>
                  
                  <p className={STYLES.excerpt}>
                    {ann.content}
                  </p>

                  <div className={STYLES.date}>
                    <Calendar size={10} />
                    {new Date(ann.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                    <div className="ml-auto group-hover:translate-x-1 transition-transform">
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
	            onClick={() => setPage(p => p - 1)}
	            className={STYLES.pageBtn}
              aria-label="上一頁"
	          >
	            <ChevronLeft size={16} /> PREV
	          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black tracking-widest text-black/20 mb-1">PAGE</span>
            <span className="text-xl font-black text-black">
              {page + 1} <span className="text-xs font-medium text-black/30">/ {Math.max(1, Math.ceil(total / itemsPerPage))}</span>
            </span>
          </div>

	          <button 
	            disabled={(page + 1) * itemsPerPage >= total}
	            onClick={() => setPage(p => p + 1)}
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
              onClick={e => e.stopPropagation()}
            >
              <div className={STYLES.modalLine} />
              
	              <button 
	                onClick={() => setViewingDetail(null)}
	                className="absolute top-8 right-8 p-2 hover:rotate-90 transition-transform duration-500 z-10"
                  aria-label="關閉公告詳情"
	              >
	                <X size={24} />
	              </button>

              <div className="mb-6">
                <span className={STYLES.tag}>
                  {viewingDetail.priority ? '重要通知' : '學務公告'}
                </span>
                <p className="text-[10px] font-mono tracking-widest text-neutral-400 mt-4 uppercase">
                  POSTED ON {new Date(viewingDetail.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                </p>
                <h2 className="text-3xl md:text-5xl font-black mt-4 leading-none tracking-tighter uppercase">
                  {viewingDetail.title}
                </h2>
              </div>

              <div className={STYLES.modalBody}>
                <div className="prose prose-neutral max-w-none text-neutral-600 leading-relaxed font-light">
                  <div className="whitespace-pre-wrap text-base md:text-lg">
                    {viewingDetail.content}
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-black/5 flex justify-end">
                <button 
                  onClick={() => setViewingDetail(null)}
                  className="px-12 py-4 bg-black text-white text-[10px] font-black tracking-[0.3em] uppercase hover:scale-105 active:scale-95 transition-all shadow-xl"
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
