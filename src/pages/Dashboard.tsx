import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LAYOUT } from '../styles/layout';
import {
  AlertCircle, Award, Bell, BookOpen, CheckCircle2, Clock,
  Edit3, Key, Loader2, Monitor, Plus, Send, Star, Trash2,
  Trophy, UserPlus, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StaffCheckIn } from '../components/sections/StaffCheckIn';
import { StudentSearchSelect, StudentOption } from '../components/common/StudentSearchSelect';

/**
 * [A] 視覺資訊備註
 * 儀表板 (Layer 05)
 *
 * P0 (2026-04-25)：isMountedRef 防護
 * P1 (2026-04-25)：Token 化色值、Tailwind 排序
 * 防呆修正 (2026-04-27)：
 * - 新增成績 Modal UUID 輸入框 → StudentSearchSelect
 * - selectedStudent state 取代 target_student_id 字串
 * - handleAddGrade 從 selectedStudent.id 取 student_id
 * - 送出後 reset 清除 selectedStudent
 * - 送出按鈕在未選取學生時 disabled
 */

type UserRole = 'admin' | 'teacher' | 'staff' | 'student';
type ToastType = 'success' | 'error';

interface Profile {
  id: string; email: string; role: UserRole;
  status: 'invited' | 'active' | 'suspended' | 'archived';
  student_no: string | null; full_name: string | null; class_name: string | null;
}
interface GradeProfile { full_name: string | null; student_no: string | null; class_name: string | null; }
interface GradeRecord {
  id: number | string; student_id: string; subject: string; term: string;
  score: number; exam_date: string | null; graded_at: string; created_by: string;
  profile?: GradeProfile;
}
interface Announcement { id: string; title: string; content: string; priority: boolean; created_at: string; }
interface GradeFormState { subject: string; term: string; score: string; exam_date: string; }
interface ToastState { message: string; type: ToastType; }

const STYLES = {
  wrapper:      'flex flex-col w-full px-1 py-10 bg-[var(--ui-bg)] theme-transition md:px-6 md:pt-12 md:pb-8',
  container:    LAYOUT.container,
  header:       'flex justify-between items-end mb-8 border-b border-[var(--ui-border)] pb-6 theme-transition md:mb-12',
  headerLeft:   'flex items-center gap-4',
  headerIcon:   'p-3 bg-black text-white rounded-2xl shadow-lg',
  headerRight:  'flex items-center gap-6',
  title:        'text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition md:text-4xl',
  subtitle:     'mt-2 text-sm font-light text-[var(--text-sub)] md:text-lg',
  logoutBtn:    'px-4 py-2 bg-[var(--ui-border)] rounded-lg text-[var(--text-main)] text-[10px] font-bold tracking-widest transition-all duration-300 hover:bg-[var(--brand-primary)] hover:text-white md:px-6',
  modeBtn:      'hidden items-center gap-2 px-4 py-2 border border-black text-[10px] font-black tracking-widest uppercase transition-all hover:bg-black hover:text-white md:flex',
  bentoContainer:'grid grid-cols-1 gap-4 auto-rows-auto md:grid-cols-3 md:gap-6 md:auto-rows-[200px]',
  bentoItem:    'flex flex-col justify-between overflow-hidden min-h-[160px] p-6 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm theme-transition duration-500 hover:shadow-lg md:min-h-0 md:p-8',
  bentoLarge:   'md:col-span-2 md:row-span-2 h-full',
  bentoHeader:  'flex justify-between items-start mb-6 w-full',
  bentoScroll:  'flex-1 overflow-y-auto pr-2',
  itemHeader:   'flex items-center gap-3 mb-4',
  iconBox:      'p-2 rounded-lg bg-[var(--ui-border)] text-[var(--brand-primary)]',
  cardLabel:    'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase',
  gradeRow:     'grid items-center px-4 py-5 border-b border-[var(--ui-border)] last:border-0 gap-y-3 transition-colors hover:bg-[var(--ui-bg)]/50 md:gap-y-0',
  gradeSubject: 'font-bold text-[var(--text-main)]',
  gradeMeta:    'text-[10px] tracking-tighter text-[var(--text-sub)] uppercase whitespace-nowrap',
  gradeScore:   'font-mono text-xl font-black transition-all duration-300',
  announceItem: 'group flex justify-between items-center px-2 py-4 border-b border-[var(--ui-border)] last:border-0 cursor-pointer transition-all hover:bg-[var(--ui-bg)]/30',
  announceTitle:'text-sm font-bold text-[var(--text-main)] transition-transform group-hover:translate-x-1',
  announceDate: 'text-[9px] font-mono text-[var(--text-sub)] uppercase',
  priorityTag:  'inline-block px-2 py-0.5 mr-2 bg-black text-white text-[8px] font-bold tracking-widest uppercase',
  modalOverlay: 'fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm',
  modalContent: 'relative flex flex-col w-full max-w-md overflow-hidden p-8 bg-[var(--ui-bg)] border border-black shadow-2xl theme-transition',
  modalLine:    'absolute top-0 left-0 w-full h-[1px] bg-black',
  formLabel:    'block mb-2 text-[10px] font-bold tracking-[0.2em] text-[var(--text-sub)] uppercase',
  input:        'w-full px-4 py-3 mb-6 bg-transparent border border-[var(--ui-border)] text-sm text-[var(--text-main)] outline-none transition-colors focus:border-black theme-transition',
  submitBtn:    'flex items-center justify-center gap-3 w-full py-4 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase transition-all duration-300 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed',
  addBtn:       'flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-bold tracking-widest uppercase transition-all duration-300 hover:bg-black hover:text-white',
  pageBtn:      'px-3 py-1 border border-[var(--ui-border)] text-[9px] font-bold transition-all hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
  pagination:   'flex justify-center items-center gap-4 mt-4 pt-4 border-t border-[var(--ui-border)]',
  emptyText:    'py-12 text-center text-[var(--text-sub)] italic font-light',
  successBox:   'mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 text-center',
  errorBox:     'mb-4 px-4 py-3 bg-[var(--color-danger-bg)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] text-center',
  checkInWrapper:'mt-12 mb-20',
  checkInCard:  'flex flex-col gap-6 p-10 bg-white border border-black/5 rounded-[2rem] shadow-sm theme-transition md:flex-row md:items-center md:justify-between',
  checkInInfo:  'flex items-center gap-8',
  checkInBox:   'flex items-center gap-4',
  checkInIcon:  'flex items-center justify-center w-16 h-16 rotate-3 rounded-2xl bg-black text-white shadow-xl',
  checkInCount: 'flex items-baseline gap-1',
  weeklyDots:   'hidden gap-2 lg:flex',
  dot:          'w-3 h-3 rounded-full border border-black/10',
  dotActive:    'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]',
} as const;

