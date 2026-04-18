import React from 'react';
import { COURSES_DATA } from '../../data/appData';

/**
 * [A] 視覺資訊備註
 * 元件角色：欣育文理 課程介紹區塊 (Course Sections)。
 * 視覺特性：運用 RWD (Mobile First) 針對不同設備優化體驗。
 * 手機版使用垂直推疊 (flex-col)，平板以上展開均分網格 (grid-cols-3)。
 * Hover 互動採用 css group-hover 完成輕盈升級感。
 */

// 無 GSAP 複雜動畫掛載，純屬 CSS 層互動。
// const GSAP_SELECTORS = {}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:     'flex flex-col w-full my-20 px-6 theme-transition',
  header:      'flex flex-col items-center mb-12 text-center',
  title:       'text-3xl font-bold tracking-tight text-[var(--brand-primary)] md:text-4xl theme-transition',
  subtitle:    'mt-4 text-base text-[var(--text-sub)] max-w-2xl theme-transition',
  grid:        'grid grid-cols-1 gap-6 w-full max-w-7xl mx-auto md:grid-cols-3 lg:gap-10',
  
  // Card
  card:        'group flex flex-col p-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl theme-transition duration-300 hover:-translate-y-2 hover:shadow-xl',
  cardHeader:  'flex justify-between items-center mb-6',
  levelBadge:  'px-3 py-1 text-xs font-bold rounded-full theme-transition', // 背景與字色由資料的 colorToken 引入
  cardTitle:   'text-2xl font-bold text-[var(--brand-primary)] theme-transition',
  cardDesc:    'flex-1 text-sm leading-relaxed text-[var(--text-sub)] mb-8 theme-transition',
  
  // Features List
  featureList: 'flex flex-col gap-3 pt-6 border-t border-[var(--ui-border)] theme-transition',
  featureItem: 'flex items-center text-sm font-medium text-[var(--brand-primary)] theme-transition',
  featureIcon: 'flex-shrink-0 w-1.5 h-1.5 mr-3 rounded-full bg-[var(--brand-accent)] theme-transition duration-300 group-hover:scale-150',
} as const;

// [C] 元件主體
export const CourseList: React.FC = () => {
  return (
    <section className={STYLES.wrapper} aria-labelledby="courses-heading">
      <header className={STYLES.header}>
        <h2 id="courses-heading" className={STYLES.title}>陪伴成長的學習路徑</h2>
        <p className={STYLES.subtitle}>
          針對不同階段的學子，我們量身打造無縫轉接的數位課程陣列。
        </p>
      </header>
      
      <div className={STYLES.grid} role="list">
        {COURSES_DATA.map((course) => (
          <article key={course.id} className={STYLES.card} role="listitem">
            <header className={STYLES.cardHeader}>
              <h3 className={STYLES.cardTitle}>{course.title}</h3>
              <span className={`${STYLES.levelBadge} ${course.colorToken}`}>
                {course.level}
              </span>
            </header>
            
            <p className={STYLES.cardDesc}>{course.desc}</p>
            
            <ul className={STYLES.featureList} aria-label={`${course.title} 課程特色`}>
              {course.features.map((feature, idx) => (
                <li key={idx} className={STYLES.featureItem}>
                  <span className={STYLES.featureIcon} aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};
