import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MapPin, Phone } from 'lucide-react';
import { CAMPUS_DATA } from '../data/appData';
import { LAYOUT } from '../styles/layout';

gsap.registerPlugin(ScrollTrigger);

/**
 * [A] 視覺資訊備註
 * 角色：分校榮譽 (Campus Page)
 * 佈局：分度儀式感 (橫向區塊切割)
 * - Campus (空間): 極簡向量風格替代複雜實景地圖
 * - Honors (成就): 水平自動輪播跑馬燈，搭載 IntersectionObserver 效能控制
 * - Gallery (動態): Bento Grid 便當盒佈局，Hover 灰階轉彩色
 */

const STYLES = {
  wrapper: 'flex flex-col w-full min-h-screen bg-[var(--ui-bg)] theme-transition pt-24',

  // Section Defaults
  section: 'relative w-full py-24 md:py-32 border-b border-[var(--ui-border)] last:border-b-0 theme-transition overflow-hidden',
  sectionHeader: 'flex flex-col items-center mb-16 text-center px-6',
  sectionTitle: 'text-4xl md:text-5xl font-black text-[var(--brand-primary)] tracking-widest uppercase mb-4 theme-transition',
  sectionDesc: 'text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase',

  // 1. Campus Section
  campusGrid: `${LAYOUT.container} grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24`,
  campusCard: 'flex flex-col p-8 border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:border-[var(--brand-primary)] transition-colors duration-500 theme-transition',
  campusName: 'text-2xl font-bold text-[var(--brand-primary)] mb-6 theme-transition',
  campusInfoList: 'flex flex-col gap-4 mb-8',
  campusInfoRow: 'flex items-center gap-3 text-[var(--text-main)] theme-transition',
  campusIcon: 'text-[var(--text-sub)]',
  campusLink: 'text-sm font-medium hover:text-[var(--hsinyu-blue)] transition-colors theme-transition',
  campusFeatures: 'flex flex-wrap gap-2 mt-auto',
  campusTag: 'px-3 py-1 text-xs tracking-widest text-[var(--text-sub)] border border-[var(--ui-border)] rounded-full theme-transition',

  // Map wireframe aesthetic (pure CSS visual)
  mapWireframeWrap: 'relative w-full aspect-square md:aspect-auto border border-[var(--ui-border)] bg-[var(--ui-white)] overflow-hidden flex items-center justify-center p-8 theme-transition',
  mapWireframeLines: 'absolute inset-0 opacity-10',
  mapCentralDot: 'relative z-10 w-4 h-4 rounded-full bg-[var(--brand-primary)] theme-transition',
  mapPulse: 'absolute inset-0 bg-[var(--brand-primary)] rounded-full animate-ping opacity-20',

  // 2. Honors Section (Horizontal Marquee)
  honorsContainer: 'relative w-full overflow-hidden py-12',
  honorsTrack: 'flex w-max',
  honorsCard: 'flex flex-col shrink-0 w-[300px] p-8 mx-4 border border-[var(--ui-border)] bg-[var(--ui-bg)] theme-transition',
  honorsYear: 'text-xs font-bold tracking-widest text-[var(--hsinyu-blue)] mb-2',
  honorsTitle: 'text-xl font-black text-[var(--brand-primary)] mb-4 theme-transition',
  honorsName: 'text-lg font-bold text-[var(--text-main)] mb-2 theme-transition',
  honorsDesc: 'text-sm text-[var(--text-sub)] theme-transition',

  // 3. Gallery (Bento Grid)
  bentoGrid: `${LAYOUT.container} grid grid-cols-2 md:grid-cols-4 gap-4 px-4 md:px-0`,
  bentoItem: 'group relative overflow-hidden bg-[var(--ui-border)] aspect-square md:aspect-auto',
  bentoImg: 'w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105',
  bentoOverlay: 'absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center',
  bentoTitle: 'text-white text-lg tracking-widest font-bold translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100',
  
  // Specific Bento Span Logic
  bentoSpan2x2: 'md:col-span-2 md:row-span-2',
  bentoSpan2x1: 'md:col-span-2 md:row-span-1',
  bentoSpan1x2: 'md:col-span-1 md:row-span-2',
  bentoSpan1x1: 'md:col-span-1 md:row-span-1',
} as const;

