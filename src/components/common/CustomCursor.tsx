import React, { useEffect, useRef } from 'react';

const STYLES = {
  cursor: 'custom-cursor',
} as const;

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const sleeping = useRef(true);
  const rafActive = useRef(false);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const loop = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;

      current.current.x += dx * 0.15;
      current.current.y += dy * 0.15;

      // 靜止休眠判定：差距極小時停止 rAF
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        rafActive.current = false;
        sleeping.current = true;
        return;
      }

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    const handleMouseMove = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;

      if (sleeping.current && !rafActive.current) {
        sleeping.current = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return <div ref={cursorRef} className={STYLES.cursor} aria-hidden="true" />;
};
