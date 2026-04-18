import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { LAYOUT } from '../../styles/layout';

/**
 * [A] 視覺資訊備註
 * 元件角色：Marquee Vision 背景氛圍區塊。展示欣育教育哲學。
 * 視覺特性：無限循環的橫向滾動文字（1px空心、低對比）。
 * GSAP + 效能：
 *  - 實作無縫循環 (xPercent: -50)。
 *  - [P0] 結合 IntersectionObserver，視窗外暫停 timeline (模擬 rAF 休眠)，省下計算資源。
 */

// 無縫字串 (重複兩次以確保足夠寬度)
const PHRASE = "GROWTH  /  FUTURE  /  ACCOMPANY  /  HSINYU  /  ";

// [B-0] GSAP 白名單
const GSAP_SELECTORS = {
  track: 'marquee-track',
} as const;

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:          'relative flex flex-col justify-center items-center w-full min-h-[60vh] py-32 overflow-hidden bg-[var(--ui-white)] border-y border-[var(--ui-border)] theme-transition md:min-h-[80vh]',
  
  // Marquee Layer (z-0)
  marqueeContainer: 'absolute inset-0 flex items-center w-full h-full z-0 overflow-hidden opacity-40 select-none pointer-events-none theme-transition',
  marqueeTrack:     'flex w-max will-change-transform',
  marqueeItem:      'flex shrink-0 px-4',
  marqueeText:      'whitespace-nowrap text-[8rem] font-bold text-transparent [-webkit-text-stroke:1px_var(--text-sub)] theme-transition md:text-[12rem] lg:text-[18rem]',
  
  // Content Layer (z-10)
  contentBox:       `${LAYOUT.colCenterText} relative z-10 max-w-3xl px-6 mix-blend-normal`,
  title:            'text-3xl font-bold tracking-widest text-[var(--brand-primary)] leading-tight mb-6 theme-transition md:text-4xl lg:text-5xl',
  desc:             'text-base font-light text-[var(--text-sub)] leading-loose tracking-[0.1em] theme-transition md:text-lg lg:text-xl',
} as const;

// [C] 元件主體
export const MarqueeVision: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // [P0] GSAP 動畫與 Intersection Observer (視窗外休眠機制)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    let ctx = gsap.context(() => {
      // 無縫滾動動畫：向左移動自身寬度的 50% (因為 track 內有兩個完全一樣的 block)
      tlRef.current = gsap.to(`.${GSAP_SELECTORS.track}`, {
        xPercent: -50,
        ease: 'none',
        duration: 35, // 調整滾動速度
        repeat: -1,
      });
    }, el);

    // Kiki Design V5 - 休眠機制 (IntersectionObserver 代替純 rAF 監聽)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tlRef.current?.play();
          } else {
            tlRef.current?.pause(); // 移出視窗時休眠
          }
        });
      },
      { threshold: 0 }
    );

    io.observe(el);

    return () => {
      io.disconnect();
      ctx.revert(); // 徹底釋放 GSAP 記憶體
    };
  }, []);

  return (
    <section ref={sectionRef} className={STYLES.wrapper} aria-label="教育哲學與願景">
      
      {/* Background Marquee Layer */}
      <div className={STYLES.marqueeContainer} aria-hidden="true">
        <div className={`${GSAP_SELECTORS.track} ${STYLES.marqueeTrack}`}>
          <div className={STYLES.marqueeItem}>
            <span className={STYLES.marqueeText}>{PHRASE}{PHRASE}</span>
          </div>
          <div className={STYLES.marqueeItem}>
            <span className={STYLES.marqueeText}>{PHRASE}{PHRASE}</span>
          </div>
        </div>
      </div>

      {/* Foreground Content Layer */}
      <div className={STYLES.contentBox}>
        <h2 className={STYLES.title}>陪伴，是最溫柔的力量</h2>
        <p className={STYLES.desc}>
          我們相信，每一次的引導與啟發，都能成為孩子未來破浪前行的星光。不只傳授知識，我們更在乎開啟他們探索未知世界的渴望，在 AI 時代建立不可取代的思維深度。
        </p>
      </div>
      
    </section>
  );
};
