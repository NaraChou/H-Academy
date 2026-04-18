import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * [A] 視覺資訊備註
 * 儀式感加載器 (Loader)
 * 實作 00% - 100% 數字增長與 1px 圓圈縮放，在頁面初始渲染時鎖定家長注意力。
 * [視覺體驗] 模擬工業級精密加載
 */

export const Loader: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline();
      const count = { val: 0 };

      // 1. 數字爬升動畫
      tl.to(count, {
        val: 100,
        duration: 2.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.innerText = `${Math.round(count.val).toString().padStart(2, '0')}%`;
          }
        }
      }, 0);

      // 2. 完成後向上切換拉開
      tl.to(wrapperRef.current, {
        yPercent: -100,
        duration: 1.2,
        ease: 'power4.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--ui-bg)] theme-transition">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* 1px 呼吸圓圈 (模擬 Tailwind dark:border-white/10) */}
        <div className="absolute inset-0 border border-[var(--brand-primary)] opacity-20 rounded-full animate-ping theme-transition" />
        <div className="absolute inset-0 border border-[var(--hsinyu-blue)] rounded-full animate-pulse theme-transition" />
        
        {/* 進度數字 */}
        <span ref={counterRef} className="text-2xl font-light tracking-tighter text-[var(--brand-primary)] theme-transition counter-number">
          00%
        </span>
      </div>
      <p className="mt-8 text-[10px] tracking-[0.5em] text-[var(--text-sub)] uppercase theme-transition">
        Loading Hsinyu Digital Experience
      </p>
    </div>
  );
};
