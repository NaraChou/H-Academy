import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, X } from 'lucide-react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { NAV_ITEMS } from '../../data/appData';

/**
 * [A] 視覺資訊備註
 * Glassmorphism Navbar (主導航列)
 * 
 * - Desktop: 具備多層級下拉選單 (毛玻璃效果)，與 1px Hover 底線效果
 * - Action: 鈴鐺 icon 提供次要行動
 * - Mobile: 全螢幕 Hamburger 選單
 */

const STYLES = {
  header: 'fixed top-0 z-[100] w-full transition-all duration-500 theme-transition flex items-center justify-between px-6 md:px-12',
  glass:  'bg-[var(--ui-white)]/80 backdrop-blur-md border-b',
  scrolled: 'py-3 shadow-sm border-[var(--ui-border)]',
  default:  'py-6 border-transparent',
  
  logo: 'flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition lg:text-2xl z-50',
  logoIcon: 'flex-shrink-0 w-6 h-6 rounded bg-[var(--brand-accent)] theme-transition lg:w-7 lg:h-7',
  
  // Desktop Nav
  nav: 'hidden lg:flex items-center gap-4 xl:gap-8',
  navItemWrap: 'relative group py-2',
  navLink: 'relative text-sm font-medium tracking-widest text-[var(--text-main)] transition-colors theme-transition after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-px after:bg-[var(--hsinyu-blue)] after:transition-all after:duration-300 hover:after:w-full hover:text-[var(--hsinyu-blue)]',
  
  // Dropdown
  dropdown: 'absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300',
  dropdownContent: 'flex flex-col min-w-[160px] bg-[var(--ui-bg)]/90 backdrop-blur-md border border-[var(--ui-border)] p-2 shadow-xl theme-transition rounded-sm',
  dropdownLink: 'block px-4 py-3 text-sm text-[var(--text-main)] hover:bg-[var(--ui-border)] hover:text-[var(--hsinyu-blue)] transition-colors theme-transition',
  
  // Actions
  rightSection: 'flex items-center gap-4 z-50',
  iconBtn: 'relative p-2 text-[var(--text-main)] hover:text-[var(--brand-primary)] transition-colors theme-transition',
  badge: 'absolute top-1 right-2 w-2 h-2 rounded-full bg-[var(--brand-accent)] border border-[var(--ui-bg)] theme-transition',
  
  // Popover 
  popover: 'absolute top-full right-0 mt-4 w-64 p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl opacity-0 invisible transition-all duration-300 group-hover/bell:opacity-100 group-hover/bell:visible theme-transition text-sm text-[var(--text-sub)] rounded-sm',
  
  // Mobile Nav
  mobileMenuToggle: 'block lg:hidden p-2 text-[var(--text-main)] cursor-pointer',
  mobileNavOverlay: 'fixed inset-0 z-40 bg-[var(--ui-bg)]/95 backdrop-blur-lg flex flex-col justify-center items-center gap-8 transition-all duration-500 theme-transition',
  mobileNavLink: 'text-2xl font-medium tracking-widest text-[var(--text-main)] hover:text-[var(--hsinyu-blue)] theme-transition',
} as const;

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 路由切換時自動關閉手機選單
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className={`${STYLES.header} ${STYLES.glass} ${isScrolled ? STYLES.scrolled : STYLES.default}`}>
        <Link to="/" className={STYLES.logo}>
          <span className={STYLES.logoIcon} aria-hidden="true" />
          <span className="hidden sm:inline">KIKI DESIGN</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className={STYLES.nav} aria-label="主要導覽列">
          {NAV_ITEMS.map((item, idx) => (
            <div key={idx} className={item.children ? STYLES.navItemWrap : ''}>
              <Link to={item.href} className={STYLES.navLink}>
                 {item.label}
              </Link>
              {/* Dropdown Menu */}
              {item.children && (
                <div className={STYLES.dropdown}>
                  <div className={STYLES.dropdownContent}>
                    {item.children.map((child, cIdx) => (
                      <Link key={cIdx} to={child.href} className={STYLES.dropdownLink}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>
        
        <div className={STYLES.rightSection}>
          {/* Bell Action with simple CSS Hover Popover */}
          <div className="relative group/bell hidden sm:block">
            <button className={STYLES.iconBtn} aria-label="訊息通知">
              <Bell size={20} />
              <span className={STYLES.badge} aria-hidden="true" />
            </button>
            <div className={STYLES.popover}>
              <h4 className="font-bold text-[var(--brand-primary)] mb-2 theme-transition">最新訊息</h4>
              <p>目前尚無新公告，將於下學期陸續發佈。</p>
            </div>
          </div>
          
          <ThemeSwitcher />

          {/* Mobile Menu Toggle */}
          <button 
            className={STYLES.mobileMenuToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Fullscreen Navigation */}
      <div 
        className={`${STYLES.mobileNavOverlay} ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileMenuOpen}
      >
        {NAV_ITEMS.map((item, idx) => (
          <React.Fragment key={idx}>
            <Link to={item.href} className={STYLES.mobileNavLink}>
               {item.label}
            </Link>
            {item.children && item.children.map((child, cIdx) => (
              <Link key={`child-${cIdx}`} to={child.href} className="text-lg text-[var(--text-sub)] hover:text-[var(--hsinyu-blue)] transition-colors theme-transition">
                - {child.label}
              </Link>
            ))}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};
