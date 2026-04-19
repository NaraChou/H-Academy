import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, X, Leaf, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { NAV_ITEMS } from '../../data/appData';
import { supabase } from '../../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type?: string;
}

const STYLES = {
  header: 'fixed top-0 z-[100] w-full transition-all duration-500 theme-transition flex items-center justify-between px-6 md:px-12',
  glass:  'bg-[var(--ui-white)]/80 backdrop-blur-md border-b',
  scrolled: 'py-3 shadow-sm border-[var(--ui-border)]',
  default:  'py-6 border-transparent',
  
  logo: 'flex items-center gap-2 text-xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition lg:text-2xl z-50',
  logoIcon: 'flex-shrink-0 text-[var(--brand-accent)] theme-transition',
  
  rightSide: 'flex items-center justify-end flex-1 gap-6',

  nav: 'hidden lg:flex items-center justify-end gap-4 xl:gap-8 flex-1',
  navItemWrap: 'relative group py-2',
  navLink: 'relative text-sm font-medium tracking-widest text-[var(--text-main)] transition-colors theme-transition after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-px after:bg-[var(--hsinyu-blue)] after:transition-all after:duration-300 hover:after:w-full hover:text-[var(--hsinyu-blue)]',
  
  dropdown: 'absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300',
  dropdownContent: 'flex flex-col min-w-[160px] bg-[var(--ui-bg)]/90 backdrop-blur-md border border-[var(--ui-border)] p-2 shadow-xl theme-transition rounded-sm',
  dropdownLink: 'block px-4 py-3 text-sm text-[var(--text-main)] hover:bg-[var(--ui-border)] hover:text-[var(--hsinyu-blue)] transition-colors theme-transition',
  
  actions: 'flex items-center gap-4 z-50',
  iconBtn: 'relative p-2 text-[var(--text-main)] hover:text-[var(--brand-primary)] transition-colors theme-transition pointer-events-auto',
  badge: 'absolute top-1 right-2 w-2 h-2 rounded-full bg-[var(--brand-accent)] border border-[var(--ui-bg)] theme-transition',
  
  popover: 'absolute top-full right-0 pt-4 opacity-0 invisible transition-all duration-300 group-hover/bell:opacity-100 group-hover/bell:visible theme-transition rounded-sm pointer-events-auto z-[110]',
  popoverContent: 'w-72 p-4 bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl text-sm text-[var(--text-sub)] theme-transition',
  
  mobileNavOverlay: 'fixed inset-0 z-40 bg-[var(--ui-bg)]/95 backdrop-blur-lg flex flex-col justify-center items-center gap-8 transition-all duration-500 theme-transition',
  mobileNavLink: 'text-2xl font-medium tracking-widest text-[var(--text-main)] hover:text-[var(--hsinyu-blue)] theme-transition',
  
  // User Dropdown
  userDropdown: 'absolute top-full right-0 pt-4 opacity-0 invisible group-hover/user:opacity-100 group-hover/user:visible transition-all duration-300 theme-transition rounded-sm overflow-hidden z-[110]',
  userDropdownContent: 'w-60 bg-[var(--ui-bg)] border border-[var(--ui-border)] shadow-xl overflow-hidden',
  userHeader: 'px-4 py-3 border-b border-[var(--ui-border)] bg-[var(--ui-white)]/50',
  userEmail: 'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase truncate',
  userOption: 'flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest text-[var(--text-main)] hover:bg-[var(--ui-border)] hover:text-[var(--hsinyu-blue)] transition-colors theme-transition',
  logoutOption: 'flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-widest text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors theme-transition w-full text-left',
  
  // Mobile Notification Overlay
  mobileNotifOverlay: 'fixed inset-0 z-[200] bg-[var(--ui-bg)]/95 backdrop-blur-xl flex flex-col transition-transform duration-500 ease-in-out',
  mobileMenuToggle: 'block lg:hidden p-2 text-[var(--text-main)] cursor-pointer z-50',
} as const;

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
      
      if (!error && data) {
        setAnnouncements(data);
      }
    };

    // Auth subscription
    const getAuthState = async () => {
      if (!supabase) return;
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

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
    navigate('/login');
  };

  const handleNavClick = (href: string) => {
    // If clicking the current path/hash, manually scroll since router doesn't trigger URL change
    const [path, hash] = href.split('#');
    if (location.pathname === path && location.hash.replace('#', '') === (hash || '')) {
      if (hash) {
        setMobileMenuOpen(false);
        const el = document.getElementById(hash);
        if (el) {
          const topPos = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: topPos, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Different route or hash, let route transition happen but close mobile menus
       setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileNotifOpen(false);
    setExpandedItem(null);
  }, [location.pathname, location.hash]);

  return (
    <>
      <header className={`${STYLES.header} ${STYLES.glass} ${isScrolled ? STYLES.scrolled : STYLES.default}`}>
        <Link to="/" className={STYLES.logo}>
          <Leaf className={STYLES.logoIcon} size={28} aria-hidden="true" />
          <span className="hidden sm:inline tracking-[0.2em]">欣育</span>
        </Link>
        
        <div className={STYLES.rightSide}>
          <nav className={STYLES.nav} aria-label="主要導覽列">
            {NAV_ITEMS.map((item, idx) => (
              <div key={idx} className={item.children ? STYLES.navItemWrap : ''}>
                <Link to={item.href} className={STYLES.navLink} onClick={() => handleNavClick(item.href)}>
                   {item.label}
                </Link>
                {item.children && (
                  <div className={STYLES.dropdown}>
                    <div className={STYLES.dropdownContent}>
                      {item.children.map((child, cIdx) => (
                        <Link key={cIdx} to={child.href} className={STYLES.dropdownLink} onClick={() => handleNavClick(child.href)}>
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          
          <div className={STYLES.actions}>
             <div className="relative group/bell">
               <button 
                 className={STYLES.iconBtn} 
                 aria-label="訊息通知"
                 onClick={() => setMobileNotifOpen(true)}
               >
                 <Bell size={20} />
                 {announcements.length > 0 && <span className={STYLES.badge} aria-hidden="true" />}
               </button>
               {/* Desktop Popover */}
               <div className={`${STYLES.popover} hidden sm:block`}>
                 <div className={STYLES.popoverContent}>
                   <h4 className="font-bold text-[var(--brand-primary)] mb-4 theme-transition">最新公告</h4>
                   <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2">
                     {announcements.length > 0 ? (
                       announcements.map((ann) => (
                         <div key={ann.id} className="border-b last:border-0 border-[var(--ui-border)] pb-2">
                           <h5 className="text-[var(--text-main)] font-medium mb-1">{ann.title}</h5>
                           <p className="text-[var(--text-sub)] text-xs mb-1">{ann.content}</p>
                           <p className="text-xs text-neutral-400">
                             {new Date(ann.created_at).toLocaleDateString('zh-TW')}
                           </p>
                         </div>
                       ))
                     ) : (
                       <p className="text-center py-2 text-neutral-500">目前尚無新公告</p>
                     )}
                   </div>
                   <Link 
                     to="/news" 
                     className="flex items-center justify-end mt-4 pt-4 border-t border-[var(--ui-border)] text-xs font-bold tracking-wider text-[var(--hsinyu-blue)] hover:translate-x-1 transition-transform duration-300"
                   >
                     查看全部公告 →
                   </Link>
                 </div>
               </div>
             </div>
            
            <ThemeSwitcher />

            <div className="relative group/user">
              {user ? (
                <>
                  <button className={STYLES.iconBtn} aria-label="會員選單">
                    <User size={20} className="text-[var(--hsinyu-blue)]" />
                  </button>
                  {/* User Dropdown */}
                  <div className={STYLES.userDropdown}>
                    <div className={STYLES.userDropdownContent}>
                      <div className={STYLES.userHeader}>
                        <div className={STYLES.userEmail}>{user.email}</div>
                      </div>
                      <Link to="/dashboard" className={STYLES.userOption}>
                        <Settings size={14} />
                        個人設定
                      </Link>
                      <button onClick={handleLogout} className={STYLES.logoutOption}>
                        <LogOut size={14} />
                        安全登出
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

            <button 
              className={STYLES.mobileMenuToggle}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "關閉選單" : "開啟選單"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button
            >
          </div>
        </div>
      </header>
      
      {/* Mobile Notification Overlay */}
      <div 
        className={`${STYLES.mobileNotifOverlay} ${mobileNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!mobileNotifOpen}
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--ui-border)]">
          <h4 className="font-bold text-[var(--brand-primary)] text-xl">最新公告</h4>
          <button onClick={() => setMobileNotifOpen(false)} className="p-4" aria-label="關閉公告">
            <X size={28} />
          </button>
        </div>
        <div className="flex flex-col p-6 gap-6 overflow-y-auto flex-1">
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <div key={ann.id} className="border-b border-[var(--ui-border)] pb-4">
                <span className="inline-block px-2 py-0.5 mb-2 text-[10px] font-bold tracking-wider text-white bg-[var(--hsinyu-blue)] uppercase">
                  {ann.type || '公告'}
                </span>
                <h5 className="text-lg text-[var(--text-main)] font-medium mb-1">{ann.title}</h5>
                <p className="text-sm text-[var(--text-sub)] mb-2">{ann.content}</p>
                <p className="text-xs text-neutral-400">
                  {new Date(ann.created_at).toLocaleDateString('zh-TW')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-neutral-500">目前尚無新公告</p>
          )}
          <Link 
            to="/news" 
            className="mt-8 flex items-center justify-center p-4 border border-[var(--ui-border)] text-sm font-bold tracking-wider text-[var(--hsinyu-blue)] hover:bg-[var(--hsinyu-blue)] hover:text-white transition-colors"
            onClick={() => setMobileNotifOpen(false)}
          >
            前往訊息中心 →
          </Link>
        </div>
      </div>

      <div 
        className={`${STYLES.mobileNavOverlay} ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!mobileMenuOpen}
      >
        <Link to="/" className={STYLES.mobileNavLink}>回首頁</Link>
        {NAV_ITEMS.map((item, idx) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItem === idx;
          return (
            <div key={idx} className="flex flex-col items-center w-full">
              <button 
                onClick={() => hasChildren ? setExpandedItem(isExpanded ? null : idx) : null}
                className={`${STYLES.mobileNavLink} flex items-center gap-2`}
              >
                {hasChildren ? item.label : <Link to={item.href} onClick={() => handleNavClick(item.href)}>{item.label}</Link>}
                {hasChildren && <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
              </button>
              
              {hasChildren && isExpanded && (
                <div className="flex flex-col items-center gap-2 mt-2 border-t border-[var(--ui-border)] pt-2 w-full">
                  {item.children!.map((child, cIdx) => (
                    <Link key={`child-${cIdx}`} to={child.href} className="text-lg text-[var(--text-sub)] hover:text-[var(--hsinyu-blue)] transition-colors theme-transition py-1" onClick={() => handleNavClick(child.href)}>
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <Link to="/login" className={STYLES.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>會員登入</Link>
      </div>
    </>
  );
};
