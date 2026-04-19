import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToAnchor() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Timeout to ensure content is fully loaded before scrolling
    // especially for components that fetch data or use heavy GSAP animations
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          const topPos = element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({
            top: topPos,
            behavior: 'smooth',
          });
        }
      }, 150); 
    } else {
      window.scrollTo(0, 0); // Scroll to top on new page without hash
    }
  }, [pathname, hash]);

  return null;
}
