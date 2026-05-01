import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EDUCATION_STAGES } from '../data/appData';
import { LAYOUT } from '../styles/layout';

gsap.registerPlugin(ScrollTrigger);

/**
 * [A] 視覺資訊備註
 * 角色：全齡課程 (Education Page)
 * 佈局：國小、國中、高中部垂直整合，巨型浮水印 + 1px 橫線分割。
 * 右側 Dot Navigation 提供段落跳轉。
 *
 * 規範修正 (2026-04-27)：
 * - scrollToHash 的 setTimeout 補 clearTimeout cleanup
 *   原本路由快速切換時，timer 在元件 unmount 後仍執行 scrollToHash，
 *   對已卸載的 DOM 操作造成潛在錯誤。
 *   修正：儲存 timer id → cleanup 時 clearTimeout。
 */

const STYLES = {
  wrapper:       'relative flex flex-col w-full min-h-screen bg-[var(--ui-bg)] theme-transition overflow-x-hidden',
  pageNav:       'fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-6 hidden xl:flex',
  dotWrap:       'group flex items-center justify-end gap-4 cursor-pointer',
  dotLabel:      'text-xs font-bold tracking-widest text-[var(--text-sub)] opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0',
  dot:           'w-2 h-2 rounded-full border border-[var(--ui-border)] transition-all duration-300',
  dotActive:     'bg-[var(--brand-primary)] border-[var(--brand-primary)] scale-150',
  section:       'relative flex flex-col items-center py-32 w-full border-t border-[var(--ui-border)] first:border-none theme-transition md:py-48',
  watermark:     'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] font-black text-transparent [-webkit-text-stroke:1px_var(--ui-border)] uppercase tracking-widest opacity-20 select-none pointer-events-none z-0',
  sectionHeader: 'relative z-10 flex flex-col items-center mb-24 px-6 text-center',
  sectionTitle:  'text-5xl font-black text-[var(--brand-primary)] theme-transition mb-4 tracking-wider md:text-6xl',
  sectionDesc:   'text-sm tracking-[0.2em] text-[var(--text-sub)] uppercase',
  grid:          'grid grid-cols-1 gap-8 w-full max-w-7xl mx-auto px-6 relative z-10 md:grid-cols-2 lg:gap-12',
  card:          'group relative flex flex-col p-8 border border-[var(--ui-border)] bg-[var(--ui-bg)] theme-transition shadow-sm transition-all duration-500 hover:border-[var(--brand-primary)] hover:shadow-xl md:p-10',
  cardHeader:    'flex justify-between items-start mb-6',
  cardCategory:  'px-3 py-1 text-xs tracking-widest uppercase rounded-full bg-[var(--ui-border)] text-[var(--text-main)] theme-transition',
  cardLevel:     'text-xs tracking-widest font-bold text-[var(--text-sub)]',
  cardTitle:     'text-3xl font-bold text-[var(--text-main)] mb-4 theme-transition transition-colors group-hover:text-[var(--brand-primary)]',
  cardDesc:      'text-sm leading-relaxed text-[var(--text-sub)] mb-8 theme-transition',
  detailsList:   'flex flex-col gap-4 mt-auto',
  detailItem:    'flex flex-col border-t border-[var(--ui-border)] pt-4 theme-transition',
  detailLabel:   'text-[10px] text-[var(--text-sub)] uppercase tracking-widest mb-2',
  detailContent: 'text-sm font-medium text-[var(--text-main)] theme-transition',
  hoverLine:     'absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[var(--brand-primary)] transition-all duration-500 group-hover:w-full',
} as const;

export const EducationPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeHash, setActiveHash] = useState(EDUCATION_STAGES[0].id);
  const location = useLocation();

  // IntersectionObserver — 更新 Dot Navigation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(entry.target.id);
            window.history.replaceState(null, '', `#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3 }
    );
    const sections = containerRef.current?.querySelectorAll('section');
    sections?.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  // GSAP 進場動畫
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.edu-card');
      cards.forEach((card) => {
        gsap.from(card, {
          scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
          y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
        });
      });
      const watermarks = gsap.utils.toArray<HTMLElement>('.edu-watermark');
      watermarks.forEach((wm) => {
        gsap.to(wm, {
          scrollTrigger: { trigger: wm.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 },
          y: -100,
        });
      });
    }, containerRef);
    return () => { ctx.revert(); ScrollTrigger.refresh(); };
  }, []);

  const scrollToHash = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // [修正] hash 變化時 setTimeout 補 clearTimeout cleanup
  // 原本路由快速切換時 timer 在 unmount 後仍執行，對已卸載 DOM 操作
  useEffect(() => {
    if (location.hash) {
      const id = setTimeout(() => {
        scrollToHash(location.hash.replace('#', ''));
      }, 100);
      return () => clearTimeout(id); // ← 補 cleanup
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  return (
    <div className={STYLES.wrapper} ref={containerRef}>
      <h1 className="sr-only">欣育全齡課程體系</h1>

      {/* Dot Navigation */}
      <nav className={STYLES.pageNav} aria-label="全齡課程快捷導航">
        <ul className="flex flex-col gap-6">
          {EDUCATION_STAGES.map((stage) => (
            <li key={`dot-${stage.id}`}>
              <button
                className={STYLES.dotWrap}
                onClick={() => scrollToHash(stage.id)}
                aria-label={`跳轉至 ${stage.title}`}
                aria-current={activeHash === stage.id ? 'location' : undefined}
              >
                <span className={STYLES.dotLabel}>{stage.title}</span>
                <span className={`${STYLES.dot} ${activeHash === stage.id ? STYLES.dotActive : ''}`} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sections */}
      {EDUCATION_STAGES.map((stage) => (
        <section id={stage.id} key={stage.id} className={STYLES.section}>
          <div className={`${STYLES.watermark} edu-watermark`} aria-hidden="true">
            {stage.watermark}
          </div>
          <header className={STYLES.sectionHeader}>
            <h2 className={STYLES.sectionTitle}>{stage.title}</h2>
            <p className={STYLES.sectionDesc}>{stage.desc}</p>
          </header>
          <div className={STYLES.grid}>
            {stage.data.map((course) => {
              const isMono = stage.theme === 'monochrome';
              return (
                <article key={course.id} className={`${STYLES.card} edu-card`}>
                  <header className={STYLES.cardHeader}>
                    <span className={`${STYLES.cardCategory} ${isMono ? 'bg-neutral-800 text-white border-transparent' : ''}`}>
                      {course.category}
                    </span>
                    <span className={STYLES.cardLevel}>{course.level}</span>
                  </header>
                  <h3 className={STYLES.cardTitle}>{course.title}</h3>
                  <p className={STYLES.cardDesc}>{course.desc}</p>
                  <div className={STYLES.detailsList}>
                    <div className={STYLES.detailItem}>
                      <span className={STYLES.detailLabel}>師資陣容</span>
                      <span className={STYLES.detailContent}>{course.teachers?.join(' / ')}</span>
                    </div>
                    <div className={STYLES.detailItem}>
                      <span className={STYLES.detailLabel}>收費標準</span>
                      <span className={STYLES.detailContent}>{course.price}</span>
                    </div>
                    <div className={STYLES.detailItem}>
                      <span className={STYLES.detailLabel}>課程大綱</span>
                      <ul className="flex flex-col gap-1 mt-1">
                        {course.syllabus?.map((wk, i) => (
                          <li key={i} className="text-sm text-[var(--text-sub)] theme-transition">- {wk}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className={`${STYLES.hoverLine} ${isMono ? 'bg-neutral-800' : ''}`} aria-hidden="true" />
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
