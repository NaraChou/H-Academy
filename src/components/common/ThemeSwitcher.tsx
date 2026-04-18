import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/**
 * [A] 視覺資訊備註 ...
 * 元件角色：Theme Switcher (Dark Mode Toggle)
 * 放置位置：Navigation 右側。
 * 互動：極簡的圓形邊框，1px線條(strokeWidth=1)，localStorage持久化。
 */

const STYLES = {
  button: 'flex items-center justify-center w-10 h-10 rounded-full border border-[var(--ui-border)] text-[var(--brand-primary)] transition-all duration-300 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-[var(--ui-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2',
  icon: 'w-5 h-5 theme-transition'
} as const;

export const ThemeSwitcher: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  // [P0/P1] 使用 useEffect 掛載持久化記憶，不阻塞首次 render
  useEffect(() => {
    const savedTheme = localStorage.getItem('kiki-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const nextTheme = !prev;
      if (nextTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('kiki-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('kiki-theme', 'light');
      }
      return nextTheme;
    });
  };

  return (
    <button 
      onClick={toggleTheme} 
      className={STYLES.button}
      aria-label={isDark ? "切換至淺色模式" : "切換至深色模式"}
      title="切換主題"
    >
      {isDark ? (
        <Moon className={STYLES.icon} strokeWidth={1} />
      ) : (
        <Sun className={STYLES.icon} strokeWidth={1} />
      )}
    </button>
  );
};
