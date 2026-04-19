import React from 'react';
import { CAMPUS_DATA } from '../../data/appData';

/**
 * [A] 視覺資訊備註
 * 活動錦集列表元件 (Layer 03 - 模式層)
 * - 從原本的「精選作品」重構為「活動錦集」，資料直接由 CAMPUS_DATA 驅動
 * - Mobile First: 預設手機版單欄垂直排列 (flex-col)。
 * - 桌機版: 平板以上轉為並排 (md:flex-row)。
 * - Hover: 嚴禁使用 JS onMouseOver，純粹使用 Tailwind group-hover 實作遮罩與資訊升起。
 * - 防 CLS: img 標籤設定完全 (aspect-ratio, width, height, loading, decoding)。
 */

// 無 GSAP 動畫，故免除 GSAP_SELECTORS

// [B] 樣式常數（Tailwind 順序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper: 'flex flex-col w-full mt-16 theme-transition',
  header: 'mb-8',
  sectionTitle: 'text-2xl font-bold text-[var(--brand-primary)] theme-transition',
  listContainer: 'flex flex-col gap-6 w-full md:flex-row md:flex-wrap',
  
  // Card
  card: 'group relative flex flex-col w-full overflow-hidden rounded-xl bg-[var(--ui-white)] border border-[var(--ui-border)] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] theme-transition',
  figure: 'relative flex w-full aspect-[4/3] overflow-hidden bg-[var(--ui-bg)] theme-transition',
  
  // Image (防 CLS)
  image: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 grayscale group-hover:grayscale-0 theme-transition',
  
  // Hover Overlay
  overlay: 'absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 theme-transition',
  infoBox: 'flex flex-col translate-y-4 transition-transform duration-300 group-hover:translate-y-0 theme-transition',
  title: 'text-xl font-bold text-[var(--theme-white)] theme-transition',
  category: 'mt-2 text-sm text-[var(--theme-white)] opacity-80 theme-transition',
} as const;

// [C] 元件主體
export const WorkList: React.FC = () => {
  return (
    <section className={STYLES.wrapper} aria-label="活動錦集">
      <header className={STYLES.header}>
        <h2 className={STYLES.sectionTitle}>活動錦集 (Activity Gallery)</h2>
      </header>

      <div className={STYLES.listContainer}>
        {CAMPUS_DATA.gallery.slice(0, 6).map((work) => (
          <article key={work.id} className={STYLES.card}>
            <figure className={STYLES.figure}>
              {/* 防 CLS 圖片保護 */}
              <img
                src={work.url}
                alt={work.alt}
                loading="lazy"
                decoding="async"
                width={800}
                height={600}
                className={STYLES.image}
                referrerPolicy="no-referrer"
              />
              {/* CSS 純 Hover 遮罩 */}
              <figcaption className={STYLES.overlay}>
                <div className={STYLES.infoBox}>
                  <h3 className={STYLES.title}>{work.title}</h3>
                  <p className={STYLES.category}>{work.alt}</p>
                </div>
              </figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
};
