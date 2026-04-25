import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HISTORY_DATA, GALLERY_DATA } from '../data/appData';
import { LAYOUT } from '../styles/layout';

gsap.registerPlugin(ScrollTrigger);

/**
 * [A] 視覺資訊備註
 * 關於欣育 (About Page)
 * 負責呈現品牌歷史沿革與空間視覺。
 * 
 * GSAP 白名單：
 * - timeline-item: 歷史時間軸的節點，由兩側交錯浮現
 * - gallery-card: 環境藝廊圖片，支援 Hover state 與底部進場
 */

const GSAP_SELECTORS = {
  timelineItem: 'timeline-item',
  galleryCard: 'gallery-card',
} as const;

const STYLES = {
  wrapper: 'flex flex-col w-full min-h-screen theme-transition overflow-hidden',
  
  // Hero (Brand Gallery Style)
  hero: 'relative flex justify-center items-center w-full min-h-[60vh] py-32 overflow-hidden',
  heroWatermark: 'absolute inset-0 flex justify-center items-center opacity-5 select-none pointer-events-none',
  heroTitle: 'relative z-10 text-6xl md:text-9xl font-black text-transparent [-webkit-text-stroke:1px_var(--text-main)] uppercase tracking-widest text-center px-4',
  heroSubtitle: 'absolute bottom-12 text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase',

  // Timeline (1px spine)
  timelineSection: 'relative w-full py-32 bg-[var(--ui-bg)] theme-transition',
  timelineContainer: `${LAYOUT.container} relative flex flex-col items-center`,
  spine: 'absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-[var(--ui-border)] theme-transition',
  
  timelineRow: 'relative flex w-full my-12 md:my-24 justify-center md:justify-between items-center',
  timelinePoint: 'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--brand-primary)] rounded-full border-[3px] border-[var(--ui-bg)] z-10 theme-transition',
  
  timelineContentLeft: 'w-full md:w-[45%] text-center md:text-right px-8 py-6',
  timelineContentRight: 'w-full md:w-[45%] text-center md:text-left px-8 py-6',
  
  yearText: 'text-4xl md:text-6xl font-black text-transparent [-webkit-text-stroke:1px_var(--text-main)] mb-4 theme-transition opacity-30',
  titleText: 'text-xl md:text-2xl font-bold text-[var(--brand-primary)] mb-2 theme-transition',
  descText: 'text-sm leading-relaxed text-[var(--text-sub)] theme-transition',

  // Gallery
  gallerySection: 'w-full py-32 bg-[var(--brand-primary)] text-[var(--ui-white)] theme-transition',
  galleryContainer: `${LAYOUT.container} flex flex-col gap-16`,
  galleryHeader: 'text-center',
  galleryTitle: 'text-4xl md:text-5xl font-bold tracking-tight mb-4',
  galleryDesc: 'text-sm tracking-widest opacity-70 uppercase',
  
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-[var(--ui-bg)]/20 border border-[var(--ui-bg)]/20',
  galleryItem: 'group relative overflow-hidden aspect-[4/3] bg-[var(--brand-primary)]',
  galleryImg: 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-105',
  galleryOverlay: 'absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100',
  galleryAlt: 'absolute bottom-6 left-6 text-white font-medium tracking-wide translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100',
} as const;

export const AboutPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // [視覺體驗] 初始化 GSAP Context，收集所有 timeline 與 gallery 的動畫
    let ctx = gsap.context(() => {
      
      // 1. 歷年里程碑交錯浮現 (左右側)
      const timelineItems = gsap.utils.toArray<HTMLElement>(`.${GSAP_SELECTORS.timelineItem}`);
      timelineItems.forEach((item, i) => {
        // [視覺體驗] 判斷奇數偶數，決定從左邊(-50)還是右邊(50)滑入
        const xOffset = i % 2 === 0 ? -50 : 50; 
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top 85%',
            toggleActions: 'play none none reverse', // 滾回頂部時能自動恢復，提供重看體驗
          },
          x: xOffset,
          opacity: 0,
          duration: 1.2,
          ease: 'power3.out',
        });
      });

      // 2. 環境藝廊依序浮出
      const galleryCards = gsap.utils.toArray<HTMLElement>(`.${GSAP_SELECTORS.galleryCard}`);
      galleryCards.forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
          y: 60,
          opacity: 0,
          duration: 1,
          ease: 'power3.out',
        });
      });

    }, containerRef);

    // [安全機制] 清理 GSAP Context 與重置 ScrollTrigger
    return () => {
      ctx.revert();
      ScrollTrigger.refresh(); // 防禦路徑切換時留下的滾動條尺寸殘留
    };
  }, []);

  return (
    <div className={STYLES.wrapper} ref={containerRef}>
      
      {/* Hero Section */}
      <section className={STYLES.hero}>
        <div className={STYLES.heroWatermark}>
          <span className="text-[20rem] font-black tracking-tighter mix-blend-overlay opacity-10">HSINYU</span>
        </div>
        <h1 className={STYLES.heroTitle}>ABOUT HSINYU</h1>
        <div className={STYLES.heroSubtitle}>Since 2016</div>
      </section>

	      {/* Timeline Section */}
	      <section className={STYLES.timelineSection} aria-labelledby="timeline-title">
	        <div className={STYLES.timelineContainer}>
            <h2 id="timeline-title" className="sr-only">歷史沿革</h2>
          <div className={STYLES.spine} aria-hidden="true" />
          
          {HISTORY_DATA.map((item, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <article key={idx} className={`${STYLES.timelineRow} ${GSAP_SELECTORS.timelineItem}`}>
                {/* 裝飾性節點 */}
                <div className={STYLES.timelinePoint} aria-hidden="true" />
                
                {/* 佈局黑魔法：利用空白 div 推齊 */}
                {isLeft ? (
                  <>
                    <div className={STYLES.timelineContentLeft}>
                      <div className={STYLES.yearText}>{item.year}</div>
                      <h3 className={STYLES.titleText}>{item.title}</h3>
                      <p className={STYLES.descText}>{item.desc}</p>
                    </div>
                    <div className="hidden md:block md:w-[45%]" />
                  </>
                ) : (
                  <>
                    <div className="hidden md:block md:w-[45%]" />
                    <div className={STYLES.timelineContentRight}>
                      <div className={STYLES.yearText}>{item.year}</div>
                      <h3 className={STYLES.titleText}>{item.title}</h3>
                      <p className={STYLES.descText}>{item.desc}</p>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Gallery Section */}
      <section className={STYLES.gallerySection}>
        <div className={STYLES.galleryContainer}>
          <header className={STYLES.galleryHeader}>
            <h2 className={STYLES.galleryTitle}>環境藝廊</h2>
            <p className={STYLES.galleryDesc}>Campus Environment</p>
          </header>
          
          <div className={STYLES.grid}>
            {GALLERY_DATA.map((item) => (
              <figure key={item.id} className={`${STYLES.galleryItem} ${GSAP_SELECTORS.galleryCard}`}>
                <img 
                  src={item.url} 
                  alt={item.alt}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className={STYLES.galleryImg} 
                />
                <div className={STYLES.galleryOverlay} aria-hidden="true" />
                <figcaption className={STYLES.galleryAlt}>{item.alt}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
