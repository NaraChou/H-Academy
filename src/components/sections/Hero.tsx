import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LAYOUT } from '../../styles/layout';

/**
 * [A] 視覺資訊備註
 * 元件角色：欣育文理首屏 Hero。採取極簡主義佈局，強調「陪伴」與「數位轉型」。
 * GSAP Selectors：
 * - hero-title: 標題由下而上淡入，象徵學子成長的動能。
 * - hero-sub: 副標題延遲出現，營造溫暖的低語感。
 * - leaf-element: Logo 抽象化後的幾何葉片，執行 rAF 靜止休眠漂浮。
 */

// [B-0] GSAP 動畫鉤子白名單（與 UI 樣式完全分離）
const GSAP_SELECTORS = {
  title: 'reveal-title',
  sub: 'reveal-sub',
  action: 'reveal-action',
  leaf: 'floating-leaf',
} as const;

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  // Mobile First 預設 flex-col
  wrapper:     'relative flex flex-col justify-center min-h-[80vh] w-full bg-[var(--ui-white)] overflow-hidden rounded-2xl border border-[var(--ui-border)] mb-16 theme-transition',
  container:   `${LAYOUT.colCenterText} relative z-10 px-6`,
  title:       'text-5xl font-bold text-[var(--brand-primary)] tracking-tighter md:text-7xl lg:text-8xl theme-transition',
  brandBlue:   'text-[var(--hsinyu-blue)] theme-transition',
  description: 'mt-8 text-base text-neutral-400 font-light tracking-[0.3em] md:text-lg lg:text-xl',
  button:      'mt-12 px-10 py-4 bg-[var(--hsinyu-blue)] text-[var(--theme-white)] rounded-full theme-transition duration-300 hover:bg-[var(--brand-primary)] hover:shadow-2xl active:scale-95',
  
  // 抽象幾何葉片視覺樣式
  leafUI:      'absolute opacity-10 pointer-events-none theme-transition'
} as const;

// [C] 元件主體
export const Hero: React.FC = () => {
  const leafRef = useRef<HTMLDivElement>(null);
  
  // rAF State
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const sleeping = useRef(false);
  const rafActive = useRef(false);
  const rafId = useRef<number>(0);
  
  useEffect(() => {
    // [視覺體驗] GSAP 進場動畫管理
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.5 } });
      
      tl.from(`.${GSAP_SELECTORS.title}`, { y: 100, opacity: 0 })
        .from(`.${GSAP_SELECTORS.sub}`, { y: 20, opacity: 0 }, "-=1")
        .from(`.${GSAP_SELECTORS.action}`, { opacity: 0 }, "-=0.8");
    });

    // [Motion V5] rAF 靜止休眠機制
    const loop = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;

      current.current.x += dx * 0.05; // 緩和移動係數
      current.current.y += dy * 0.05;

      // 靜止防線：差距極小時休眠，解除永久消耗
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        rafActive.current = false;
        sleeping.current = true;
        return;
      }

      if (leafRef.current) {
        // [P0] 確保只輸出座標 (GPU渲染)
        leafRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    const handleMouseMove = (e: MouseEvent) => {
      // 計算相對於畫面中心的視差座標
      target.current.x = (e.clientX - window.innerWidth / 2) * 0.08;
      target.current.y = (e.clientY - window.innerHeight / 2) * 0.08;

      if (sleeping.current && !rafActive.current) {
        sleeping.current = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      // [P0] 釋放記憶體，避免元件卸載後漏電
      ctx?.revert(); 
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className={STYLES.wrapper} aria-label="Hero Section">
      {/* 背景裝飾：極簡數位葉片 */}
      <div 
        ref={leafRef}
        className={`${GSAP_SELECTORS.leaf} ${STYLES.leafUI} top-1/4 right-[10%] w-32 h-32 border md:w-48 md:h-48 lg:w-64 lg:h-64 border-[var(--hsinyu-blue)] rounded-bl-[100px] rounded-tr-[100px]`} 
        aria-hidden="true"
      />

      <div className={STYLES.container}>
        <h1 className={`${GSAP_SELECTORS.title} ${STYLES.title}`}>
          欣育文理 <span className={STYLES.brandBlue}>Hsinyu</span>
        </h1>
        
        <p className={`${GSAP_SELECTORS.sub} ${STYLES.description}`}>
          在 AI 時代，給孩子最溫暖的成長導航
        </p>

        <div className={GSAP_SELECTORS.action}>
          <button className={STYLES.button} aria-label="了解課程詳情">
            探索未來路徑
          </button>
        </div>
      </div>
    </section>
  );
};
