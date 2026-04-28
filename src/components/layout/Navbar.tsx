import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Leaf, User, Settings, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { NAV_ITEMS } from '../../data/appData';
import { supabase } from '../../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * [A] 視覺資訊備註
 * 導覽列 (Layer 04)
 * 視覺語言：極簡高對比、1px Border、毛玻璃效果。
 *
 * 修正 (2026-04-27) v3：
 * - 漢堡選單底部新增「會員登入 / 個人設定 + 登出」大型可點擊區塊
 *   手機使用者不需點小圖示，直接點文字按鈕即可操作
 * - X 按鈕維持在 header 右側漢堡位置（原位切換）
 * - 子選單（國小部、國中部⋯）完整保留
 */

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type?: string;
}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  header:  'fixed top-0 z-[100] flex items-center justify-between w-full px-6 transition-all duration-500 theme-transition md:px-12',
  glass:   'bg-[var(--ui-white)]/80 backdrop-blur-md border-b',
  scrolled:'py-3 border-[var(--ui-border)] shadow-sm',
  default: 'py-6 border-transparent',

  logo:     'z-50 flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition lg:text-2xl',
  logoIcon: 'flex-shrink-0 text-[var(--brand-accent)] theme-transition',
  logoText: 'hidden tracking-[0.2em] sm:inline',

  rightSide: 'flex flex-1 items-center justify-end gap-6',

  // 桌機導覽
  nav:         'hidden flex-1 items-center justify-end gap-4 lg:flex xl:gap-8',
  navItemWrap: 'relative group py-2',
  navLink:     'relative text-sm font-medium tracking-widest text-[var(--text-main)] theme-transition transition-colors after:absolute after:bottom-0 after:left-1/2 after:h-px after:w-0 after:-translate-x-1/2 after:bg-[var(--hsinyu-blue)] after:transition-all after:duration-300 hover:text-[var(--hsinyu-blue)] hover:after:w-full',

  dropdown:        'invisible absolute top-full left-1/2 pt-4 opacity-0 -translate-x-1/2 transition-all duration-300 group-hover:visible group-hover:opacity-100',
  dropdownContent: 'flex flex-col min-w-[160px] p-2 bg-[var(--ui-bg)]/90 backdrop-blur-md border border-[var(--ui-border)] rounded-sm shadow-xl theme-transition',
  dropdownLink:    'block px-4 py-3 text-sm text-[var(--text-main)] transition-colors theme-transition hover:bg-[var(--ui-border)] hover:text-[var(--hsinyu-blue)]',

  actions: 'z-50 flex items-center gap-4',
  iconBtn: 'relative p-2 text-[var(--text-main)] transition-colors theme-transition pointer-events-auto hover:text-[var(--brand-primary)]',
  badge:   'absolute top-1 right-2 w-2 h-2 bg-[var(--brand-accent)] border border-[var(--ui-bg)] rounded-full theme-transition',

  popover:        'invisible absolute top-full right-0 z-[110] pt-4 opacity-0 transition-all duration-300 theme-transition rounded-sm pointer-events-auto group-hover/bell:visible group-hover/bell:opacity-100',
  popoverContent: 'w-72 p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl text-sm text-[var(--text-sub)] theme-transition',
  popoverTitle:   'mb-4 font-bold text-[var(--brand-primary)] theme-transition',
  popoverScroll:  'flex flex-col gap-4 max-h-64 pr-2 overflow-y-auto',
  notifItem:      'pb-2 border-b border-[var(--ui-border)] last:border-0',
  notifTitle:     'mb-1 font-medium text-[var(--text-main)]',
  notifDesc:      'mb-1 text-xs text-[var(--text-sub)]',
  notifDate:      'text-xs text-neutral-400',
  popoverFooter:  'flex items-center justify-end mt-4 pt-4 border-t border-[var(--ui-border)] text-xs font-bold tracking-wider text-[var(--hsinyu-blue)] transition-transform duration-300 hover:translate-x-1',

  // ── Mobile overlay ────────────────────────────────────────────
  mobileNavOverlay: 'fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-[var(--ui-bg)]/95 backdrop-blur-lg theme-transition overflow-y-auto py-24',
  mobileNavLink:    'text-2xl font-medium tracking-widest text-[var(--text-main)] transition-all theme-transition hover:text-[var(--hsinyu-blue)]',
  mobileSubNav:     'flex items-center gap-6 mt-1 mb-2',
  mobileSubLink:    'text-sm tracking-widest text-[var(--text-sub)] transition-colors theme-transition hover:text-[var(--hsinyu-blue)]',

  // [新增] 會員區塊：大型可點擊按鈕，手機友善
  mobileDivider:    'w-16 h-px bg-[var(--ui-border)] my-2',
  mobileAuthBtn:    'flex items-center justify-center gap-3 w-56 py-4 border border-[var(--ui-border)] rounded-2xl text-base font-bold tracking-widest text-[var(--text-main)] bg-[var(--ui-white)] transition-all theme-transition hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
  mobileAuthBtnFill:'flex items-center justify-center gap-3 w-56 py-4 rounded-2xl text-base font-bold tracking-widest bg-black text-white transition-all hover:opacity-80',
  mobileLogoutBtn:  'flex items-center justify-center gap-3 w-56 py-4 border border-[var(--ui-border)] rounded-2xl text-base font-bold tracking-widest text-[var(--color-danger)] bg-[var(--ui-white)] transition-all theme-transition hover:border-[var(--color-danger)]',

  mobileNotifOverlay: 'fixed inset-0 z-[200] flex flex-col bg-[var(--ui-bg)]/95 backdrop-blur-xl transition-transform duration-500 ease-in-out',

  // [修正] z-[101] 確保浮在 overlay(z-40) 之上
  mobileMenuToggle: 'z-[101] block p-2 text-[var(--text-main)] cursor-pointer transition-colors theme-transition hover:text-[var(--brand-primary)] lg:hidden',

  userDropdown:        'invisible absolute top-full right-0 z-[110] pt-4 opacity-0 transition-all duration-300 theme-transition rounded-sm overflow-hidden group-hover/user:visible group-hover/user:opacity-100',
  userDropdownContent: 'w-60 overflow-hidden bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl',
  userHeader:          'px-4 py-3 bg-[var(--ui-white)]/50 border-b border-[var(--ui-border)]',
  userEmail:           'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase truncate',
  userOption:          'flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest text-[var(--text-main)] transition-colors theme-transition hover:bg-[var(--ui-border)] hover:text-[var(--hsinyu-blue)]',
  logoutOption:        'flex w-full items-center gap-3 px-4 py-3 text-left text-xs font-bold tracking-widest text-[var(--color-danger)] transition-colors theme-transition hover:bg-[var(--color-danger-bg)]',
} as const;