const PER_PAGE_ANNOUNCE       = 5;
const PER_PAGE_MANAGE_GRADES  = 10;
const PER_PAGE_STUDENT_GRADES = 5;
const EMPTY_GRADE: GradeFormState = { subject: '', term: '113-2', score: '', exam_date: '' };

const getRoleLabel = (r?: UserRole) => ({ admin: '校長', teacher: '教師', staff: '教職員' }[r ?? ''] ?? '學生');

const formatDate = (s: string | null) => {
  if (!s) return '--';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const renderScore = (score: number) => {
  if (score === 100) return <span className={`${STYLES.gradeScore} flex items-center gap-2 text-[var(--score-gold)]`}><Trophy size={16} aria-hidden="true" /> {score}</span>;
  if (score >= 90)   return <span className={`${STYLES.gradeScore} text-black`}>{score}</span>;
  if (score < 60)    return <span className={`${STYLES.gradeScore} flex items-center gap-1 text-[var(--score-fail)]`}><AlertCircle size={14} aria-hidden="true" /> {score}</span>;
  if (score <= 70)   return <span className={`${STYLES.gradeScore} text-neutral-400`}>{score}</span>;
  return <span className={`${STYLES.gradeScore} text-[var(--brand-primary)]`}>{score}</span>;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const [user,      setUser]      = useState<{ id: string; email: string } | null>(null);
  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [grades,             setGrades]             = useState<GradeRecord[]>([]);
  const [allScores,          setAllScores]          = useState<number[]>([]);
  const [gradePage,          setGradePage]          = useState(0);
  const [totalGrades,        setTotalGrades]        = useState(0);
  const [lastUpdatedGradeId, setLastUpdatedGradeId] = useState<number | string | null>(null);
  const [isGradeCreateOpen,  setIsGradeCreateOpen]  = useState(false);
  const [isGradeSubmitting,  setIsGradeSubmitting]  = useState(false);
  const [newGrade,           setNewGrade]           = useState<GradeFormState>(EMPTY_GRADE);
  // [新增] 學生搜尋選取，取代手動輸入 UUID
  const [selectedStudent,    setSelectedStudent]    = useState<StudentOption | null>(null);
  const [editingGrade,       setEditingGrade]       = useState<GradeRecord | null>(null);

  const [attendanceCount,   setAttendanceCount]   = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const [announcements,        setAnnouncements]        = useState<Announcement[]>([]);
  const [announcePage,         setAnnouncePage]         = useState(0);
  const [totalAnnounce,        setTotalAnnounce]        = useState(0);
  const [readIds,              setReadIds]              = useState<string[]>([]);
  const [viewingAnnounce,      setViewingAnnounce]      = useState<Announcement | null>(null);
  const [isAnnounceCreateOpen, setIsAnnounceCreateOpen] = useState(false);
  const [newAnnounce,          setNewAnnounce]          = useState({ title: '', content: '', priority: false });

  const [isInviteOpen,  setIsInviteOpen]  = useState(false);
  const [isInviting,    setIsInviting]    = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError,   setInviteError]   = useState('');
  const [newInvite,     setNewInvite]     = useState({ email: '', full_name: '', class_name: '', student_no: '' });

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const role               = profile?.role;
  const isAdmin            = role === 'admin';
  const isTeacher          = role === 'teacher';
  const isStaff            = role === 'staff';
  const isStudent          = role === 'student';
  const canManageGrades    = isAdmin || isTeacher;
  const canUseStaffCheckIn = isTeacher || isStaff;
  const gradePerPage       = isStudent ? PER_PAGE_STUDENT_GRADES : PER_PAGE_MANAGE_GRADES;

  const averageScore   = useMemo(() => { if (!allScores.length) return '0'; return (allScores.reduce((s, v) => s + v, 0) / allScores.length).toFixed(1); }, [allScores]);
  const hasUnread      = useMemo(() => announcements.some((a) => !readIds.includes(a.id)), [announcements, readIds]);
  const weeklyProgress = useMemo(() => (!attendanceCount ? 0 : attendanceCount % 7 || 7), [attendanceCount]);

  const showToast = (msg: string, type: ToastType = 'success') => {
    if (!isMountedRef.current) return;
    setToast({ message: msg, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => { if (isMountedRef.current) setToast(null); toastTimerRef.current = null; }, 2800);
  };
  useEffect(() => () => { if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current); }, []);

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    const from = announcePage * PER_PAGE_ANNOUNCE;
    const { data, error, count } = await supabase.from('announcements').select('*', { count: 'exact' }).order('priority', { ascending: false }).order('created_at', { ascending: false }).range(from, from + PER_PAGE_ANNOUNCE - 1);
    if (!isMountedRef.current) return;
    if (error) { showToast(`載入公告失敗：${error.message}`, 'error'); return; }
    setAnnouncements((data ?? []) as Announcement[]); setTotalAnnounce(count ?? 0);
  };

  const fetchGrades = async (studentId?: string) => {
    if (!supabase) return;
    const from = gradePage * gradePerPage;
    let q = supabase.from('grade_records').select('id, student_id, subject, term, score, exam_date, graded_at, created_by', { count: 'exact' });
    if (studentId) q = q.eq('student_id', studentId);
    const { data, error, count } = await q.order('graded_at', { ascending: false }).range(from, from + gradePerPage - 1);
    if (!isMountedRef.current) return;
    if (error) { showToast(`載入成績失敗：${error.message}`, 'error'); return; }
    let rows = (data ?? []) as GradeRecord[];
    if (canManageGrades && rows.length > 0) {
      const ids = [...new Set(rows.map((g) => g.student_id))];
      const { data: pr, error: pe } = await supabase.from('profiles').select('id, full_name, student_no, class_name').in('id', ids);
      if (!isMountedRef.current) return;
      if (!pe && pr) { const map = new Map<string, GradeProfile>(); (pr as any[]).forEach((r) => map.set(r.id, { full_name: r.full_name, student_no: r.student_no, class_name: r.class_name })); rows = rows.map((g) => ({ ...g, profile: map.get(g.student_id) })); }
    }
    setGrades(rows); setTotalGrades(count ?? 0);
  };

  const fetchAllStudentScores = async (sid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('grade_records').select('score').eq('student_id', sid);
    if (!isMountedRef.current) return;
    if (!error && data) setAllScores(data.map((r: { score: number }) => Number(r.score)));
  };

  const fetchStudentAttendance = async (sid: string) => {
    if (!supabase) return;
    const { count, error } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('student_id', sid).eq('check_type', 'in');
    if (!isMountedRef.current) return;
    if (!error) setAttendanceCount(count ?? 0);
    const now = new Date();
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    const { data: tl } = await supabase.from('attendance_logs').select('id').eq('student_id', sid).eq('check_type', 'in').gte('checked_at', s).lte('checked_at', e).limit(1);
    if (!isMountedRef.current) return;
    setHasCheckedInToday((tl?.length ?? 0) > 0);
  };

  useEffect(() => { const stored = localStorage.getItem('readAnnouncements'); if (!stored) return; try { const p = JSON.parse(stored); if (Array.isArray(p)) setReadIds(p.filter((v) => typeof v === 'string')); } catch { localStorage.removeItem('readAnnouncements'); } }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase) { if (isMountedRef.current) setIsLoading(false); return; }
      const { data: { user: cu } } = await supabase.auth.getUser();
      if (!isMountedRef.current) return;
      if (!cu) { navigate('/login'); return; }
      const { data: pd, error: pe } = await supabase.from('profiles').select('id, email, role, status, student_no, full_name, class_name').eq('id', cu.id).single();
      if (!isMountedRef.current) return;
      if (pe || !pd) { await supabase.auth.signOut(); navigate('/login?error=no_profile'); return; }
      if (pd.status !== 'active') { await supabase.auth.signOut(); navigate(`/login?error=${pd.status}`); return; }
      setUser({ id: cu.id, email: cu.email ?? '' }); setProfile(pd as Profile); setIsLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => { if (!isLoading && user) fetchAnnouncements(); }, [isLoading, user, announcePage]);
  useEffect(() => { if (isLoading || !user || !profile) return; if (canManageGrades) { fetchGrades(); return; } if (isStudent) { fetchGrades(user.id); return; } setGrades([]); setTotalGrades(0); }, [isLoading, user, profile, canManageGrades, isStudent, gradePage]);
  useEffect(() => { if (!isLoading && user && isStudent) { fetchStudentAttendance(user.id); fetchAllStudentScores(user.id); } }, [isLoading, user, isStudent]);

  const handleLogout = async () => { if (supabase) await supabase.auth.signOut(); navigate('/login'); };

  const handleOpenAnnouncement = (a: Announcement) => {
    setViewingAnnounce(a);
    if (readIds.includes(a.id)) return;
    const next = [...readIds, a.id]; setReadIds(next); localStorage.setItem('readAnnouncements', JSON.stringify(next));
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault(); if (!supabase || !isAdmin) return;
    const title = newAnnounce.title.trim(); const content = newAnnounce.content.trim();
    if (!title || !content) { showToast('請填寫公告標題與內容。', 'error'); return; }
    const { error } = await supabase.from('announcements').insert([{ title, content, priority: newAnnounce.priority }]);
    if (!isMountedRef.current) return;
    if (error) { showToast(`發佈公告失敗：${error.message}`, 'error'); return; }
    setIsAnnounceCreateOpen(false); setNewAnnounce({ title: '', content: '', priority: false }); showToast('公告已發佈！');
    if (announcePage !== 0) setAnnouncePage(0); else fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!supabase || !isAdmin || !window.confirm('確定要刪除此公告嗎？')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!isMountedRef.current) return;
    if (error) { showToast(`刪除公告失敗：${error.message}`, 'error'); return; }
    showToast('公告已刪除。'); setViewingAnnounce(null);
    if (announcements.length === 1 && announcePage > 0) setAnnouncePage((p) => p - 1); else fetchAnnouncements();
  };

  // [修正] handleAddGrade：student_id 從 selectedStudent.id 取得
  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault(); if (!supabase || !user || !canManageGrades) return;
    if (!selectedStudent) { showToast('請先選取學生。', 'error'); return; }
    const subject = newGrade.subject.trim(); const term = newGrade.term.trim() || '113-2'; const score = Number(newGrade.score);
    if (!subject || isNaN(score) || score < 0 || score > 100) { showToast('請完整填寫科目與 0–100 分數。', 'error'); return; }
    setIsGradeSubmitting(true);
    const { data, error } = await supabase.from('grade_records').insert([{ student_id: selectedStudent.id, subject, term, score, exam_date: newGrade.exam_date || null, created_by: user.id }]).select('id').single();
    if (!isMountedRef.current) return;
    setIsGradeSubmitting(false);
    if (error) { showToast(`新增成績失敗：${error.message}`, 'error'); return; }
    // reset
    setIsGradeCreateOpen(false); setNewGrade(EMPTY_GRADE); setSelectedStudent(null);
    setLastUpdatedGradeId((data as any)?.id ?? null);
    showToast(`已為 ${selectedStudent.full_name ?? '學生'} 新增成績！`);
    window.setTimeout(() => { if (isMountedRef.current) setLastUpdatedGradeId(null); }, 3000);
    if (gradePage !== 0) setGradePage(0); else fetchGrades();
  };

  const handleUpdateGrade = async (e: React.FormEvent) => {
    e.preventDefault(); if (!supabase || !editingGrade || !canManageGrades) return;
    const { subject, term, score, exam_date, id } = editingGrade;
    if (!subject.trim() || !term.trim() || isNaN(Number(score))) { showToast('請完整輸入成績資料。', 'error'); return; }
    setIsGradeSubmitting(true);
    const { error } = await supabase.from('grade_records').update({ subject: subject.trim(), term: term.trim(), score: Number(score), exam_date: exam_date || null }).eq('id', id);
    if (!isMountedRef.current) return;
    setIsGradeSubmitting(false);
    if (error) { showToast(`更新成績失敗：${error.message}`, 'error'); return; }
    setLastUpdatedGradeId(id); setEditingGrade(null); showToast('成績已更新！');
    window.setTimeout(() => { if (isMountedRef.current) setLastUpdatedGradeId(null); }, 3000); fetchGrades();
  };

  const handleDeleteGrade = async (gid: number | string) => {
    if (!supabase || !canManageGrades || !window.confirm('確定要刪除此成績嗎？')) return;
    const { error } = await supabase.from('grade_records').delete().eq('id', gid);
    if (!isMountedRef.current) return;
    if (error) { showToast(`刪除成績失敗：${error.message}`, 'error'); return; }
    showToast('成績已刪除。');
    if (grades.length === 1 && gradePage > 0) setGradePage((p) => p - 1); else fetchGrades();
  };

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault(); if (!supabase || !isAdmin) return;
    setIsInviting(true); setInviteError(''); setInviteSuccess('');
    const payload = { email: newInvite.email.trim(), full_name: newInvite.full_name.trim() || null, class_name: newInvite.class_name.trim() || null, student_no: newInvite.student_no.trim() || null };
    if (!payload.email) { setIsInviting(false); showToast('請輸入學生 Email。', 'error'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('invite-student', { body: payload });
      if (!isMountedRef.current) return;
      if (error) { const ctx = (error as any)?.context; let msg = (data as any)?.error || ''; if (!msg && ctx && typeof ctx.json === 'function') { const b = await ctx.json().catch(() => null); if (!isMountedRef.current) return; msg = b?.error || ''; } throw new Error(msg || error.message || '邀請發送失敗'); }
      setInviteSuccess((data as any)?.message || `邀請已發送：${payload.email}`); setNewInvite({ email: '', full_name: '', class_name: '', student_no: '' }); showToast('邀請發送成功！');
    } catch (err: any) { if (!isMountedRef.current) return; const msg = err?.message || '邀請失敗，請重試。'; setInviteError(msg); showToast(msg, 'error'); }
    finally { if (isMountedRef.current) setIsInviting(false); }
  };

  const closeGradeModal = () => { setIsGradeCreateOpen(false); setSelectedStudent(null); setNewGrade(EMPTY_GRADE); };

  const roleTitle = isAdmin ? '您好，校長' : isTeacher ? '您好，教師' : isStaff ? '您好，教職員' : '歡迎回來';

  if (isLoading) return (
    <section className={STYLES.wrapper} aria-label="載入中">
      <div className={STYLES.container}><div className="flex min-h-[50vh] items-center justify-center"><Loader2 size={32} className="animate-spin text-black" /></div></div>
    </section>
  );

  return (
    <section className={STYLES.wrapper} aria-label="儀表板">
      <div className={STYLES.container}>

        {/* Header */}
        <header className={STYLES.header}>
          <div className={STYLES.headerLeft}>
            <div className={STYLES.headerIcon}>{isAdmin ? <Key size={24} aria-hidden="true" /> : <Star size={24} aria-hidden="true" />}</div>
            <div>
              <h1 className={STYLES.title}>{roleTitle}</h1>
              <p className={STYLES.subtitle}>
                {isStudent && profile?.student_no && <span className="mr-2 font-mono text-[var(--brand-primary)]">{profile.student_no}</span>}
                {profile?.full_name ?? user?.email?.split('@')[0]}，目前身份：{getRoleLabel(role)}
              </p>
            </div>
          </div>
          <div className={STYLES.headerRight}>
            <div className="relative">
              <Bell size={20} className={hasUnread ? 'animate-bounce text-[var(--brand-primary)]' : 'text-black/20'} aria-hidden="true" />
              {hasUnread && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--color-badge)] border-2 border-white" />}
            </div>
            {isAdmin && <button onClick={() => navigate('/check-in')} className={STYLES.modeBtn}><Monitor size={14} aria-hidden="true" /> 打卡模式</button>}
            <button onClick={handleLogout} className={STYLES.logoutBtn} aria-label="登出">登出</button>
          </div>
        </header>

        {/* Bento */}
        <main className={`${STYLES.bentoContainer} mb-10 md:mb-12`}>

          {/* 公告 */}
          <section className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
            <div className={STYLES.bentoHeader}>
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}><Clock size={20} aria-hidden="true" /></div>
                <div className="flex items-center gap-2"><span className={STYLES.cardLabel}>公告</span>{hasUnread && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />}</div>
              </div>
              {isAdmin && <button onClick={() => setIsAnnounceCreateOpen(true)} className={STYLES.addBtn}><Plus size={12} aria-hidden="true" /> 發佈</button>}
            </div>
            <div className={STYLES.bentoScroll}>
              <AnimatePresence mode="wait">
                <motion.div key={announcePage} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.25 }}>
                  {announcements.length > 0 ? announcements.map((ann) => { const isRead = readIds.includes(ann.id); return (
                    <div key={ann.id} className={`${STYLES.announceItem} ${isRead ? 'opacity-60' : ''}`} onClick={() => handleOpenAnnouncement(ann)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); handleOpenAnnouncement(ann); } }} role="button" tabIndex={0}>
                      <div className="flex flex-col"><div className="flex items-center">{ann.priority && <span className={STYLES.priorityTag}>置頂</span>}<span className={STYLES.announceTitle}>{ann.title}</span></div><span className={STYLES.announceDate}>{formatDate(ann.created_at)}</span></div>
                      {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />}
                    </div>
                  ); }) : <div className={STYLES.emptyText}>目前沒有公告。</div>}
                </motion.div>
              </AnimatePresence>
            </div>
            {announcements.length > 0 && (
              <div className={STYLES.pagination}>
                <button disabled={announcePage === 0} onClick={() => setAnnouncePage((p) => p - 1)} className={STYLES.pageBtn}>上一頁</button>
                <span className="text-[10px] font-mono tracking-widest uppercase">{announcePage + 1} / {Math.max(1, Math.ceil(totalAnnounce / PER_PAGE_ANNOUNCE))}</span>
                <button disabled={(announcePage + 1) * PER_PAGE_ANNOUNCE >= totalAnnounce} onClick={() => setAnnouncePage((p) => p + 1)} className={STYLES.pageBtn}>下一頁</button>
              </div>
            )}
          </section>

          {/* 邀請學生 */}
          {isAdmin && (
            <section className={STYLES.bentoItem}>
              <div className={`${STYLES.itemHeader} mb-0`}><div className={STYLES.iconBox}><UserPlus size={20} aria-hidden="true" /></div><span className={STYLES.cardLabel}>邀請學生</span></div>
              <p className="my-4 text-xs leading-relaxed text-[var(--text-sub)] theme-transition">以 email、學生姓名、班級、學號邀請學生加入帳號。</p>
              <button onClick={() => { setIsInviteOpen(true); setInviteSuccess(''); setInviteError(''); }} className={STYLES.addBtn}><Plus size={12} aria-hidden="true" /> 發送邀請</button>
            </section>
          )}

          {/* 教職員打卡 */}
          {canUseStaffCheckIn && <section className={`${STYLES.bentoItem} justify-start p-4 md:p-4`}><StaffCheckIn onToast={showToast} /></section>}

          {/* 學生成績單 */}
          {isStudent && (
            <section className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
              <div className="flex justify-between items-start mb-6 w-full px-2"><div className={`${STYLES.itemHeader} mb-0`}><div className={STYLES.iconBox}><Award size={20} aria-hidden="true" /></div><span className={STYLES.cardLabel}>學期成績單</span></div></div>
              <div className="hidden px-4 py-2 bg-[var(--ui-bg)] border-y border-[var(--ui-border)] text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase md:grid md:grid-cols-4"><span>科目</span><span>學期</span><span>測驗日期</span><span className="text-right">分數</span></div>
              <div className="flex-1 overflow-y-auto pr-2 mt-2">
                <AnimatePresence mode="wait">
                  <motion.div key={gradePage} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.25 }}>
                    {grades.length > 0 ? grades.map((g) => (
                      <motion.div key={g.id} className="px-4 py-4 border-b border-[var(--ui-border)] last:border-0 transition-colors hover:bg-[var(--ui-bg)]/50" initial={lastUpdatedGradeId === g.id ? { backgroundColor: 'rgba(0,0,0,0.07)' } : false} animate={{ backgroundColor: 'transparent' }} transition={{ duration: 1.6 }}>
                        <div className="flex items-start justify-between gap-3 md:hidden"><span className={STYLES.gradeSubject}>{g.subject}</span><div className="text-right">{renderScore(Number(g.score || 0))}</div></div>
                        <div className="flex items-center gap-2 mt-2 md:hidden"><span className={STYLES.gradeMeta}>{g.term}</span><span className="text-[9px] text-[var(--text-sub)]">/</span><span className={STYLES.gradeMeta}>{formatDate(g.exam_date)}</span></div>
                        <div className={`hidden md:grid ${STYLES.gradeRow} md:grid-cols-4 md:border-0 md:px-0 md:py-0 md:hover:bg-transparent`}><span className={STYLES.gradeSubject}>{g.subject}</span><span className={STYLES.gradeMeta}>{g.term}</span><span className={STYLES.gradeMeta}>{formatDate(g.exam_date)}</span><div className="text-right">{renderScore(Number(g.score || 0))}</div></div>
                      </motion.div>
                    )) : <div className={STYLES.emptyText}>目前沒有成績資料。</div>}
                  </motion.div>
                </AnimatePresence>
              </div>
              {grades.length > 0 && (<div className={STYLES.pagination}><button disabled={gradePage === 0} onClick={() => setGradePage((p) => p - 1)} className={STYLES.pageBtn}>上一頁</button><span className="text-[10px] font-mono tracking-widest uppercase">{gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_STUDENT_GRADES))}</span><button disabled={(gradePage + 1) * PER_PAGE_STUDENT_GRADES >= totalGrades} onClick={() => setGradePage((p) => p + 1)} className={STYLES.pageBtn}>下一頁</button></div>)}
            </section>
          )}

          {/* GPA + 出勤 */}
          {isStudent && (<>
            <section className={STYLES.bentoItem}><div className={STYLES.itemHeader}><div className={STYLES.iconBox}><BookOpen size={20} aria-hidden="true" /></div><span className={STYLES.cardLabel}>平均積分 (GPA)</span></div><div><div className="text-5xl font-black text-[var(--brand-primary)] mb-2">{averageScore}</div><p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">全部記錄平均分數</p></div></section>
            <section className={STYLES.bentoItem}><div className={STYLES.itemHeader}><div className={STYLES.iconBox}><Clock size={20} aria-hidden="true" /></div><span className={STYLES.cardLabel}>今日出勤</span></div><div><div className="text-3xl font-black text-[var(--brand-primary)] mb-2">{hasCheckedInToday ? '已打卡' : '尚未打卡'}</div><p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">累計出勤天數：{attendanceCount}</p></div></section>
          </>)}
        </main>

        {/* 學生打卡橫幅 */}
        {isStudent && (
          <div className={STYLES.checkInWrapper}>
            <div className={STYLES.checkInCard}>
              <div className={STYLES.checkInInfo}><div className={STYLES.checkInBox}><div className={STYLES.checkInIcon}><Clock size={32} aria-hidden="true" /></div><div><span className="block mb-1 text-[10px] font-black tracking-[0.2em] text-black/40 uppercase">連續打卡</span><div className={STYLES.checkInCount}><span className="text-4xl font-black text-black">{attendanceCount}</span><span className="text-xs font-bold uppercase text-black/60">天</span></div></div></div><div className={STYLES.weeklyDots} aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <div key={i} className={`${STYLES.dot} ${i < weeklyProgress ? STYLES.dotActive : 'bg-transparent'}`} />)}</div></div>
              <p className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20">持續努力，穩定進步</p>
            </div>
          </div>
        )}

        {/* 成績管理表格 */}
        {canManageGrades && (
          <section className="mt-8 mb-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm theme-transition md:mt-10 md:mb-12">
            <div className="flex flex-col gap-4 p-8 border-b border-[var(--ui-border)] md:flex-row md:items-center md:justify-between md:p-10">
              <div className={`${STYLES.itemHeader} mb-0`}><div className={STYLES.iconBox}><Award size={20} aria-hidden="true" /></div><div><span className={STYLES.cardLabel}>成績管理</span><p className="mt-1 text-[10px] text-[var(--text-sub)]">共 {totalGrades} 筆，頁次 {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_MANAGE_GRADES))}</p></div></div>
              <button onClick={() => setIsGradeCreateOpen(true)} className={STYLES.addBtn}><Plus size={12} aria-hidden="true" /> 新增成績</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1020px]">
                <thead><tr className="bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">{['姓名','學號','班級','科目','學期','分數','測驗日期','操作'].map((h) => <th key={h} className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {grades.length > 0 ? grades.map((g) => (
                    <motion.tr key={g.id} className="transition-colors hover:bg-[var(--ui-bg)]/50" initial={lastUpdatedGradeId === g.id ? { backgroundColor: 'rgba(0,0,0,0.07)' } : false} animate={{ backgroundColor: 'transparent' }} transition={{ duration: 1.6 }}>
                      <td className="px-6 py-5 text-sm font-bold text-[var(--text-main)] whitespace-nowrap">{g.profile?.full_name ?? '--'}</td>
                      <td className="px-6 py-5 text-sm font-mono text-[var(--text-sub)] whitespace-nowrap">{g.profile?.student_no ?? g.student_id.slice(0, 8)}</td>
                      <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">{g.profile?.class_name ?? '--'}</td>
                      <td className="px-6 py-5 text-sm text-[var(--text-main)] whitespace-nowrap">{g.subject}</td>
                      <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">{g.term}</td>
                      <td className="px-6 py-5 text-right whitespace-nowrap">{renderScore(Number(g.score || 0))}</td>
                      <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">{formatDate(g.exam_date)}</td>
                      <td className="px-6 py-5"><div className="flex items-center justify-end gap-2"><button onClick={() => setEditingGrade({ ...g })} aria-label={`編輯 ${g.subject} 成績`} className="px-2 py-1 border border-black text-[9px] font-bold tracking-widest uppercase transition hover:bg-black hover:text-white"><Edit3 size={12} /></button><button onClick={() => handleDeleteGrade(g.id)} aria-label={`刪除 ${g.subject} 成績`} className="px-2 py-1 border border-[var(--score-fail)] text-[var(--score-fail)] text-[9px] font-bold tracking-widest uppercase transition hover:bg-[var(--score-fail)] hover:text-white"><Trash2 size={12} /></button></div></td>
                    </motion.tr>
                  )) : <tr><td colSpan={8} className={STYLES.emptyText}>目前沒有成績資料。</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-4 px-6 py-6 border-t border-[var(--ui-border)]">
              <button disabled={gradePage === 0} onClick={() => setGradePage((p) => p - 1)} className={STYLES.pageBtn}>上一頁</button>
              <span className="text-[10px] font-mono tracking-widest uppercase">{gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_MANAGE_GRADES))}</span>
              <button disabled={(gradePage + 1) * PER_PAGE_MANAGE_GRADES >= totalGrades} onClick={() => setGradePage((p) => p + 1)} className={STYLES.pageBtn}>下一頁</button>
            </div>
          </section>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}

      {/* [修正] 新增成績 Modal：StudentSearchSelect 取代 UUID 輸入框 */}
      {canManageGrades && isGradeCreateOpen && (
        <div className={STYLES.modalOverlay} onClick={closeGradeModal}>
          <div className={STYLES.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-black tracking-widest text-black">新增成績</span>
              <button onClick={closeGradeModal} aria-label="關閉" className="p-2 transition-transform duration-500 hover:rotate-90"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddGrade}>

              {/* 學生搜尋 */}
              <label className={STYLES.formLabel}>
                選取學生 *
                {selectedStudent && (
                  <span className="ml-2 normal-case font-normal tracking-normal text-[var(--hsinyu-blue)]">
                    ✓ {selectedStudent.full_name}{selectedStudent.student_no ? ` (${selectedStudent.student_no})` : ''}
                  </span>
                )}
              </label>
              <StudentSearchSelect
                value={selectedStudent}
                onChange={setSelectedStudent}
                disabled={isGradeSubmitting}
              />

              {/* 科目 */}
              <label className={STYLES.formLabel} htmlFor="g-subject">科目 *</label>
              <input id="g-subject" type="text" placeholder="數學" required className={STYLES.input} value={newGrade.subject} onChange={(e) => setNewGrade((p) => ({ ...p, subject: e.target.value }))} />

              {/* 學期 */}
              <label className={STYLES.formLabel} htmlFor="g-term">學期 *</label>
              <input id="g-term" type="text" placeholder="113-2" required className={STYLES.input} value={newGrade.term} onChange={(e) => setNewGrade((p) => ({ ...p, term: e.target.value }))} />

              {/* 分數 */}
              <label className={STYLES.formLabel} htmlFor="g-score">分數 (0–100) *</label>
              <input id="g-score" type="number" placeholder="85" required min="0" max="100" className={STYLES.input} value={newGrade.score} onChange={(e) => setNewGrade((p) => ({ ...p, score: e.target.value }))} />

              {/* 測驗日期 */}
              <label className={STYLES.formLabel} htmlFor="g-date">測驗日期</label>
              <input id="g-date" type="date" className={STYLES.input} value={newGrade.exam_date} onChange={(e) => setNewGrade((p) => ({ ...p, exam_date: e.target.value }))} />

              {/* [防呆] 未選取學生時按鈕 disabled */}
              <button type="submit" disabled={isGradeSubmitting || !selectedStudent} className={STYLES.submitBtn}>
                <Send size={14} aria-hidden="true" />{isGradeSubmitting ? '送出中...' : '確認新增'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 編輯成績 Modal */}
      {editingGrade && (
        <div className={STYLES.modalOverlay} onClick={() => setEditingGrade(null)}>
          <div className={STYLES.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10"><span className="text-xl font-black tracking-widest text-black">編輯成績</span><button onClick={() => setEditingGrade(null)} aria-label="關閉" className="p-2 transition-transform duration-500 hover:rotate-90"><X size={20} /></button></div>
            <form onSubmit={handleUpdateGrade}>
              {[{ id: 'e-subject', label: '科目 *', key: 'subject', type: 'text' }, { id: 'e-term', label: '學期 *', key: 'term', type: 'text' }, { id: 'e-score', label: '分數 (0-100) *', key: 'score', type: 'number' }, { id: 'e-date', label: '測驗日期', key: 'exam_date', type: 'date' }].map((f) => (
                <div key={f.id}><label className={STYLES.formLabel} htmlFor={f.id}>{f.label}</label><input id={f.id} type={f.type} required={f.label.includes('*')} min={f.type === 'number' ? '0' : undefined} max={f.type === 'number' ? '100' : undefined} className={STYLES.input} value={(editingGrade as any)[f.key] ?? ''} onChange={(e) => setEditingGrade((prev) => prev ? { ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value } : prev)} /></div>
              ))}
              <button type="submit" disabled={isGradeSubmitting} className={STYLES.submitBtn}><Send size={14} aria-hidden="true" />{isGradeSubmitting ? '儲存中...' : '儲存修改'}</button>
            </form>
          </div>
        </div>
      )}

      {/* 查看公告 */}
      {viewingAnnounce && (
        <div className={STYLES.modalOverlay} onClick={() => setViewingAnnounce(null)}>
          <div className={`${STYLES.modalContent} max-w-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-start mb-10"><div><span className={STYLES.cardLabel}>{formatDate(viewingAnnounce.created_at)}</span><h2 className="mt-2 text-2xl font-black uppercase tracking-tight">{viewingAnnounce.title}</h2></div><button onClick={() => setViewingAnnounce(null)} aria-label="關閉公告" className="p-2 transition-transform duration-500 hover:rotate-90"><X size={24} /></button></div>
            <div className="flex-1 max-h-[50vh] overflow-y-auto pr-2"><p className="whitespace-pre-wrap text-base font-light leading-relaxed text-neutral-600">{viewingAnnounce.content}</p></div>
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-black/5">
              {isAdmin && <button onClick={() => handleDeleteAnnouncement(viewingAnnounce.id)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--score-fail)] transition-colors hover:bg-[var(--score-fail-bg)]">刪除</button>}
              <button onClick={() => setViewingAnnounce(null)} className="ml-auto px-8 py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase">關閉</button>
            </div>
          </div>
        </div>
      )}

      {/* 發佈公告 */}
      {isAdmin && isAnnounceCreateOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsAnnounceCreateOpen(false)}>
          <div className={STYLES.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10"><span className="text-xl font-black tracking-widest text-black">發佈公告</span><button onClick={() => setIsAnnounceCreateOpen(false)} aria-label="關閉" className="p-2 transition-transform duration-500 hover:rotate-90"><X size={20} /></button></div>
            <form onSubmit={handleAddAnnouncement}>
              <label className={STYLES.formLabel} htmlFor="a-title">公告標題 *</label><input id="a-title" type="text" required className={STYLES.input} value={newAnnounce.title} onChange={(e) => setNewAnnounce((p) => ({ ...p, title: e.target.value }))} />
              <label className={STYLES.formLabel} htmlFor="a-content">公告內容 *</label><textarea id="a-content" required rows={5} className={`${STYLES.input} min-h-[120px] resize-none`} value={newAnnounce.content} onChange={(e) => setNewAnnounce((p) => ({ ...p, content: e.target.value }))} />
              <div className="flex items-center gap-3 mb-8"><input id="a-priority" type="checkbox" className="w-4 h-4 accent-black" checked={newAnnounce.priority} onChange={(e) => setNewAnnounce((p) => ({ ...p, priority: e.target.checked }))} /><label htmlFor="a-priority" className="cursor-pointer text-[10px] font-bold tracking-widest uppercase">置頂公告</label></div>
              <button type="submit" className={STYLES.submitBtn}><Send size={14} aria-hidden="true" /> 確認發佈</button>
            </form>
          </div>
        </div>
      )}

      {/* 邀請學生 */}
      {isAdmin && isInviteOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsInviteOpen(false)}>
          <div className={STYLES.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10"><span className="text-xl font-black tracking-widest text-black">邀請學生</span><button onClick={() => setIsInviteOpen(false)} aria-label="關閉" className="p-2 transition-transform duration-500 hover:rotate-90"><X size={20} /></button></div>
            {inviteSuccess && <div className={STYLES.successBox}>{inviteSuccess}</div>}
            {inviteError   && <div className={STYLES.errorBox}>{inviteError}</div>}
            <form onSubmit={handleInviteStudent}>
              <label className={STYLES.formLabel} htmlFor="i-email">學生 Email *</label><input id="i-email" type="email" required className={STYLES.input} value={newInvite.email} onChange={(e) => setNewInvite((p) => ({ ...p, email: e.target.value }))} />
              <label className={STYLES.formLabel} htmlFor="i-name">學生姓名</label><input id="i-name" type="text" className={STYLES.input} value={newInvite.full_name} onChange={(e) => setNewInvite((p) => ({ ...p, full_name: e.target.value }))} />
              <div className="grid grid-cols-2 gap-4">
                <div><label className={STYLES.formLabel} htmlFor="i-class">班級</label><input id="i-class" type="text" className={STYLES.input} value={newInvite.class_name} onChange={(e) => setNewInvite((p) => ({ ...p, class_name: e.target.value }))} /></div>
                <div><label className={STYLES.formLabel} htmlFor="i-no">學號</label><input id="i-no" type="text" className={STYLES.input} value={newInvite.student_no} onChange={(e) => setNewInvite((p) => ({ ...p, student_no: e.target.value }))} /></div>
              </div>
              <button type="submit" disabled={isInviting} className={STYLES.submitBtn}>{isInviting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}{isInviting ? '發送中...' : '發送邀請信'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed bottom-10 left-1/2 z-[500] -translate-x-1/2">
            <div className={`flex items-center gap-4 px-8 py-4 border border-black shadow-2xl ${toast.type === 'success' ? 'bg-black text-white' : 'bg-[var(--score-fail)] text-white'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
