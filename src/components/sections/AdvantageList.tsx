import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ADVANTAGES_DATA } from '../../data/appData';
import { LAYOUT } from '../../styles/layout';

/**
 * [A] 視覺資訊備註
 * 元件角色：核心優勢 (AdvantageList)。展示欣育文理的三大核心優勢。
 * 佈局特性：極簡白背景，三欄式佈局，帶有超大標題序號。
 * GSAP Selectors：
 *  - advantage-card: 使用 ScrollTrigger 控制由下而上的瀑布流進場。
 *
 * P0 修正 (2026-04-25)：
 * - ResizeObserver callback 加入 threshold 2px 閾值守衛
 * - 避免視窗微幅抖動（如行動裝置捲動時的瀏覽器工具列縮放）
 *   持續觸發 ScrollTrigger.refresh()，造成效能死亡螺旋
 * - 完整安全流程：disconnect → refresh → rAF observe + debounce 150ms + threshold 2px
 */

gsap.registerPlugin(ScrollTrigger);

// [B-0] GSAP 動畫鉤子白名單
const GSAP_SELECTORS = {
  trigger: 'advantage-trigger',
  card: 'advantage-card',
} as const;

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:     'relative flex flex-col w-full my-16 py-16 px-6 theme-transition',
  header:      'flex flex-col items-center mb-16 w-full text-center',
  title:       'text-3xl font-bold tracking-tight text-[var(--brand-primary)] theme-transition md:text-4xl',
  subtitle:    'mt-4 text-base tracking-[0.2em] text-[var(--text-sub)] theme-transition',

  grid:        'grid grid-cols-1 gap-8 w-full max-w-7xl mx-auto md:grid-cols-3 lg:gap-12',

  // Card (group 讓子元素連動 hover)
  card:        'group flex flex-col p-8 border border-[var(--ui-border)] rounded-2xl bg-transparent theme-transition duration-500 hover:border-[var(--hsinyu-blue)] hover:bg-[var(--ui-white)] hover:shadow-2xl md:p-10',

  // Number (空心字效果 → hover 時填滿色)
  number:      'text-7xl font-black text-transparent [-webkit-text-stroke:1px_var(--ui-border)] theme-transition duration-500 group-hover:text-[var(--hsinyu-blue)] group-hover:[-webkit-text-stroke:1px_var(--hsinyu-blue)] group-hover:-translate-y-2 md:text-8xl',

  // Content (hover 時內容微幅上推)
  contentBox:  'flex flex-col mt-auto pt-16 theme-transition duration-500 group-hover:-translate-y-2',
  cardTitle:   'text-2xl font-bold text-[var(--brand-primary)] mb-4 theme-transition',
  cardDesc:    'text-base leading-relaxed text-[var(--text-sub)] theme-transition',
} as const;

// [C] 元件主體
export const AdvantageList: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // [P0] lastStableHeight：記錄上次穩定高度，作為 threshold 比對基準
    // 避免視窗高度微幅變化（< 2px）時重複觸發 ScrollTrigger.refresh()
    let lastStableHeight = Math.round(el.getBoundingClientRect().height);
    let timeoutId: ReturnType<typeof setTimeout>;
    let ctx: ReturnType<typeof gsap.context> | null = null;

    ctx = gsap.context(() => {
      gsap.from(`.${GSAP_SELECTORS.card}`, {
        scrollTrigger: {
          trigger: el,
          start: 'top 75%',
        },
        y: 60,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out',
      });
    }, el);

    // [P0 FIXED] ResizeObserver 安全模式（四步 Pipeline + debounce 150ms + threshold 2px）
    //
    // 問題背景：行動裝置捲動時瀏覽器工具列會收縮，導致視窗高度連續微幅變化，
    // 若每次變化都觸發 ScrollTrigger.refresh() 會造成效能死亡螺旋。
    //
    // 安全流程：
    //   Step 1：disconnect()              — 物理斷路，阻止 callback 遞迴觸發
    //   Step 2：ScrollTrigger.refresh()   — 執行刷新（此時 RO 已斷，不會遞迴）
    //   Step 3：更新 lastStableHeight     — 記錄此次刷新後的穩定高度快照
    //   Step 4：rAF 後恢復 observe()      — 等待 Paint 完成後再重新監聽
    const ro = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentHeight = Math.round(el.getBoundingClientRect().height);

        // [P0] threshold 守衛：高度變化 < 2px 時直接忽略，不觸發 refresh
        // 防禦：行動裝置瀏覽器工具列縮放、字體渲染微幅抖動
        if (Math.abs(currentHeight - lastStableHeight) < 2) return;

        // Step 1：物理斷路
        ro.disconnect();

        // Step 2：執行刷新
        ScrollTrigger.refresh();

        // Step 3：更新高度快照
        lastStableHeight = currentHeight;

        // Step 4：Paint 後恢復監聽
        requestAnimationFrame(() => {
          if (el) ro.observe(el);
        });
      }, 150); // debounce 150ms — 合併短時間內的連續 resize 事件
    });

    ro.observe(el);

    // [P0] 完整 cleanup
    return () => {
      ctx?.revert();
      clearTimeout(timeoutId);
      ro.disconnect();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={STYLES.wrapper}
      aria-label="核心優勢"
    >
      <header className={STYLES.header}>
        <h2 className={STYLES.title}>我們的核心優勢</h2>
        <p className={STYLES.subtitle}>CORE ADVANTAGES</p>
      </header>

      <div ref={gridRef} className={STYLES.grid}>
        {ADVANTAGES_DATA.map((item, idx) => (
          <article
            key={idx}
            className={`${GSAP_SELECTORS.card} ${STYLES.card}`}
          >
            <div className={STYLES.number} aria-hidden="true">
              {item.num}
            </div>
            <div className={STYLES.contentBox}>
              <h3 className={STYLES.cardTitle}>{item.title}</h3>
              <p className={STYLES.cardDesc}>{item.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
