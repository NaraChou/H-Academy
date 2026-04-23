import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LAYOUT } from '../styles/layout';
import {
  Award, BookOpen, Clock, TrendingUp, Plus, X,
  AlertCircle, Trophy, Send, Key, Star,
  CheckCircle2, Bell, UserPlus, Users, Monitor,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * [A] 視覺資訊備註
 * 頁面：Dashboard (學術入口)
 * 改版重點：
 *  - isAdmin 從 profiles.role 判斷，移除硬編碼 email 邏輯。
 *  - status 防線：非 'active' 帳號強制 signOut + 導向 /login。
 *  - 成績表改用 grade_records（student_id / term / created_by）。
 *  - 打卡表改用 attendance_logs（student_id / check_type）。
 *  - Admin 新增「邀請學生」面板，呼叫 Supabase Edge Function。
 * 無 rAF 高頻動畫，故無 GSAP_SELECTORS。
 */

// ── 型別定義 ──────────────────────────────────────────────────────
interface Profile {
  id: string;
  email: string;
  role: 'student' | 'admin';
  status: 'invited' | 'active' | 'suspended' | 'archived';
  student_no: string | null;
  full_name: string | null;
  class_name: string | null;
}

interface GradeRecord {
  id: number;
  student_id: string;
  subject: string;
  term: string;
  score: number;
  exam_date: string | null;
  graded_at: string;
  created_by: string;
  profiles?: { full_name: string | null; student_no: string | null; class_name: string | null };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: boolean;
  created_at: string;
}

// [B] 樣式常數（強制排序：Layout → Visual → State → Responsive）
const STYLES = {
  wrapper:     'flex flex-col w-full px-1 py-10 bg-[var(--ui-bg)] theme-transition md:px-6 md:pt-12 md:pb-0',
  container:   LAYOUT.container,
  header:      'flex justify-between items-end mb-8 border-b border-[var(--ui-border)] pb-6 theme-transition md:mb-12',
  title:       'text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition md:text-4xl',
  subtitle:    'mt-2 text-sm font-light text-[var(--text-sub)] md:text-lg',
  logoutBtn:   'px-4 py-2 bg-[var(--ui-border)] text-[var(--text-main)] text-[10px] font-bold tracking-widest rounded-lg transition-all duration-300 hover:bg-[var(--brand-primary)] hover:text-white md:px-6 md:py-2',

  // Bento Grid
  bentoContainer: 'grid grid-cols-1 gap-4 auto-rows-auto md:grid-cols-3 md:gap-6 md:auto-rows-[200px]',
  bentoItem:   'flex flex-col justify-between min-h-[160px] p-6 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm overflow-hidden theme-transition hover:shadow-lg duration-500 md:min-h-0 md:p-8',
  bentoLarge:  'md:col-span-2 md:row-span-2 h-full',
  bentoFull:   'md:col-span-3 row-span-1',
  itemHeader:  'flex items-center gap-3 mb-4',
  iconBox:     'p-2 rounded-lg bg-[var(--ui-border)] text-[var(--brand-primary)]',
  cardLabel:   'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase',

  // Student grade table (inside Bento)
  gradeRow:     'grid items-center px-4 py-5 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/50 transition-colors gap-y-3 md:gap-y-0',
  gradeSubject: 'font-bold text-[var(--text-main)]',
  gradeMeta:    'text-[10px] text-[var(--text-sub)] uppercase tracking-tighter',
  gradeScore:   'font-mono text-xl font-black transition-all duration-300',

  // Admin grade section（Bento Grid 外，流式自然高度不受 Grid 高度限制）
  gradeSection: 'mt-6 mb-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm theme-transition md:mt-8 md:mb-12',
  gradeTh:      'px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap',
  gradeTd:      'px-6 py-5 text-sm text-[var(--text-main)] whitespace-nowrap',
  gradeTdRight: 'px-6 py-5 text-right whitespace-nowrap',

  // Announce
  announceItem:  'group flex justify-between items-center px-2 py-4 border-b border-[var(--ui-border)] last:border-0 cursor-pointer hover:bg-[var(--ui-bg)]/30 transition-all',
  announceTitle: 'text-sm font-bold text-[var(--text-main)] group-hover:translate-x-1 transition-transform',
  announceDate:  'text-[9px] font-mono text-[var(--text-sub)] uppercase',
  priorityTag:   'inline-block px-2 py-0.5 mr-2 bg-black text-white text-[8px] font-bold tracking-widest uppercase',

  // Modal
  modalOverlay: 'fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm',
  modalContent: 'relative flex flex-col w-full max-w-md overflow-hidden bg-[var(--ui-bg)] border border-black p-8 shadow-2xl theme-transition',
  modalLine:    'absolute top-0 left-0 w-full h-[1px] bg-black',
  formLabel:    'block mb-2 text-[10px] font-bold tracking-[0.2em] text-[var(--text-sub)] uppercase',
  input:        'w-full px-4 py-3 mb-6 bg-transparent border border-[var(--ui-border)] text-sm text-[var(--text-main)] outline-none transition-colors focus:border-black theme-transition',
  submitBtn:    'flex items-center justify-center gap-3 w-full py-4 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-neutral-800 transition-all duration-300',
  addBtn:       'flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300',

  // Pagination
  pageBtn:    'px-3 py-1 border border-[var(--ui-border)] text-[9px] font-bold transition-all hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
  emptyText:  'py-12 text-center text-[var(--text-sub)] italic font-light',

  // Check-in
  checkInStrip:  'flex flex-col gap-6 md:flex-row md:items-center md:justify-between',
  checkInActive: 'bg-black text-white shadow-xl hover:scale-105 active:scale-95',
  checkInDone:   'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed',

  // Feedback
  successBox: 'mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 text-center',
  errorBox:   'mb-4 px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-600 text-center',
} as const;

const PER_PAGE_ANNOUNCE = 10;
const PER_PAGE_GRADES   = 10;

// [C] 元件主體
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // ── Auth / Profile ──────────────────────────────────────────────
  const [user, setUser]       = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin'; // 完全由 DB 決定，無硬編碼

  // ── Grades ──────────────────────────────────────────────────────
  const [grades, setGrades]           = useState<GradeRecord[]>([]);
  const [gradePage, setGradePage]     = useState(0);
  const [totalGrades, setTotalGrades] = useState(0);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);
  const [isGradeOpen, setIsGradeOpen] = useState(false);
  const [isGradeSubmitting, setIsGradeSubmitting] = useState(false);
  const [newGrade, setNewGrade] = useState({
    target_student_id: '', subject: '', term: '113-2', score: '', exam_date: '',
  });

  // ── Attendance ──────────────────────────────────────────────────
  const [attendanceCount, setAttendanceCount]         = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday]     = useState(false);
  const [isCheckingIn, setIsCheckingIn]               = useState(false);

  // ── Announcements ────────────────────────────────────────────────
  const [announcements, setAnnouncements]             = useState<Announcement[]>([]);
  const [announcePage, setAnnouncePage]               = useState(0);
  const [totalAnnounce, setTotalAnnounce]             = useState(0);
  const [readIds, setReadIds]                         = useState<string[]>([]);
  const [viewingAnnounce, setViewingAnnounce]         = useState<Announcement | null>(null);
  const [isAnnounceCreate, setIsAnnounceCreate]       = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({ title: '', content: '', priority: false });

  // ── Invite Student (Admin) ───────────────────────────────────────
  const [isInviteOpen, setIsInviteOpen]   = useState(false);
  const [isInviting, setIsInviting]       = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError]     = useState('');
  const [newInvite, setNewInvite] = useState({
    email: '', full_name: '', class_name: '', student_no: '',
  });

  // ── Toast ────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch helpers ────────────────────────────────────────────────
  const fetchGrades = async (studentId?: string) => {
    if (!supabase) return;
    const from = gradePage * PER_PAGE_GRADES;
    const to   = from + PER_PAGE_GRADES - 1;

    // Admin 附帶 join profiles 取得學生姓名；學生只查自己
    let query = supabase
      .from('grade_records')
      .select(
        isAdmin ? '*, profiles!student_id(full_name, student_no, class_name)' : '*',
        { count: 'exact' }
      );
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error, count } = await query
      .order('graded_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setGrades(data as GradeRecord[]);
      setTotalGrades(count || 0);
    }
  };

  const fetchAttendance = async (studentId: string) => {
    if (!supabase) return;
    const { data, error, count } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId)
      .eq('check_type', 'in');

    if (!error && data) {
      setAttendanceCount(count || 0);
      const today = new Date().toLocaleDateString('zh-TW');
      setHasCheckedInToday(
        data.some((log: any) => new Date(log.checked_at).toLocaleDateString('zh-TW') === today)
      );
    }
  };

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    const from = announcePage * PER_PAGE_ANNOUNCE;
    const to   = from + PER_PAGE_ANNOUNCE - 1;
    const { data, error, count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (!error && data) { setAnnouncements(data as Announcement[]); setTotalAnnounce(count || 0); }
  };

  // ── Init ─────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!supabase) return;

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) { navigate('/login'); return; }

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileErr || !profileData) {
        await supabase.auth.signOut();
        navigate('/login?error=no_profile');
        return;
      }

      // [P0 安全防線] 非 active 帳號一律攔截
      if (profileData.status !== 'active') {
        await supabase.auth.signOut();
        navigate(`/login?error=${profileData.status}`);
        return;
      }

      setUser({ id: currentUser.id, email: currentUser.email ?? '' });
      setProfile(profileData as Profile);

      const adminMode = profileData.role === 'admin';

      await Promise.all([
        fetchAnnouncements(),
        adminMode ? fetchGrades() : fetchGrades(currentUser.id),
        adminMode ? Promise.resolve() : fetchAttendance(currentUser.id),
      ]);

      setIsLoading(false);
    };

    try {
      const stored = localStorage.getItem('readAnnouncements');
      if (stored) setReadIds(JSON.parse(stored));
    } catch { /* ignore */ }

    init();
  }, [navigate]);

  useEffect(() => { if (!isLoading && user) fetchAnnouncements(); }, [announcePage]);
  useEffect(() => { if (!isLoading && user) fetchGrades(isAdmin ? undefined : user.id); }, [gradePage]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  const handleMarkAsRead = (announce: Announcement) => {
    setViewingAnnounce(announce);
    if (!readIds.includes(announce.id)) {
      const updated = [...readIds, announce.id];
      setReadIds(updated);
      localStorage.setItem('readAnnouncements', JSON.stringify(updated));
    }
  };

  const handleCheckIn = async () => {
    if (!supabase || !user || hasCheckedInToday || isCheckingIn) return;
    setIsCheckingIn(true);
    try {
      const { error } = await supabase
        .from('attendance_logs')
        .insert([{ student_id: user.id, check_type: 'in' }]);
      if (!error) await fetchAttendance(user.id);
    } finally { setIsCheckingIn(false); }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user || !isAdmin) return;
    if (!newGrade.target_student_id.trim()) { showToast('請輸入學生 UUID', 'error'); return; }
    setIsGradeSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('grade_records')
        .insert([{
          student_id: newGrade.target_student_id.trim(),
          subject:    newGrade.subject,
          term:       newGrade.term || '113-2',
          score:      parseFloat(newGrade.score),
          exam_date:  newGrade.exam_date || null,
          created_by: user.id,            // RLS 要求 admin 的 uid
        }])
        .select();

      if (!error && data?.length) {
        setIsGradeOpen(false);
        setNewGrade({ target_student_id: '', subject: '', term: '113-2', score: '', exam_date: '' });
        showToast('成績已成功登入系統');
        setLastAddedId((data[0] as GradeRecord).id);
        setTimeout(() => setLastAddedId(null), 5000);
        await fetchGrades();
      } else {
        showToast(`提交失敗：${error?.message ?? '未知錯誤'}`, 'error');
      }
    } finally { setIsGradeSubmitting(false); }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isAdmin) return;
    const { error } = await supabase
      .from('announcements')
      .insert([{ title: newAnnounce.title, content: newAnnounce.content, priority: newAnnounce.priority }]);
    if (!error) {
      setIsAnnounceCreate(false);
      setNewAnnounce({ title: '', content: '', priority: false });
      await fetchAnnouncements();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!supabase || !isAdmin || !confirm('確定要刪除這條公告嗎？')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) { await fetchAnnouncements(); setViewingAnnounce(null); }
  };

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isAdmin) return;
    setIsInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const { data, error } = await supabase.functions.invoke('invite-student', {
        body: {
          email:      newInvite.email.trim(),
          full_name:  newInvite.full_name.trim() || null,
          class_name: newInvite.class_name.trim() || null,
          student_no: newInvite.student_no.trim() || null,
        },
      });

      if (error) {
        let detailedMessage = '';
        const errorContext = (error as any)?.context;

        if ((data as any)?.error) {
          detailedMessage = (data as any).error;
        }

        if (!detailedMessage && errorContext && typeof errorContext.json === 'function') {
          const body = await errorContext.json().catch(() => null);
          detailedMessage = body?.error || '';
        }

        if (!detailedMessage && errorContext && typeof errorContext.text === 'function') {
          const text = await errorContext.text().catch(() => '');
          detailedMessage = text || '';
        }

        throw new Error(detailedMessage || error.message || '邀請失敗');
      }

      const successMessage = (data as any)?.message || `邀請信已寄送至 ${newInvite.email}`;
      setInviteSuccess(successMessage);
      setNewInvite({ email: '', full_name: '', class_name: '', student_no: '' });
    } catch (err: any) {
      console.error('[invite-student] invoke failed:', err);
      const message =
        err?.message ||
        (err?.name === 'FunctionsFetchError'
          ? '無法連線至 Edge Function，請檢查 Function 是否已部署、以及 CORS 設定。'
          : '邀請失敗，請確認信箱是否重複或聯絡系統管理員。');
      setInviteError(message);
    } finally { setIsInviting(false); }
  };

  // ── 視覺輔助函式 ─────────────────────────────────────────────────
  const renderScore = (score: number) => {
    if (score === 100) return <span className={`${STYLES.gradeScore} flex items-center gap-2 text-[#D4AF37]`}><Trophy size={16} aria-hidden="true" /> {score}</span>;
    if (score >= 90)   return <span className={`${STYLES.gradeScore} font-black text-black`}>{score}</span>;
    if (score < 60)    return <span className={`${STYLES.gradeScore} flex items-center gap-1 text-[#E11D48]`}><AlertCircle size={14} aria-hidden="true" /> {score}</span>;
    if (score <= 70)   return <span className={`${STYLES.gradeScore} font-medium text-neutral-400`}>{score}</span>;
    return <span className={`${STYLES.gradeScore} text-[var(--brand-primary)]`}>{score}</span>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '–';
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch { return dateStr; }
  };

  const averageScore = grades.length > 0
    ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1)
    : '0';

  const hasUnread = announcements.some(a => !readIds.includes(a.id));

  return (
    <section className={STYLES.wrapper} aria-label="Dashboard 儀表板">
      <div className={STYLES.container}>

        {/* ── Header ── */}
        <header className={STYLES.header}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-white rounded-2xl shadow-lg">
              {isAdmin ? <Key size={24} aria-hidden="true" /> : <Star size={24} aria-hidden="true" />}
            </div>
            <div>
              <h1 className={STYLES.title}>{isAdmin ? '院長您好' : '歡迎回來'}</h1>
              <p className={STYLES.subtitle}>
                {isAdmin
                  ? `${profile?.full_name ?? user?.email?.split('@')[0]} 管理員`
                  : `${profile?.full_name ?? user?.email?.split('@')[0]} 同學，今日學習愉快`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell size={20} className={hasUnread ? 'animate-bounce text-[var(--brand-primary)]' : 'text-black/20'} aria-hidden="true" />
              {hasUnread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48] border-2 border-white" />}
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/check-in')}
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-black tracking-widest uppercase hover:bg-black hover:text-white transition-all"
              >
                <Monitor size={14} />
                Check-in Mode
              </button>
            )}
            <button onClick={handleLogout} className={STYLES.logoutBtn} aria-label="安全登出">安全登出</button>
          </div>
        </header>

        {/* ── Bento Grid ── */}
        <main className={STYLES.bentoContainer}>

          {/* 公告面板（2 cols × 2 rows） */}
          <div className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
            <div className="flex justify-between items-start mb-6 w-full">
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}><Clock size={20} aria-hidden="true" /></div>
                <div className="flex items-center gap-2">
                  <span className={STYLES.cardLabel}>重要公告</span>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" aria-hidden="true" />}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => setIsAnnounceCreate(true)} className={STYLES.addBtn} aria-label="發布新公告">
                  <Plus size={12} aria-hidden="true" /> Post
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                <motion.div key={announcePage}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.3 }}
                >
                  {announcements.length > 0 ? (
                    <>
                      {announcements.map(ann => {
                        const isRead = readIds.includes(ann.id);
                        return (
                          <div key={ann.id}
                            className={`${STYLES.announceItem} ${isRead ? 'opacity-60' : ''}`}
                            onClick={() => handleMarkAsRead(ann)}
                            role="button" tabIndex={0} aria-label={`查看公告：${ann.title}`}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                {ann.priority && <span className={STYLES.priorityTag}>TOP</span>}
                                <span className={STYLES.announceTitle}>{ann.title}</span>
                              </div>
                              <span className={STYLES.announceDate}>{formatDate(ann.created_at)}</span>
                            </div>
                            {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />}
                          </div>
                        );
                      })}
                      <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-[var(--ui-border)]">
                        <button disabled={announcePage === 0} onClick={() => setAnnouncePage(p => p - 1)} className={STYLES.pageBtn} aria-label="上一頁">PREV</button>
                        <span className="text-[10px] font-mono tracking-widest uppercase">
                          {announcePage + 1} / {Math.max(1, Math.ceil(totalAnnounce / PER_PAGE_ANNOUNCE))}
                        </span>
                        <button
                          disabled={(announcePage + 1) * PER_PAGE_ANNOUNCE >= totalAnnounce}
                          onClick={() => setAnnouncePage(p => p + 1)} className={STYLES.pageBtn} aria-label="下一頁"
                        >NEXT</button>
                      </div>
                    </>
                  ) : (
                    <div className={STYLES.emptyText}>目前尚無任何公告</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Admin：邀請學生面板（1 col） */}
          {isAdmin && (
            <div className={STYLES.bentoItem}>
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}><UserPlus size={20} aria-hidden="true" /></div>
                <span className={STYLES.cardLabel}>邀請新學生</span>
              </div>
              <p className="my-4 text-xs leading-relaxed text-[var(--text-sub)] theme-transition">
                發送邀請信，讓學生自行設定密碼完成啟用。
              </p>
              <button
                onClick={() => { setIsInviteOpen(true); setInviteSuccess(''); setInviteError(''); }}
                className={STYLES.addBtn} aria-label="開啟邀請學生表單"
              >
                <Plus size={12} aria-hidden="true" /> Send Invite
              </button>


            </div>
          )}

          {/* 學生專屬成績面板（Bento Large） */}
          {!isAdmin && (
            <div className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
              <div className="flex justify-between items-start mb-6 w-full px-2">
                <div className={`${STYLES.itemHeader} mb-0`}>
                  <div className={STYLES.iconBox}><Award size={20} aria-hidden="true" /></div>
                  <span className={STYLES.cardLabel}>學期成績單</span>
                </div>
              </div>

              <div className="grid grid-cols-2 px-4 py-2 bg-[var(--ui-bg)] border-y border-[var(--ui-border)] text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase md:grid-cols-3">
                <span>科目</span>
                <span className="hidden md:inline">學期</span>
                <span className="text-right">分數</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 mt-2">
                <AnimatePresence mode="wait">
                  <motion.div key={gradePage}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.3 }}
                  >
                    {grades.length > 0 ? (
                      <>
                        {grades.map(grade => (
                          <motion.div key={grade.id}
                            className={`${STYLES.gradeRow} grid-cols-2 md:grid-cols-3`}
                            initial={lastAddedId === grade.id ? { backgroundColor: 'rgba(0,0,0,0.05)' } : false}
                            animate={{ backgroundColor: 'transparent' }}
                            transition={{ duration: 2 }}
                          >
                            <span className={STYLES.gradeSubject}>{grade.subject}</span>
                            <span className={`${STYLES.gradeMeta} hidden md:inline`}>{grade.term}</span>
                            <div className="text-right">{renderScore(grade.score)}</div>
                          </motion.div>
                        ))}
                        <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-[var(--ui-border)]">
                          <button disabled={gradePage === 0} onClick={() => setGradePage(p => p - 1)} className={STYLES.pageBtn} aria-label="上一頁">PREV</button>
                          <span className="text-[10px] font-mono tracking-widest uppercase">
                            {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_GRADES))}
                          </span>
                          <button
                            disabled={(gradePage + 1) * PER_PAGE_GRADES >= totalGrades}
                            onClick={() => setGradePage(p => p + 1)} className={STYLES.pageBtn} aria-label="下一頁"
                          >NEXT</button>
                        </div>
                      </>
                    ) : (
                      <div className={STYLES.emptyText}>{isLoading ? '資料載入中…' : '目前尚無成績資料'}</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* 學生專屬：GPA + 科目數 */}
          {!isAdmin && (
            <>
              <div className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}><TrendingUp size={20} aria-hidden="true" /></div>
                  <span className={STYLES.cardLabel}>平均積分 (GPA)</span>
                </div>
                <div>
                  <div className="text-5xl font-black text-[var(--brand-primary)] mb-2">{averageScore}</div>
                  <p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">當前學期間總平均</p>
                </div>
              </div>

              <div className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}><BookOpen size={20} aria-hidden="true" /></div>
                  <span className={STYLES.cardLabel}>登載科目數</span>
                </div>
                <div>
                  <div className="text-5xl font-black text-[var(--brand-primary)] mb-2">{isLoading ? '–' : grades.length}</div>
                  <p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">本學期已登載科目</p>
                </div>
              </div>
            </>
          )}

          
        </main>
        {/* 學生專屬：Streak Status (移至底部) */}
        {!isAdmin && (
          <div className={`${LAYOUT.container} mt-12 mb-20`}>
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-10 bg-white border border-black/5 rounded-[2rem] shadow-sm theme-transition">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rotate-3 rounded-2xl bg-black text-white shadow-xl">
                    <Clock size={32} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block mb-1 text-[10px] font-black tracking-[0.2em] text-black/40 uppercase">Streak Status</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-black">{attendanceCount}</span>
                      <span className="text-xs font-bold uppercase text-black/60">Days</span>
                    </div>
                  </div>
                </div>
                <div className="hidden gap-2 lg:flex" aria-hidden="true">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full border border-black/10 ${i < (attendanceCount % 7 || (attendanceCount > 0 ? 7 : 0)) ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20">
                  學習軌跡由櫃檯系統自動登載
                </p>
              </div>
            </div>
          </div>
        )}
        {/* ── Admin 全校成績管理（Bento Grid 完全外部，流式自然高度）──
            放在 </main> 之後才能脫離 Grid 的高度約束，讓表格自由撐開，
            Footer 也會被正確推到最底部。                                    */}
        {isAdmin && (
          <section className={STYLES.gradeSection} aria-label="全校成績管理">
            {/* Section Header */}
            <div className="flex flex-col gap-4 p-8 border-b border-[var(--ui-border)] md:flex-row md:items-center md:justify-between md:p-10">
              <div className={STYLES.itemHeader} style={{ marginBottom: 0 }}>
                <div className={STYLES.iconBox}><Award size={20} aria-hidden="true" /></div>
                <div>
                  <span className={STYLES.cardLabel}>全校成績管理</span>
                  <p className="mt-0.5 text-[10px] text-[var(--text-sub)]">
                    共 {totalGrades} 筆 · 第 {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_GRADES))} 頁
                  </p>
                </div>
              </div>
              <button onClick={() => setIsGradeOpen(true)} className={STYLES.addBtn} aria-label="新增成績">
                <Plus size={12} aria-hidden="true" /> Add Grade
              </button>
            </div>

            {/* Table：overflow-x-auto 讓手機可橫捲，不截斷欄位 */}
            <div className="overflow-x-auto">
              <AnimatePresence mode="wait">
                <motion.div key={gradePage}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}
                >
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">
                        <th className={STYLES.gradeTh}>學生姓名</th>
                        <th className={STYLES.gradeTh}>學號</th>
                        <th className={STYLES.gradeTh}>班級</th>
                        <th className={STYLES.gradeTh}>科目</th>
                        <th className={STYLES.gradeTh}>學期</th>
                        <th className={`${STYLES.gradeTh} text-right`}>分數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ui-border)]">
                      {grades.length > 0 ? (
                        grades.map(grade => (
                          <motion.tr key={grade.id}
                            className="hover:bg-[var(--ui-bg)]/50 transition-colors"
                            initial={lastAddedId === grade.id ? { backgroundColor: 'rgba(0,0,0,0.05)' } : false}
                            animate={{ backgroundColor: 'transparent' }}
                            transition={{ duration: 2 }}
                          >
                            <td className={STYLES.gradeTd}>
                              <span className={STYLES.gradeSubject}>
                                {(grade.profiles as any)?.full_name ?? '–'}
                              </span>
                            </td>
                            <td className={`${STYLES.gradeTd} font-mono text-[var(--text-sub)]`}>
                              {(grade.profiles as any)?.student_no ?? grade.student_id.substring(0, 8)}
                            </td>
                            <td className={`${STYLES.gradeTd} text-[var(--text-sub)]`}>
                              {(grade.profiles as any)?.class_name ?? '–'}
                            </td>
                            <td className={STYLES.gradeTd}>{grade.subject}</td>
                            <td className={`${STYLES.gradeTd} ${STYLES.gradeMeta}`}>{grade.term}</td>
                            <td className={STYLES.gradeTdRight}>{renderScore(grade.score)}</td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className={STYLES.emptyText}>
                            {isLoading ? '資料載入中…' : '目前尚無成績資料'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 分頁控制 */}
            {totalGrades > PER_PAGE_GRADES && (
              <div className="flex justify-center items-center gap-4 px-6 py-6 border-t border-[var(--ui-border)]">
                <button disabled={gradePage === 0} onClick={() => setGradePage(p => p - 1)} className={STYLES.pageBtn} aria-label="上一頁">PREV</button>
                <span className="text-[10px] font-mono tracking-widest uppercase">
                  {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_GRADES))}
                </span>
                <button
                  disabled={(gradePage + 1) * PER_PAGE_GRADES >= totalGrades}
                  onClick={() => setGradePage(p => p + 1)} className={STYLES.pageBtn} aria-label="下一頁"
                >NEXT</button>
              </div>
            )}
          </section>
        )}
      </div>

      {/* ── Modal：新增成績 (Admin) ── */}
      {isGradeOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsGradeOpen(false)}>
          <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">ADD GRADE</span>
              <button onClick={() => setIsGradeOpen(false)} className="p-2 hover:rotate-90 transition-transform duration-500" aria-label="關閉"><X size={20} aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleAddGrade}>
              {[
                { id: 'g-uid',     label: '學生 UUID *',    name: 'target_student_id', type: 'text',   ph: '貼上學生的 profiles.id' },
                { id: 'g-subject', label: '科目 *',          name: 'subject',           type: 'text',   ph: '例：英文' },
                { id: 'g-term',    label: '學期 *',          name: 'term',              type: 'text',   ph: '113-2' },
                { id: 'g-score',   label: '分數 (0–100) *',  name: 'score',             type: 'number', ph: '85' },
                { id: 'g-date',    label: '考試日期',        name: 'exam_date',         type: 'date',   ph: '' },
              ].map(f => (
                <div key={f.id}>
                  <label className={STYLES.formLabel} htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} type={f.type} placeholder={f.ph}
                    required={f.label.includes('*')}
                    min={f.type === 'number' ? '0' : undefined}
                    max={f.type === 'number' ? '100' : undefined}
                    className={STYLES.input}
                    value={(newGrade as any)[f.name]}
                    onChange={e => setNewGrade(g => ({ ...g, [f.name]: e.target.value }))}
                  />
                </div>
              ))}
              <button type="submit" disabled={isGradeSubmitting} className={STYLES.submitBtn}>
                <Send size={14} aria-hidden="true" />
                {isGradeSubmitting ? 'SUBMITTING...' : 'CONFIRM DATA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal：公告詳情 ── */}
      {viewingAnnounce && (
        <div className={STYLES.modalOverlay} onClick={() => setViewingAnnounce(null)}>
          <div className={`${STYLES.modalContent} max-w-2xl`} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className={STYLES.cardLabel}>{formatDate(viewingAnnounce.created_at)}</span>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">{viewingAnnounce.title}</h2>
              </div>
              <button onClick={() => setViewingAnnounce(null)} className="p-2 hover:rotate-90 transition-transform duration-500" aria-label="關閉"><X size={24} aria-hidden="true" /></button>
            </div>
            <div className="flex-1 max-h-[50vh] overflow-y-auto pr-2">
              <p className="whitespace-pre-wrap text-base leading-relaxed font-light text-neutral-600">{viewingAnnounce.content}</p>
            </div>
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-black/5">
              {isAdmin && (
                <button onClick={() => handleDeleteAnnouncement(viewingAnnounce.id)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="刪除公告"
                >Delete</button>
              )}
              <button onClick={() => setViewingAnnounce(null)}
                className="ml-auto px-8 py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase"
                aria-label="關閉詳情"
              >Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal：發布公告 (Admin) ── */}
      {isAdmin && isAnnounceCreate && (
        <div className={STYLES.modalOverlay} onClick={() => setIsAnnounceCreate(false)}>
          <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">POST NEWS</span>
              <button onClick={() => setIsAnnounceCreate(false)} aria-label="關閉"><X size={20} aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleAddAnnouncement}>
              <label className={STYLES.formLabel} htmlFor="ann-title">標題 *</label>
              <input id="ann-title" type="text" required placeholder="公告標題" className={STYLES.input}
                value={newAnnounce.title} onChange={e => setNewAnnounce(a => ({ ...a, title: e.target.value }))} />
              <label className={STYLES.formLabel} htmlFor="ann-content">內容 *</label>
              <textarea id="ann-content" rows={5} required placeholder="公告詳細內容…" className={`${STYLES.input} h-auto resize-none`}
                value={newAnnounce.content} onChange={e => setNewAnnounce(a => ({ ...a, content: e.target.value }))} />
              <div className="flex items-center gap-3 mb-8">
                <input id="ann-priority" type="checkbox" className="w-4 h-4 accent-black"
                  checked={newAnnounce.priority} onChange={e => setNewAnnounce(a => ({ ...a, priority: e.target.checked }))} />
                <label htmlFor="ann-priority" className="cursor-pointer text-[10px] font-bold tracking-widest uppercase">置頂 (Priority)</label>
              </div>
              <button type="submit" className={STYLES.submitBtn}><Send size={14} aria-hidden="true" /> PUBLISH</button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal：邀請學生 (Admin) ── */}
      {isAdmin && isInviteOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsInviteOpen(false)}>
          <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">INVITE STUDENT</span>
              <button onClick={() => setIsInviteOpen(false)} aria-label="關閉"><X size={20} aria-hidden="true" /></button>
            </div>
            <form onSubmit={handleInviteStudent}>
              {[
                { id: 'inv-email', label: '學生信箱 *', name: 'email',      type: 'email', ph: 'student@example.com' },
                { id: 'inv-name',  label: '姓名',       name: 'full_name',  type: 'text',  ph: '王小明' },
                { id: 'inv-class', label: '班級',       name: 'class_name', type: 'text',  ph: '國中二年甲班' },
                { id: 'inv-no',    label: '學號',       name: 'student_no', type: 'text',  ph: 'A1001' },
              ].map(f => (
                <div key={f.id}>
                  <label className={STYLES.formLabel} htmlFor={f.id}>{f.label}</label>
                  <input id={f.id} type={f.type} required={f.label.includes('*')} placeholder={f.ph} className={STYLES.input}
                    value={(newInvite as any)[f.name]}
                    onChange={e => setNewInvite(i => ({ ...i, [f.name]: e.target.value }))}
                  />
                </div>
              ))}

              {inviteError   && <div className={STYLES.errorBox}   role="alert">{inviteError}</div>}
              {inviteSuccess && <div className={STYLES.successBox} role="status">{inviteSuccess}</div>}

              <button type="submit" disabled={isInviting} className={`${STYLES.submitBtn} mt-6`}>
                <Users size={14} aria-hidden="true" />
                {isInviting ? 'SENDING...' : 'SEND INVITE EMAIL'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-8 right-8 z-[1000] flex items-center gap-3 px-6 py-4 border shadow-2xl ${
              toast.type === 'success' ? 'bg-white border-black text-black' : 'bg-red-50 border-red-500 text-red-600'
            }`}
            role="alert"
          >
            {toast.type === 'success'
              ? <CheckCircle2 size={18} className="text-green-500" aria-hidden="true" />
              : <AlertCircle size={18} aria-hidden="true" />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
