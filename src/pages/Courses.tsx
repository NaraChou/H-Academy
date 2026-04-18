import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { COURSE_CATEGORIES, COURSES_DATA } from '../data/appData';
import { LAYOUT } from '../styles/layout';

/**
 * [A] 視覺資訊備註
 * 元件角色：課程資訊分頁 (Courses Page)
 * 佈局特性：極簡白與 Void Mode 兼容，單/雙欄瀑布流交錯排版。
 * GSAP Selectors：
 *  - hero-title: 進場 1px 空心字淡入
 *  - course-card: GSAP 透明度過濾切換
 */

const GSAP_SELECTORS = {
  heroTitle: 'courses-hero-title',
  courseCard: 'courses-item-card',
} as const;

const STYLES = {
  wrapper: 'flex flex-col w-full min-h-screen theme-transition',
  
  // Hero
  hero: 'flex flex-col justify-center items-center py-24 md:py-32 w-full',
  heroTitle: 'text-6xl md:text-8xl font-black text-transparent [-webkit-text-stroke:1px_var(--text-main)] theme-transition tracking-widest uppercase',
  heroDesc: 'mt-6 text-sm tracking-[0.2em] text-[var(--text-sub)] uppercase theme-transition',

  // Filter
  filterContainer: 'flex flex-wrap justify-center gap-4 mb-16 px-6',
  filterBtn: 'px-6 py-2 rounded-full border border-[var(--ui-border)] text-sm transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] text-[var(--text-sub)] theme-transition',
  filterBtnActive: 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-[var(--ui-bg)]',

  // Grid
  grid: 'grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 w-full max-w-6xl mx-auto px-6 mb-32',

  // Card
  card: 'group relative flex flex-col p-8 bg-[var(--ui-bg)] border border-[var(--ui-border)] theme-transition hover:border-[var(--hsinyu-blue)] transition-colors duration-500 overflow-hidden',
  cardHeader: 'flex justify-between items-start mb-6',
  cardCategory: 'px-3 py-1 text-xs tracking-wider rounded-full bg-[var(--ui-border)] text-[var(--text-main)] theme-transition',
  cardLevel: 'text-xs text-[var(--text-sub)]',
  cardTitle: 'text-3xl font-bold text-[var(--brand-primary)] mb-4 theme-transition',
  cardDesc: 'text-sm leading-relaxed text-[var(--text-sub)] mb-6 theme-transition',
  
  // Details list
  detailsList: 'flex flex-col gap-4 mt-auto',
  detailItem: 'flex flex-col border-t border-[var(--ui-border)] pt-4 theme-transition',
  detailLabel: 'text-xs text-[var(--text-sub)] uppercase tracking-widest mb-2',
  detailContent: 'text-sm font-medium text-[var(--text-main)] theme-transition',
  
  // Outline stretching effect
  hoverLine: 'absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-[var(--hsinyu-blue)] transition-all duration-500 group-hover:w-full',
} as const;

export const CoursesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('全部課程');
  const heroRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredCourses = activeCategory === '全部課程' 
    ? COURSES_DATA 
    : COURSES_DATA.filter(c => c.category === activeCategory || c.level === activeCategory);

  // 初次進場：Hero 標題淡入
  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.from(`.${GSAP_SELECTORS.heroTitle}`, {
        y: 50,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });
      gsap.from(`.${GSAP_SELECTORS.courseCard}`, {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // 過濾動畫 (Filter Transition)
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    let ctx = gsap.context(() => {
      // 先讓當前的卡片隱藏
      gsap.fromTo(`.${GSAP_SELECTORS.courseCard}`, 
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' }
      );
    }, el);

    return () => ctx.revert();
  }, [activeCategory]);

  return (
    <div className={STYLES.wrapper} ref={heroRef as any}>
      {/* Hero Section */}
      <header className={STYLES.hero}>
        <h1 className={`${GSAP_SELECTORS.heroTitle} ${STYLES.heroTitle}`}>COURSES</h1>
        <p className={STYLES.heroDesc}>引領未來的全方位學習計畫</p>
      </header>

      {/* Filter Section */}
      <nav className={STYLES.filterContainer} aria-label="課程分類過濾">
        {COURSE_CATEGORIES.map(category => (
          <button
            key={category}
            className={`${STYLES.filterBtn} ${activeCategory === category ? STYLES.filterBtnActive : ''}`}
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
          >
            {category}
          </button>
        ))}
      </nav>

      {/* Courses Grid */}
      <section ref={gridRef} className={STYLES.grid} aria-label="課程列表">
        {filteredCourses.map(course => (
          <article key={course.id} className={`${GSAP_SELECTORS.courseCard} ${STYLES.card}`}>
            <header className={STYLES.cardHeader}>
              <span className={STYLES.cardCategory}>{course.category}</span>
              <span className={STYLES.cardLevel}>{course.level}</span>
            </header>
            
            <h2 className={STYLES.cardTitle}>{course.title}</h2>
            <p className={STYLES.cardDesc}>{course.desc}</p>
            
            <div className={STYLES.detailsList}>
              <div className={STYLES.detailItem}>
                <span className={STYLES.detailLabel}>師資陣容</span>
                <span className={STYLES.detailContent}>{course.teachers?.join(', ')}</span>
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

            {/* Hover Outline Effect */}
            <div className={STYLES.hoverLine} aria-hidden="true" />
          </article>
        ))}
      </section>
    </div>
  );
};
