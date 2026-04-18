import React, { useEffect, useRef } from 'react';
import { LAYOUT } from '../../styles/layout';

/**
 * [A] 視覺資訊備註
 * 元件角色：Connect & Consult 聯絡我們 (數位諮詢入口)。
 * 佈局特性：左側留白與宣傳文字，右側表單。極簡 1px 邊框。
 * 狀態轉換：
 *   - 純 CSS 實作的 Floating Label (藉由 Tailwind `peer` 達成)。
 *   - Dark mode: 背景透明，透過 globals.css 的 Token 控制線條顏色。
 * GSAP/rAF: 送出按鈕支援「磁吸效果 (Magnetic Effect)」，兼具靜止休眠機制。
 */

// 無 GSAP timeline 動畫白名單，但具備 rAF 互動
const GSAP_SELECTORS = {
  magneticBtn: 'magnetic-button-element',
} as const;

const FORM_FIELDS = [
  { id: 'contact-name', name: 'name', type: 'text', label: '您的姓名 Name' },
  { id: 'contact-email', name: 'email', type: 'email', label: '電子郵件 Email' },
];

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:       'flex flex-col w-full px-6 py-24 bg-[var(--ui-bg)] theme-transition md:flex-row md:justify-between md:py-32',
  container:     `${LAYOUT.container} flex flex-col gap-16 md:flex-row md:items-start`,
  
  // Left Column
  leftCol:       'flex flex-col flex-1 max-w-sm',
  title:         'text-4xl font-bold tracking-tight text-[var(--brand-primary)] mb-6 theme-transition md:text-5xl lg:text-6xl',
  desc:          'text-base leading-loose text-[var(--text-sub)] theme-transition',
  
  // Right Column (Form)
  rightCol:      'flex flex-col flex-1 w-full max-w-xl md:ml-auto',
  form:          'flex flex-col w-full',
  
  // Input Group (Floating Label via peer)
  inputGroup:    'relative pt-6 mb-10 w-full',
  input:         'peer w-full bg-transparent border-b border-[var(--ui-border)] py-2 text-[var(--text-main)] placeholder-transparent focus:outline-none focus:border-[var(--hsinyu-blue)] transition-colors theme-transition',
  label:         'absolute left-0 top-8 text-base text-[var(--text-sub)] pointer-events-none transition-all duration-300 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[var(--hsinyu-blue)] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[var(--text-sub)] theme-transition',
  
  // Button
  btnContainer:  'flex justify-start mt-4',
  button:        'px-12 py-4 rounded-full bg-[var(--brand-primary)] text-[var(--ui-bg)] font-medium transition-colors hover:bg-[var(--hsinyu-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hsinyu-blue)] focus:ring-offset-2 focus:ring-offset-[var(--ui-bg)] theme-transition',
} as const;

// [C] 元件主體
export const ContactForm: React.FC = () => {
  const btnRef = useRef<HTMLButtonElement>(null);

  // rAF State for Magnetic Effect
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const rafActive = useRef(false);
  const sleeping = useRef(true);
  const rafId = useRef(0);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    // [P0] 磁吸效果與休眠防線 (Motion V5 Standard)
    const loop = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      
      current.current.x += dx * 0.15; // easing coefficient
      current.current.y += dy * 0.15;

      // 休眠判定 (精準回位且不再被拉扯時)
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        rafActive.current = false;
        sleeping.current = true;
        btn.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
        return;
      }

      // [P0] 僅輸出座標
      btn.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      rafId.current = requestAnimationFrame(loop);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // 觸發範圍牽引：滑鼠位置與中心點的微小比例偏移
      target.current.x = (e.clientX - centerX) * 0.3;
      target.current.y = (e.clientY - centerY) * 0.3;

      if (sleeping.current && !rafActive.current) {
        sleeping.current = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    const handleMouseLeave = () => {
      // 游標離開時，目標復位歸零
      target.current.x = 0;
      target.current.y = 0;
      
      if (sleeping.current && !rafActive.current) {
        sleeping.current = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    // 掛載事件監聽
    btn.addEventListener('mousemove', handleMouseMove, { passive: true });
    btn.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      // [P0] 生命週期完整清理
      cancelAnimationFrame(rafId.current);
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className={STYLES.wrapper} aria-labelledby="contact-heading">
      <div className={STYLES.container}>
        
        {/* Left Column */}
        <header className={STYLES.leftCol}>
          <h2 id="contact-heading" className={STYLES.title}>數位諮詢</h2>
          <p className={STYLES.desc}>
            開啟孩子的無限可能，讓我們的專業顧問團隊為您解答所有學習上的疑惑。歡迎留下資訊，我們將盡快與您聯繫。
          </p>
        </header>

        {/* Right Column / Form */}
        <div className={STYLES.rightCol}>
          <form className={STYLES.form} onSubmit={(e) => e.preventDefault()} aria-label="數位諮詢表單">
            
            {/* DRY Map Render for Inputs */}
            {FORM_FIELDS.map((field) => (
              <div key={field.id} className={STYLES.inputGroup}>
                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  placeholder={field.label}
                  className={STYLES.input}
                  required
                />
                <label htmlFor={field.id} className={STYLES.label}>
                  {field.label}
                </label>
              </div>
            ))}

            {/* Textarea Field */}
            <div className={STYLES.inputGroup}>
              <textarea
                id="contact-message"
                name="message"
                rows={3}
                placeholder="您的訊息 Message"
                className={`${STYLES.input} resize-none`}
                required
              />
              <label htmlFor="contact-message" className={STYLES.label}>
                您的訊息 Message
              </label>
            </div>

            {/* Magnetic Submit Button */}
            <div className={STYLES.btnContainer}>
              <button
                ref={btnRef}
                type="submit"
                className={`${GSAP_SELECTORS.magneticBtn} ${STYLES.button}`}
                aria-label="提交諮詢表單"
              >
                啟程探索
              </button>
            </div>

          </form>
        </div>
        
      </div>
    </section>
  );
};
