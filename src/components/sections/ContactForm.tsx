import React, { useEffect, useRef, useState } from 'react';
import { LAYOUT } from '../../styles/layout';
import { supabase } from '../../lib/supabase';

/**
 * [A] 視覺資訊備註
 * 元件角色：Connect & Consult 聯絡我們 (數位諮詢入口)
 *
 * 規範修正 (2026-04-27)：
 * - handleSubmit mock 分支重構：原本 setTimeout 後 finally 仍會執行 setLoading(false)，
 *   造成兩次 setLoading 與 race condition。
 *   改為 await new Promise(setTimeout) + early return，完全隔離 mock 路徑。
 * - Honeypot check 移至函式最前，避免後續邏輯仍執行。
 */

const GSAP_SELECTORS = { magneticBtn: 'magnetic-button-element' } as const;

const FORM_FIELDS = [
  { id: 'contact-name',  name: 'name',  type: 'text',  label: '您的姓名 Name'  },
  { id: 'contact-email', name: 'email', type: 'email', label: '電子郵件 Email' },
  { id: 'contact-phone', name: 'phone', type: 'tel',   label: '聯絡電話 Phone' },
];

const STYLES = {
  wrapper:     'flex flex-col w-full px-6 py-24 bg-[var(--ui-bg)] theme-transition md:flex-row md:justify-between md:py-32',
  container:   `${LAYOUT.container} flex flex-col gap-16 md:flex-row md:items-start`,
  leftCol:     'flex flex-col flex-1 max-w-sm',
  title:       'text-4xl font-bold tracking-tight text-[var(--brand-primary)] mb-2 theme-transition md:text-5xl lg:text-6xl',
  titleEng:    'text-sm tracking-[0.3em] text-[var(--text-sub)] uppercase mb-6',
  desc:        'text-base leading-loose text-[var(--text-sub)] theme-transition',
  rightCol:    'flex flex-col flex-1 w-full max-w-xl md:ml-auto',
  form:        'flex flex-col w-full',
  inputGroup:  'relative pt-6 mb-10 w-full',
  input:       'peer w-full bg-transparent border-b border-[var(--ui-border)] py-2 text-[var(--text-main)] placeholder-transparent outline-none transition-colors focus:border-[var(--hsinyu-blue)] theme-transition',
  label:       'absolute left-0 top-8 text-base text-[var(--text-sub)] pointer-events-none transition-all duration-300 peer-focus:top-1 peer-focus:text-xs peer-focus:text-[var(--hsinyu-blue)] peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-[var(--text-sub)] theme-transition',
  btnContainer:'flex justify-start mt-4',
  button:      'px-12 py-4 rounded-full bg-[var(--brand-primary)] text-[var(--ui-bg)] font-medium transition-colors theme-transition hover:bg-[var(--hsinyu-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--hsinyu-blue)] focus:ring-offset-2 focus:ring-offset-[var(--ui-bg)] disabled:opacity-50 disabled:cursor-not-allowed',
  message:     'mt-4 text-sm font-medium',
  success:     'text-[var(--color-success)]',
  error:       'text-[var(--color-danger)]',
} as const;

export const ContactForm: React.FC = () => {
  const btnRef     = useRef<HTMLButtonElement>(null);
  const honeypotRef= useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '', website_url: '' });
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<{ type: 'success'|'error'; msg: string } | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // rAF 磁吸效果
  const target   = useRef({ x: 0, y: 0 });
  const current  = useRef({ x: 0, y: 0 });
  const rafActive= useRef(false);
  const sleeping = useRef(true);
  const rafId    = useRef(0);

  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const loop = () => {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * 0.15;
      current.current.y += dy * 0.15;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        rafActive.current = false;
        sleeping.current  = true;
        btn.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
        return;
      }
      btn.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0)`;
      rafId.current = requestAnimationFrame(loop);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      target.current.x = (e.clientX - rect.left - rect.width  / 2) * 0.3;
      target.current.y = (e.clientY - rect.top  - rect.height / 2) * 0.3;
      if (sleeping.current && !rafActive.current) {
        sleeping.current  = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    const handleMouseLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
      if (sleeping.current && !rafActive.current) {
        sleeping.current  = false;
        rafActive.current = true;
        rafId.current = requestAnimationFrame(loop);
      }
    };

    btn.addEventListener('mousemove',   handleMouseMove,   { passive: true });
    btn.addEventListener('mouseleave',  handleMouseLeave,  { passive: true });
    return () => {
      cancelAnimationFrame(rafId.current);
      btn.removeEventListener('mousemove',  handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check（最前置，立即 return）
    if (honeypotRef.current?.value) return;

    // 環境變數檢查
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setStatus({ type: 'error', msg: '系統組態錯誤，請稍後再試。' });
      return;
    }

    setLoading(true);
    setStatus(null);

    // [修正] Mock 分支：await Promise 後 early return，不進入 try/catch
    // 原本 setTimeout 是非同步，return 後 finally 仍會跑 setLoading(false)
    // 修正後完全隔離 mock 路徑，loading 狀態由 mock 自行管理
    if (!supabase) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      setStatus({ type: 'success', msg: '開發模式：資料送出成功（Supabase 尚未設定）' });
      setFormData({ name: '', email: '', phone: '', message: '', website_url: '' });
      setLoading(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
      return; // ← early return，完全不進入下方 try/catch
    }

    // 正式流程
    try {
      const { error } = await supabase.from('contacts').insert([formData]);
      if (error) throw error;
      setStatus({ type: 'success', msg: '感謝您的諮詢，我們已收到訊息！' });
      setFormData({ name: '', email: '', phone: '', message: '', website_url: '' });
      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err?.message || '送出失敗，請稍後再試。' });
    } finally {
      // [修正] finally 只在正式流程執行，mock 路徑已 early return 不會到這
      setLoading(false);
    }
  };

  return (
    <section id="contact" className={STYLES.wrapper} aria-labelledby="contact-heading">
      <div className={STYLES.container}>

        <header className={STYLES.leftCol}>
          <h2 id="contact-heading" className={STYLES.title}>數位諮詢</h2>
          <div className={STYLES.titleEng}>CONTACT US</div>
          <p className={STYLES.desc}>
            開啟孩子的無限可能，讓我們的專業顧問團隊為您解答所有學習上的疑惑。歡迎留下資訊，我們將盡快與您聯繫。
          </p>
        </header>

        <div className={STYLES.rightCol}>
          <form className={STYLES.form} onSubmit={handleSubmit} aria-label="數位諮詢表單">

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
                <label htmlFor={field.id} className={STYLES.label}>{field.label}</label>
              </div>
            ))}

            {/* Honeypot */}
            <input type="text" name="bot_field"   ref={honeypotRef} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <input type="text" name="website_url" value={formData.website_url} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />

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
              <label htmlFor="contact-message" className={STYLES.label}>您的訊息 Message</label>
            </div>

            <div className={STYLES.btnContainer}>
              <button
                ref={btnRef}
                type="submit"
                disabled={loading || cooldown}
                className={`${GSAP_SELECTORS.magneticBtn} ${STYLES.button}`}
                aria-label="提交諮詢表單"
              >
                {loading ? '傳送中...' : cooldown ? '已收到！稍後再試' : '啟程探索'}
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
