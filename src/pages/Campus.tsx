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
 *
 * P0 修正 (2026-04-25)：補全 useEffect cleanup
 *
 * 版面修正 (2026-04-27)：
 * - campusGrid 加入 md:items-stretch → 兩欄等高
 * - campusCard 加入 h-full → 卡片撐滿 grid row 高度
 *   修正前：台北校功能較少，卡片比新北校矮一截
 *   修正後：兩張卡片底部對齊，視覺整齊
 */

const STYLES = {
  wrapper: 'flex flex-col w-full min-h-screen bg-[var(--ui-bg)] theme-transition pt-24',

  section:       'relative w-full py-24 border-b border-[var(--ui-border)] last:border-b-0 theme-transition overflow-hidden md:py-32',
  sectionHeader: 'flex flex-col items-center mb-16 px-6 text-center',
  sectionTitle:  'text-4xl font-black text-[var(--brand-primary)] tracking-widest uppercase mb-4 theme-transition md:text-5xl',
  sectionDesc:   'text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase',

  // 1. Campus
  // [修正] md:items-stretch — 讓兩欄高度撐齊
  campusGrid:     `${LAYOUT.container} grid grid-cols-1 gap-12 md:grid-cols-2 md:items-stretch lg:gap-24`,
  // [修正] h-full — 卡片高度撐滿 row，短卡片與長卡片等高
  campusCard:     'flex flex-col h-full p-8 border border-[var(--ui-border)] bg-[var(--ui-bg)] transition-colors duration-500 theme-transition hover:border-[var(--brand-primary)]',
  campusName:     'text-2xl font-bold text-[var(--brand-primary)] mb-6 theme-transition',
  campusInfoList: 'flex flex-col gap-4 mb-8',
  campusInfoRow:  'flex items-center gap-3 text-[var(--text-main)] theme-transition',
  campusIcon:     'text-[var(--text-sub)]',
  campusLink:     'text-sm font-medium transition-colors theme-transition hover:text-[var(--hsinyu-blue)]',
  // mt-auto 把 tags 推到底部，兩欄卡片的 tag 列對齊
  campusFeatures: 'flex flex-wrap gap-2 mt-auto',
  campusTag:      'px-3 py-1 border border-[var(--ui-border)] rounded-full text-xs tracking-widest text-[var(--text-sub)] theme-transition',

  // 2. Honors
  honorsContainer: 'relative w-full overflow-hidden py-12',
  honorsTrack:     'flex w-max',
  honorsCard:      'flex flex-col shrink-0 w-[300px] p-8 mx-4 border border-[var(--ui-border)] bg-[var(--ui-bg)] theme-transition',
  honorsYear:      'text-xs font-bold tracking-widest text-[var(--hsinyu-blue)] mb-2',
  honorsTitle:     'text-xl font-black text-[var(--brand-primary)] mb-4 theme-transition',
  honorsName:      'text-lg font-bold text-[var(--text-main)] mb-2 theme-transition',
  honorsDesc:      'text-sm text-[var(--text-sub)] theme-transition',

  // 3. Gallery
  bentoGrid:    `${LAYOUT.container} grid grid-cols-2 gap-4 px-4 md:grid-cols-4 md:px-0`,
  bentoItem:    'group relative overflow-hidden bg-[var(--ui-border)] aspect-square md:aspect-auto',
  bentoImg:     'w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105',
  bentoOverlay: 'absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
  bentoTitle:   'text-lg font-bold tracking-widest text-white opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0',

  bentoSpan2x2: 'md:col-span-2 md:row-span-2',
  bentoSpan2x1: 'md:col-span-2 md:row-span-1',
  bentoSpan1x2: 'md:col-span-1 md:row-span-2',
  bentoSpan1x1: 'md:col-span-1 md:row-span-1',
} as const;

export const CampusPage: React.FC = () => {
  const honorsTrackRef = useRef<HTMLDivElement>(null);
  const animationRef   = useRef<gsap.core.Tween | null>(null);
  const location       = useLocation();

  // anchor scroll
  useEffect(() => {
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

  // Honors marquee
  useEffect(() => {
    if (!honorsTrackRef.current) return;
    const track = honorsTrackRef.current;
    track.innerHTML += track.innerHTML;

    animationRef.current = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      duration: 30,
      repeat: -1,
    });

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

    // [P0] 完整 cleanup
    return () => {
      observer.disconnect();
      animationRef.current?.kill();
      animationRef.current = null;
      ScrollTrigger.refresh();
    };
  }, []);

  return (
    <div className={STYLES.wrapper}>

      {/* 1. 分校據點 */}
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

      {/* 2. 英雄榜 */}
      <section id="honors" className={STYLES.section}>
        <header className={STYLES.sectionHeader}>
          <h2 className={STYLES.sectionTitle}>英雄榜</h2>
          <p className={STYLES.sectionDesc}>Hall of Honors</p>
        </header>

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

      {/* 3. 活動集錦 */}
      <section id="gallery" className={STYLES.section}>
        <header className={STYLES.sectionHeader}>
          <h2 className={STYLES.sectionTitle}>活動集錦</h2>
          <p className={STYLES.sectionDesc}>Campus Life Gallery</p>
        </header>

        <div className={STYLES.bentoGrid}>
          {CAMPUS_DATA.gallery.map((img, idx) => {
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
