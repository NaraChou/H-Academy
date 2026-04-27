import React, { useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../styles/layout';
import { supabase } from '../../lib/supabase';

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
  { id: 'contact-phone', name: 'phone', type: 'tel', label: '聯絡電話 Phone' },
];

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:       'flex flex-col w-full px-6 py-24 bg-[var(--ui-bg)] theme-transition md:flex-row md:justify-between md:py-32 scroll-mt-24',
  container:     `${LAYOUT.container} flex flex-col gap-16 md:flex-row md:items-start`,
  
  // Left Column
  leftCol:       'flex flex-col flex-1 max-w-sm',
  title:         'text-4xl font-bold tracking-tight text-[var(--brand-primary)] mb-2 theme-transition md:text-5xl lg:text-6xl',
  titleEng:      'text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase mb-6',
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
  button:        'px-12 py-4 rounded-full bg-[var(--brand-primary)] text-[var(--ui-bg)] font-medium transition-colors hover:bg-[var(--hsinyu-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hsinyu-blue)] focus:ring-offset-2 focus:ring-offset-[var(--ui-bg)] disabled:opacity-50 disabled:cursor-not-allowed theme-transition',
  
  // Feedback
  message:       'mt-4 text-sm font-medium',
  success:       'text-emerald-600',
  error:         'text-rose-600',
} as const;

// [C] 元件主體
export const ContactForm: React.FC = () => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', website_url: '' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success'|'error', msg: string } | null>(null);
  const [cooldown, setCooldown] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Email/Phone validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9+\-\s]{8,15}$/;

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Honeypot check
    if (honeypotRef.current?.value) {
      console.error('Spam detected via bot_field');
      return; 
    }

    // 環境變數檢查
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setStatus({ type: 'error', msg: '系統組態錯誤，請稍後再試。' });
      return;
    }

    setLoading(true);
    setStatus(null);

    // If Supabase isn't configured, show a mockup success message.
    if (!supabase) {
      setTimeout(() => {
        setStatus({ type: 'success', msg: '開發模式：資料送出成功 (Supabase 尚未設定)' });
        setFormData({ name: '', email: '', phone: '', message: '', website_url: '' });
        setLoading(false);
        setCooldown(true);
        setTimeout(() => setCooldown(false), 30000); // 30s cooldown
      }, 1000);
      return;
    }

    try {
      const { error } = await supabase.from('contacts').insert([formData]);
      if (error) throw error;
      
      setStatus({ type: 'success', msg: '感謝您的諮詢，我們已收到訊息！' });
      setFormData({ name: '', email: '', phone: '', message: '', website_url: '' });
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000); // 30s cooldown
    } catch (err: any) {
      console.error('Submission error:', err);
      setStatus({ type: 'error', msg: err?.message || '送出失敗，請稍後再試。' });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className={STYLES.wrapper} aria-labelledby="contact-heading">
      <div className={STYLES.container}>
        
        {/* Left Column */}
        <header className={STYLES.leftCol}>
          <h2 id="contact-heading" className={STYLES.title}>數位諮詢</h2>
          <div className={STYLES.titleEng}>CONTACT US</div>
          <p className={STYLES.desc}>
            開啟孩子的無限可能，讓我們的專業顧問團隊為您解答所有學習上的疑惑。歡迎留下資訊，我們將盡快與您聯繫。
          </p>
        </header>

        {/* Right Column / Form */}
        <div className={STYLES.rightCol}>
          <form className={STYLES.form} onSubmit={handleSubmit} aria-label="數位諮詢表單">
            
            {/* DRY Map Render for Inputs */}
            {FORM_FIELDS.map((field) => (
              <div key={field.id} className={STYLES.inputGroup}>
                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  placeholder={field.label}
                  className={STYLES.input}
                  value={(formData as any)[field.name]}
                  onChange={handleChange}
                  required={field.name !== 'phone'}
                />
                <label htmlFor={field.id} className={STYLES.label}>
                  {field.label}
                </label>
              </div>
            ))}

            {/* Honeypot */}
            <input 
              type="text" 
              name="bot_field" 
              ref={honeypotRef}
              style={{display: 'none'}}
              tabIndex={-1} 
              autoComplete="off"
            />
            {/* Website Honeypot (Legacy) */}
            <input 
              type="text" 
              name="website_url" 
              value={formData.website_url} 
              onChange={handleChange}
              className="hidden" 
              tabIndex={-1} 
              autoComplete="off"
            />

            {/* Textarea Field */}
            <div className={STYLES.inputGroup}>
              <textarea
                id="contact-message"
                name="message"
                rows={3}
                placeholder="您的訊息 Message"
                className={`${STYLES.input} resize-none`}
                value={formData.message}
                onChange={handleChange}
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
                disabled={loading || cooldown}
                className={`${GSAP_SELECTORS.magneticBtn} ${STYLES.button}`}
                aria-label="提交諮詢表單"
              >
                {loading ? '傳送中...' : cooldown ? '感謝您的諮詢，我們已收到訊息！' : '啟程探索'}
              </button>
            </div>
            
            {status && (
              <div aria-live="polite" className={`${STYLES.message} ${status.type === 'success' ? STYLES.success : STYLES.error}`}>
                {status.msg}
              </div>
            )}

          </form>
        </div>
        
      </div>
    </section>
  );
};
