import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
 *
 * P0 修正 (2026-04-25)：
 * - 補全 Honors useEffect cleanup：animationRef.current?.kill() + observer.disconnect()
 * - 路由切換時確保 GSAP tween 完全釋放，不殘留於記憶體
 */

const STYLES = {
  wrapper: 'flex flex-col w-full min-h-screen bg-[var(--ui-bg)] theme-transition pt-24',

  // Section Defaults
  section: 'relative w-full py-24 border-b border-[var(--ui-border)] last:border-b-0 theme-transition overflow-hidden md:py-32',
  sectionHeader: 'flex flex-col items-center mb-16 px-6 text-center',
  sectionTitle: 'text-4xl font-black text-[var(--brand-primary)] tracking-widest uppercase mb-4 theme-transition md:text-5xl',
  sectionDesc: 'text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase',

  // 1. Campus Section
  campusGrid: `${LAYOUT.container} grid grid-cols-1 gap-12 md:grid-cols-2 lg:gap-24`,
  campusCard: 'flex flex-col p-8 border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:border-[var(--brand-primary)] transition-colors duration-500 theme-transition',
  campusName: 'text-2xl font-bold text-[var(--brand-primary)] mb-6 theme-transition',
  campusInfoList: 'flex flex-col gap-4 mb-8',
  campusInfoRow: 'flex items-center gap-3 text-[var(--text-main)] theme-transition',
  campusIcon: 'text-[var(--text-sub)]',
  campusLink: 'text-sm font-medium hover:text-[var(--hsinyu-blue)] transition-colors theme-transition',
  campusFeatures: 'flex flex-wrap gap-2 mt-auto',
  campusTag: 'px-3 py-1 text-xs tracking-widest text-[var(--text-sub)] border border-[var(--ui-border)] rounded-full theme-transition',

  // 2. Honors Section (Horizontal Marquee)
  honorsContainer: 'relative w-full overflow-hidden py-12',
  honorsTrack: 'flex w-max',
  honorsCard: 'flex flex-col shrink-0 w-[300px] p-8 mx-4 border border-[var(--ui-border)] bg-[var(--ui-bg)] theme-transition',
  honorsYear: 'text-xs font-bold tracking-widest text-[var(--hsinyu-blue)] mb-2',
  honorsTitle: 'text-xl font-black text-[var(--brand-primary)] mb-4 theme-transition',
  honorsName: 'text-lg font-bold text-[var(--text-main)] mb-2 theme-transition',
  honorsDesc: 'text-sm text-[var(--text-sub)] theme-transition',

  // 3. Gallery (Bento Grid)
  bentoGrid: `${LAYOUT.container} grid grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-0`,
  bentoItem: 'group relative overflow-hidden bg-[var(--ui-border)] aspect-square md:aspect-auto',
  bentoImg: 'w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105',
  bentoOverlay: 'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
  bentoTitle: 'text-lg font-bold tracking-widest text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0',

  // Specific Bento Span Logic
  bentoSpan2x2: 'md:col-span-2 md:row-span-2',
  bentoSpan2x1: 'md:col-span-2 md:row-span-1',
  bentoSpan1x2: 'md:col-span-1 md:row-span-2',
  bentoSpan1x1: 'md:col-span-1 md:row-span-1',
} as const;

export const CampusPage: React.FC = () => {
  const honorsTrackRef = useRef<HTMLDivElement>(null);
  // [P0] animationRef 持有 tween 參考，確保 cleanup 時能完整 kill
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Handling anchor scroll
    if (location.hash) {
      setTimeout(() => {
        const id = location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          const topPos = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  useEffect(() => {
    // [視覺體驗] 初始化 Honors 自動橫向無限滾動
    if (!honorsTrackRef.current) return;

    const track = honorsTrackRef.current;

    // 複製子元素以達到無限輪播效果
    track.innerHTML += track.innerHTML;

    // [視覺體驗] 使用 xPercent 達成無縫無限滾動
    animationRef.current = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 30,
      repeat: -1,
    });

    // [P0] 效能防線：IntersectionObserver 離開視野時暫停動畫，節省 GPU 資源
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

    // [P0 FIXED] 完整 cleanup：
    // 1. observer.disconnect()  — 停止 IntersectionObserver 監聽
    // 2. animationRef.kill()   — 徹底釋放 GSAP Tween，防止路由切換後殘留
    // 3. ScrollTrigger.refresh — 防止捲動尺寸殘留（若其他動畫有依賴）
    return () => {
      observer.disconnect();
      animationRef.current?.kill();
      animationRef.current = null;
      ScrollTrigger.refresh();
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
                  <a
                    href={loc.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={STYLES.campusLink}
                    aria-label={`查看${loc.name} Google Map`}
                  >
                    {loc.address}
                  </a>
                </div>
                <div className={STYLES.campusInfoRow}>
                  <Phone className={STYLES.campusIcon} size={18} />
                  <a
                    href={`tel:${loc.tel}`}
                    className={STYLES.campusLink}
                    aria-label={`撥打${loc.name}電話`}
                  >
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

        {/* aria-hidden：跑馬燈為裝飾性內容，靜態清單可另行提供 */}
        <div className={STYLES.honorsContainer} aria-hidden="true">
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
            // Bento Grid 跨欄邏輯：根據索引分配不同 span，製造錯落感
            let spanClass: string = STYLES.bentoSpan1x1;
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