export const CampusPage: React.FC = () => {
  const honorsTrackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // 1. 初始化 Honors 自動橫向滾動
    if (!honorsTrackRef.current) return;

    // 複製子元素以達到無限輪播
    const track = honorsTrackRef.current;
    track.innerHTML += track.innerHTML;

    // [視覺體驗] 使用 xPercent 達成無縫滾動
    animationRef.current = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 30, // 捲動速度
      repeat: -1,
    });

    // 2. [效能防線] 實作 IntersectionObserver：離開視野時暫停動畫，節省運算
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animationRef.current?.play();
          } else {
            animationRef.current?.pause();
          }
        });
      },
      { threshold: 0 }
    );

    observer.observe(track);

    return () => {
      observer.disconnect();
      animationRef.current?.kill();
    };
  }, []);

  return (
    <div className={STYLES.wrapper}>
      
      {/* 1. Campus Locations Section */}
      <section id="locations" className={STYLES.section}>
        <header className={STYLES.sectionHeader}>
          <h1 className={STYLES.sectionTitle}>分校據點</h1>
          <p className={STYLES.sectionDesc}>Campus Locations</p>
        </header>

        <div className={STYLES.campusGrid}>
          {CAMPUS_DATA.locations.map((loc) => (
            <article key={loc.id} className={STYLES.campusCard}>
              <h2 className={STYLES.campusName}>{loc.name}</h2>
              
              <div className={STYLES.campusInfoList}>
                <div className={STYLES.campusInfoRow}>
                  <MapPin className={STYLES.campusIcon} size={18} />
                  <a href={loc.mapUrl} target="_blank" rel="noopener noreferrer" className={STYLES.campusLink} aria-label={`查看${loc.name} Google Map`}>
                    {loc.address}
                  </a>
                </div>
                <div className={STYLES.campusInfoRow}>
                  <Phone className={STYLES.campusIcon} size={18} />
                  <a href={`tel:${loc.tel}`} className={STYLES.campusLink} aria-label={`撥打${loc.name}電話`}>
                    {loc.tel}
                  </a>
                </div>
              </div>

              <div className={STYLES.campusFeatures}>
                {loc.features.map((feat, idx) => (
                  <span key={idx} className={STYLES.campusTag}>{feat}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2. Honors Wall Section */}
      <section id="honors" className={STYLES.section}>
        <header className={STYLES.sectionHeader}>
          <h2 className={STYLES.sectionTitle}>英雄榜</h2>
          <p className={STYLES.sectionDesc}>Hall of Honors</p>
        </header>

        <div className={STYLES.honorsContainer} aria-hidden="true" /* Hide from screen readers as it's a marquee, can provide a static list for accessibility if deeply required */>
          <div className={STYLES.honorsTrack} ref={honorsTrackRef}>
            {CAMPUS_DATA.honors.map((honor, idx) => (
              <article key={idx} className={STYLES.honorsCard}>
                <div className={STYLES.honorsYear}>{honor.year}</div>
                <h3 className={STYLES.honorsTitle}>{honor.title}</h3>
                <div className={STYLES.honorsName}>{honor.name}</div>
                <p className={STYLES.honorsDesc}>{honor.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Gallery (Bento Grid) Section */}
      <section id="gallery" className={STYLES.section}>
        <header className={STYLES.sectionHeader}>
          <h2 className={STYLES.sectionTitle}>活動集錦</h2>
          <p className={STYLES.sectionDesc}>Campus Life Gallery</p>
        </header>

        <div className={STYLES.bentoGrid}>
          {CAMPUS_DATA.gallery.map((img, idx) => {
            // Bento Grid 跨欄邏輯：根據索引分配不同的 span，製造錯落感
            let spanClass = STYLES.bentoSpan1x1;
            if (idx === 0) spanClass = STYLES.bentoSpan2x2;
            else if (idx === 3) spanClass = STYLES.bentoSpan2x1;
            else if (idx === 5) spanClass = STYLES.bentoSpan1x2;

            return (
              <figure key={img.id} className={`${STYLES.bentoItem} ${spanClass}`}>
                <img 
                  src={img.url} 
                  alt={img.alt} 
                  loading="lazy" 
                  decoding="async"
                  // 根據 span 狀況給予合理長寬，防護 CLS
                  width={idx === 0 ? 800 : 400} 
                  height={idx === 0 ? 800 : 400}
                  className={STYLES.bentoImg} 
                />
                <div className={STYLES.bentoOverlay} aria-hidden="true">
                  <span className={STYLES.bentoTitle}>{img.title}</span>
                </div>
              </figure>
            );
          })}
        </div>
      </section>

    </div>
  );
};