export const Navbar: React.FC = () => {
  const [isScrolled,      setIsScrolled]      = useState(false);
  const [mobileMenuOpen,  setMobileMenuOpen]  = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [announcements,   setAnnouncements]   = useState<Announcement[]>([]);
  const [user,            setUser]            = useState<SupabaseUser | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const fetchAnnouncements = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setAnnouncements(data);
    };

    const getAuthState = async () => {
      if (!supabase) return;
      const { data: { user: cu } } = await supabase.auth.getUser();
      setUser(cu);
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return authListener;
    };

    fetchAnnouncements();
    const authSubPromise = getAuthState();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      authSubPromise.then(sub => sub?.subscription.unsubscribe());
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const [path, hash] = href.split('#');
    if (location.pathname === path && location.hash.replace('#', '') === (hash || '')) {
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          const topPos = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileNotifOpen(false);
  }, [location.pathname, location.hash]);

  return (
    <>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className={`${STYLES.header} ${STYLES.glass} ${isScrolled ? STYLES.scrolled : STYLES.default}`}>
        <Link to="/" className={STYLES.logo}>
          <Leaf className={STYLES.logoIcon} size={28} aria-hidden="true" />
          <span className={STYLES.logoText}>欣育</span>
        </Link>

        <div className={STYLES.rightSide}>
          {/* 桌機導覽 */}
          <nav className={STYLES.nav} aria-label="主要導覽列">
            <ul className="flex items-center gap-4 xl:gap-8">
              {NAV_ITEMS.map((item, idx) => (
                <li key={idx} className={item.children ? STYLES.navItemWrap : ''}>
                  <Link to={item.href} className={STYLES.navLink} onClick={() => handleNavClick(item.href)}>
                    {item.label}
                  </Link>
                  {item.children && (
                    <div className={STYLES.dropdown}>
                      <ul className={STYLES.dropdownContent}>
                        {item.children.map((child, cIdx) => (
                          <li key={cIdx}>
                            <Link to={child.href} className={STYLES.dropdownLink} onClick={() => handleNavClick(child.href)}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className={STYLES.actions}>
            {/* 通知鈴鐺 */}
            <div className="relative group/bell">
              <button className={STYLES.iconBtn} aria-label="訊息通知" onClick={() => setMobileNotifOpen(true)}>
                <Bell size={20} />
                {announcements.length > 0 && <span className={STYLES.badge} aria-hidden="true" />}
              </button>
              <div className={`${STYLES.popover} hidden sm:block`}>
                <div className={STYLES.popoverContent}>
                  <h2 className={STYLES.popoverTitle}>最新公告</h2>
                  <div className={STYLES.popoverScroll}>
                    {announcements.length > 0 ? announcements.map((ann) => (
                      <div key={ann.id} className={STYLES.notifItem}>
                        <h3 className={STYLES.notifTitle}>{ann.title}</h3>
                        <p className={STYLES.notifDesc}>{ann.content}</p>
                        <p className={STYLES.notifDate}>{new Date(ann.created_at).toLocaleDateString('zh-TW')}</p>
                      </div>
                    )) : <p className="py-2 text-center text-neutral-500">目前尚無新公告</p>}
                  </div>
                  <Link to="/news" className={STYLES.popoverFooter}>查看全部公告 →</Link>
                </div>
              </div>
            </div>

            <ThemeSwitcher />

            {/* 桌機會員選單 */}
            <div className="relative group/user">
              {user ? (
                <>
                  <button className={STYLES.iconBtn} aria-label="會員選單">
                    <User size={20} className="text-[var(--hsinyu-blue)]" aria-hidden="true" />
                  </button>
                  <div className={STYLES.userDropdown}>
                    <div className={STYLES.userDropdownContent}>
                      <div className={STYLES.userHeader}>
                        <div className={STYLES.userEmail}>{user.email}</div>
                      </div>
                      <Link to="/dashboard" className={STYLES.userOption}>
                        <Settings size={14} /> 個人設定
                      </Link>
                      <button onClick={handleLogout} className={STYLES.logoutOption} aria-label="登出系統">
                        <LogOut size={14} aria-hidden="true" /> 安全登出
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className={STYLES.iconBtn} aria-label="會員登入">
                  <User size={20} />
                </Link>
              )}
            </div>

            {/* 漢堡 / X 切換按鈕（手機） */}
            <button
              className={STYLES.mobileMenuToggle}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? '關閉選單' : '開啟選單'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen
                ? <X size={24} aria-hidden="true" />
                : <Menu size={24} aria-hidden="true" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── 手機版全屏選單 ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            aria-label="手機版導覽選單"
            className={STYLES.mobileNavOverlay}
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* 導覽連結（含子選單） */}
            {NAV_ITEMS.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <Link
                  to={item.href}
                  className={STYLES.mobileNavLink}
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.label}
                </Link>
                {item.children && (
                  <div className={STYLES.mobileSubNav}>
                    {item.children.map((child, cIdx) => (
                      <Link
                        key={cIdx}
                        to={child.href}
                        className={STYLES.mobileSubLink}
                        onClick={() => handleNavClick(child.href)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* ── [新增] 手機版會員區塊 ────────────────────────
                大型按鈕，手機點擊舒適，取代右上角難點的小圖示   */}
            <div className={STYLES.mobileDivider} aria-hidden="true" />

            {user ? (
              /* 已登入：顯示信箱 + 個人設定 + 登出 */
              <div className="flex flex-col items-center gap-3 w-full px-8">
                <p className="text-xs font-bold tracking-widest text-[var(--text-sub)] uppercase truncate max-w-[14rem]">
                  {user.email}
                </p>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={STYLES.mobileAuthBtn}
                >
                  <Settings size={18} aria-hidden="true" />
                  個人設定
                </Link>
                <button onClick={handleLogout} className={STYLES.mobileLogoutBtn} aria-label="安全登出">
                  <LogOut size={18} aria-hidden="true" />
                  安全登出
                </button>
              </div>
            ) : (
              /* 未登入：顯示登入按鈕 */
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={STYLES.mobileAuthBtnFill}
              >
                <User size={18} aria-hidden="true" />
                會員登入
              </Link>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── 手機版通知面板 ──────────────────────────────────── */}
      <AnimatePresence>
        {mobileNotifOpen && (
          <motion.div
            className={STYLES.mobileNotifOverlay}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--ui-border)]">
              <h3 className="text-xl font-black uppercase tracking-tighter">最新公告</h3>
              <button onClick={() => setMobileNotifOpen(false)} className="p-2" aria-label="關閉公告面板">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {announcements.length > 0 ? announcements.map((ann) => (
                <div key={ann.id} className="mb-8 pb-4 border-b border-[var(--ui-border)] last:border-0">
                  <h4 className="text-lg font-bold mb-2">{ann.title}</h4>
                  <p className="text-sm leading-relaxed text-[var(--text-sub)] mb-2">{ann.content}</p>
                  <span className="text-xs text-neutral-400">{new Date(ann.created_at).toLocaleDateString('zh-TW')}</span>
                </div>
              )) : (
                <p className="py-20 text-center text-neutral-500 italic">目前尚無新公告</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
