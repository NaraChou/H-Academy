import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const STYLES = {
  // Artisan minimalist design: remove shadow, strict 1px border, high contrast.
  button: 'fixed bottom-6 right-6 z-[9999] p-3 rounded-none bg-[var(--ui-bg)] text-[var(--brand-primary)] border border-[var(--ui-border)] transition-all duration-500 ease-in-out hover:bg-[var(--brand-primary)] hover:text-[var(--ui-bg)] hover:border-[var(--brand-primary)] cursor-pointer',
  hidden: 'opacity-0 translate-y-4 pointer-events-none',
  visible: 'opacity-100 translate-y-0',
} as const;

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Use documentElement.scrollTop as a fallback if window.scrollY is unreliable
      const scrolled = window.scrollY || document.documentElement.scrollTop;
      if (scrolled > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    // Utilize GSAP ScrollToPlugin for organic, ease-in-out motion
    // Added autoKill: false so it doesn't interrupt if user interacts
    gsap.to(window, {
      duration: 2.5,
      scrollTo: { y: 0, autoKill: false },
      ease: 'expo.inOut',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      className={`${STYLES.button} ${isVisible ? STYLES.visible : STYLES.hidden}`}
      aria-label="回到最上方"
    >
      <ChevronUp size={20} aria-hidden="true" />
    </button>
  );
};
