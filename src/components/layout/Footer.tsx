import React from 'react';
import { QrCode } from 'lucide-react';
import { LAYOUT } from '../../styles/layout';
import { FOOTER_LINKS, SOCIAL_LINKS } from '../../data/appData';

/**
 * [A] 視覺資訊備註
 * 元件角色：欣育文理 頁脚 (Footer)。
 * 視覺特性：純潔背景搭配 1px border-t 展現工藝感。
 * 狀態互動：Hover 連結時不改色，而是觸發底部的 1px 黑線由中心往外延展。
 */

// 無 GSAP 複雜動畫掛載
// const GSAP_SELECTORS = {}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:       'flex flex-col w-full py-20 bg-[var(--ui-white)] border-t border-[var(--brand-primary)] theme-transition',
  container:     `${LAYOUT.container} flex flex-col`,
  
  // Top Section (Brand + Links)
  topSection:    'flex flex-col gap-12 w-full md:flex-row md:justify-between md:items-start',
  
  // Left Column (Brand)
  leftCol:       'flex flex-col gap-4',
  logo:          'text-2xl font-black text-[var(--brand-primary)] tracking-tight theme-transition',
  slogan:        'text-base text-neutral-400 tracking-widest',
  
  // Right Column (Links)
  nav:           'flex flex-col gap-4 md:flex-row md:gap-8',
  
  // Link interaction with CSS pseudo-elements for center-out underline
  link:          'relative inline-block pb-1 text-base font-medium text-[var(--brand-primary)] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-px after:bg-[var(--brand-primary)] after:transition-all after:duration-300 hover:after:w-full theme-transition',
  
  // Bottom Section (Copyright + Social)
  bottomSection: 'flex flex-col gap-6 mt-20 pt-8 border-t border-[var(--ui-border)] text-sm text-[var(--text-sub)] md:flex-row md:justify-between md:items-center theme-transition',
  copyright:     'text-sm theme-transition',
  socialNav:     'flex gap-6',
  socialLink:    'flex items-center gap-2 text-[var(--text-sub)] transition-colors duration-300 hover:text-[var(--brand-primary)] theme-transition',
} as const;

// [C] 元件主體
export const Footer: React.FC = () => {
  return (
    <footer className={STYLES.wrapper} aria-label="整體頁尾">
      <div className={STYLES.container}>
        
        {/* Top Section */}
        <div className={STYLES.topSection}>
          <div className={STYLES.leftCol}>
            <div className={STYLES.logo}>欣育文理 Hsinyu</div>
            <p className={STYLES.slogan}>在 AI 時代，給孩子最溫暖的成長導航</p>
          </div>
          
          <nav aria-label="快捷連結">
            <ul className={STYLES.nav}>
              {FOOTER_LINKS.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className={STYLES.link} aria-label={`前往 ${link.label}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className={STYLES.bottomSection}>
          <p className={STYLES.copyright}>
            &copy; {new Date().getFullYear()} Kiki Design System. All rights reserved.
          </p>
          
          <nav aria-label="社群媒體連結">
            <ul className={STYLES.socialNav}>
              {SOCIAL_LINKS.map((social, idx) => (
                <li key={idx}>
                  <a href={social.href} className={STYLES.socialLink} aria-label={`前往 ${social.label}`}>
                    {social.label === '教職員系統' ? (
                      <>
                        <QrCode size={18} />
                        <span className="hidden sm:inline">{social.label}</span>
                      </>
                    ) : (
                      social.label
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};
