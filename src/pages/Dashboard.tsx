import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LAYOUT } from '../styles/layout';
import {
  AlertCircle,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Key,
  Loader2,
  Monitor,
  Plus,
  Send,
  Star,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { StaffCheckIn } from '../components/sections/StaffCheckIn';

type UserRole = 'admin' | 'teacher' | 'staff' | 'student';
type ToastType = 'success' | 'error';

interface Profile {
  id: string;
  email: string;
  role: UserRole;
  status: 'invited' | 'active' | 'suspended' | 'archived';
  student_no: string | null;
  full_name: string | null;
  class_name: string | null;
}

interface GradeProfile {
  full_name: string | null;
  student_no: string | null;
  class_name: string | null;
}

interface GradeRecord {
  id: number | string;
  student_id: string;
  subject: string;
  term: string;
  score: number;
  exam_date: string | null;
  graded_at: string;
  created_by: string;
  profile?: GradeProfile;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: boolean;
  created_at: string;
}

interface GradeFormState {
  target_student_id: string;
  subject: string;
  term: string;
  score: string;
  exam_date: string;
}

interface ToastState {
  message: string;
  type: ToastType;
}

const STYLES = {
  ...LAYOUT,
  wrapper:
    'flex flex-col w-full px-1 py-10 bg-[var(--ui-bg)] theme-transition md:px-6 md:pt-12 md:pb-8',
  container: LAYOUT.container,
  header:
    'flex justify-between items-end mb-8 border-b border-[var(--ui-border)] pb-6 theme-transition md:mb-12',
  title:
    'text-3xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition md:text-4xl',
  subtitle: 'mt-2 text-sm font-light text-[var(--text-sub)] md:text-lg',
  logoutBtn:
    'px-4 py-2 bg-[var(--ui-border)] text-[var(--text-main)] text-[10px] font-bold tracking-widest rounded-lg transition-all duration-300 hover:bg-[var(--brand-primary)] hover:text-white md:px-6 md:py-2',

  bentoContainer:
    'grid grid-cols-1 gap-4 auto-rows-auto md:grid-cols-3 md:gap-6 md:auto-rows-[200px]',
  bentoItem:
    'flex flex-col justify-between min-h-[160px] p-6 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm overflow-hidden theme-transition hover:shadow-lg duration-500 md:min-h-0 md:p-8',
  bentoLarge: 'md:col-span-2 md:row-span-2 h-full',

  itemHeader: 'flex items-center gap-3 mb-4',
  iconBox: 'p-2 rounded-lg bg-[var(--ui-border)] text-[var(--brand-primary)]',
  cardLabel:
    'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase',

  gradeRow:
    'grid items-center px-4 py-5 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/50 transition-colors gap-y-3 md:gap-y-0',
  gradeSubject: 'font-bold text-[var(--text-main)]',
  gradeMeta:
    'text-[10px] text-[var(--text-sub)] uppercase tracking-tighter whitespace-nowrap',
  gradeScore: 'font-mono text-xl font-black transition-all duration-300',

  announceItem:
    'group flex justify-between items-center px-2 py-4 border-b border-[var(--ui-border)] last:border-0 cursor-pointer hover:bg-[var(--ui-bg)]/30 transition-all',
  announceTitle:
    'text-sm font-bold text-[var(--text-main)] group-hover:translate-x-1 transition-transform',
  announceDate: 'text-[9px] font-mono text-[var(--text-sub)] uppercase',
  priorityTag:
    'inline-block px-2 py-0.5 mr-2 bg-black text-white text-[8px] font-bold tracking-widest uppercase',

  modalOverlay:
    'fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm',
  modalContent:
    'relative flex flex-col w-full max-w-md overflow-hidden bg-[var(--ui-bg)] border border-black p-8 shadow-2xl theme-transition',
  modalLine: 'absolute top-0 left-0 w-full h-[1px] bg-black',
  formLabel:
    'block mb-2 text-[10px] font-bold tracking-[0.2em] text-[var(--text-sub)] uppercase',
  input:
    'w-full px-4 py-3 mb-6 bg-transparent border border-[var(--ui-border)] text-sm text-[var(--text-main)] outline-none transition-colors focus:border-black theme-transition',
  submitBtn:
    'flex items-center justify-center gap-3 w-full py-4 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-neutral-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
  addBtn:
    'flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300',

  pageBtn:
    'px-3 py-1 border border-[var(--ui-border)] text-[9px] font-bold transition-all hover:bg-black hover:text-white disabled:opacity-30 disabled:cursor-not-allowed',
  emptyText: 'py-12 text-center text-[var(--text-sub)] italic font-light',

  successBox:
    'mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 text-center',
  errorBox:
    'mb-4 px-4 py-3 bg-red-50 border border-red-200 text-xs text-red-600 text-center',
} as const;

const PER_PAGE_ANNOUNCE = 10;
const PER_PAGE_MANAGE_GRADES = 10;
const PER_PAGE_STUDENT_GRADES = 5;

const EMPTY_NEW_GRADE: GradeFormState = {
  target_student_id: '',
  subject: '',
  term: '113-2',
  score: '',
  exam_date: '',
};

// 角色中文標籤
const getRoleLabel = (role?: UserRole) => {
  if (role === 'admin') return '校長';
  if (role === 'teacher') return '教師';
  if (role === 'staff') return '教職員';
  return '學生';
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '--';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

const renderScore = (score: number) => {
  if (score === 100) {
    return (
      <span className={`${STYLES.gradeScore} flex items-center gap-2 text-[#D4AF37]`}>
        <Trophy size={16} aria-hidden="true" /> {score}
      </span>
    );
  }
  if (score >= 90) return <span className={`${STYLES.gradeScore} text-black`}>{score}</span>;
  if (score < 60) {
    return (
      <span className={`${STYLES.gradeScore} flex items-center gap-1 text-[#E11D48]`}>
        <AlertCircle size={14} aria-hidden="true" /> {score}
      </span>
    );
  }
  if (score <= 70) return <span className={`${STYLES.gradeScore} text-neutral-400`}>{score}</span>;
  return <span className={`${STYLES.gradeScore} text-[var(--brand-primary)]`}>{score}</span>;
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [allScores, setAllScores] = useState<number[]>([]); // 全部成績，用於計算總平均
  const [gradePage, setGradePage] = useState(0);
  const [totalGrades, setTotalGrades] = useState(0);
  const [lastUpdatedGradeId, setLastUpdatedGradeId] = useState<number | string | null>(null);
  const [isGradeCreateOpen, setIsGradeCreateOpen] = useState(false);
  const [isGradeSubmitting, setIsGradeSubmitting] = useState(false);
  const [newGrade, setNewGrade] = useState<GradeFormState>(EMPTY_NEW_GRADE);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);

  const [attendanceCount, setAttendanceCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcePage, setAnnouncePage] = useState(0);
  const [totalAnnounce, setTotalAnnounce] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [viewingAnnounce, setViewingAnnounce] = useState<Announcement | null>(null);
  const [isAnnounceCreateOpen, setIsAnnounceCreateOpen] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({ title: '', content: '', priority: false });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [newInvite, setNewInvite] = useState({
    email: '',
    full_name: '',
    class_name: '',
    student_no: '',
  });

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const role = profile?.role;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStaff = role === 'staff';
  const isStudent = role === 'student';
  const canManageGrades = isAdmin || isTeacher;
  const canUseStaffCheckIn = isTeacher || isStaff;
  const gradePerPage = isStudent ? PER_PAGE_STUDENT_GRADES : PER_PAGE_MANAGE_GRADES;

  const averageScore = useMemo(() => {
    if (allScores.length === 0) return '0';
    const avg = allScores.reduce((sum, s) => sum + s, 0) / allScores.length;
    return avg.toFixed(1);
  }, [allScores]);

  const hasUnread = useMemo(
    () => announcements.some((item) => !readIds.includes(item.id)),
    [announcements, readIds],
  );

  const weeklyProgress = useMemo(() => {
    if (attendanceCount <= 0) return 0;
    return attendanceCount % 7 || 7;
  }, [attendanceCount]);

  // ------ 中文提示訊息 -------
  const showToast = (messageZh: string, type: ToastType = 'success') => {
    setToast({ message: messageZh, type });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2800);
  };
  // -------------------------

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    const from = announcePage * PER_PAGE_ANNOUNCE;
    const to = from + PER_PAGE_ANNOUNCE - 1;
    const { data, error, count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact' })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) {
      showToast(`載入公告失敗：${error.message}`, 'error');
      return;
    }
    setAnnouncements((data ?? []) as Announcement[]);
    setTotalAnnounce(count ?? 0);
  };

  const fetchGrades = async (studentId?: string) => {
    if (!supabase) return;
    const from = gradePage * gradePerPage;
    const to = from + gradePerPage - 1;

    let query = supabase
      .from('grade_records')
      .select('id, student_id, subject, term, score, exam_date, graded_at, created_by', {
        count: 'exact',
      });
    if (studentId) query = query.eq('student_id', studentId);

    const { data, error, count } = await query.order('graded_at', { ascending: false }).range(from, to);
    if (error) {
      showToast(`載入成績失敗：${error.message}`, 'error');
      return;
    }

    let rows = (data ?? []) as GradeRecord[];
    if (canManageGrades && rows.length > 0) {
      const studentIds = [...new Set(rows.map((grade) => grade.student_id).filter(Boolean))];
      if (studentIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, student_no, class_name')
          .in('id', studentIds);

        if (!profileError && profileRows) {
          const map = new Map<string, GradeProfile>();
          (profileRows as any[]).forEach((row) => {
            map.set(row.id, {
              full_name: row.full_name ?? null,
              student_no: row.student_no ?? null,
              class_name: row.class_name ?? null,
            });
          });
          rows = rows.map((grade) => ({ ...grade, profile: map.get(grade.student_id) }));
        }
      }
    }

    setGrades(rows);
    setTotalGrades(count ?? 0);
  };

  // 只撈全部 score，不分頁，專門用於計算學生的總體平均分數
  const fetchAllStudentScores = async (studentId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('grade_records')
      .select('score')
      .eq('student_id', studentId);
    if (!error && data) {
      setAllScores(data.map((r: { score: number }) => Number(r.score)));
    }
  };

  // 修正 fetchStudentAttendance 中的日期範圍判定
  const fetchStudentAttendance = async (studentId: string) => {
    if (!supabase) return;
    const { count, error } = await supabase
      .from('attendance_logs')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('check_type', 'in');
    if (!error) setAttendanceCount(count ?? 0);

    const now = new Date();
    // 轉換為台北/北京時間的日期字串 (YYYY-MM-DD)
    const localDate = new Intl.DateTimeFormat('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now).replace(/\//g, '-');
    const dayStart = `${localDate}T00:00:00+08:00`;
    const dayEnd = `${localDate}T23:59:59+08:00`;

    const { data: todayLogs } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('student_id', studentId)
      .eq('check_type', 'in')
      .gte('checked_at', dayStart)
      .lte('checked_at', dayEnd)
      .limit(1);
    setHasCheckedInToday((todayLogs?.length ?? 0) > 0);
  };

  useEffect(() => {
    const stored = localStorage.getItem('readAnnouncements');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setReadIds(parsed.filter((value) => typeof value === 'string'));
    } catch {
      localStorage.removeItem('readAnnouncements');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, role, status, student_no, full_name, class_name')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profileData) {
        await supabase.auth.signOut();
        navigate('/login?error=no_profile');
        return;
      }
      if (profileData.status !== 'active') {
        await supabase.auth.signOut();
        navigate(`/login?error=${profileData.status}`);
        return;
      }

      setUser({ id: currentUser.id, email: currentUser.email ?? '' });
      setProfile(profileData as Profile);
      setIsLoading(false);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    if (isLoading || !user) return;
    fetchAnnouncements();
  }, [isLoading, user, announcePage]);

  useEffect(() => {
    if (isLoading || !user || !profile) return;
    if (canManageGrades) {
      fetchGrades();
      return;
    }
    if (isStudent) {
      fetchGrades(user.id);
      return;
    }
    setGrades([]);
    setTotalGrades(0);
  }, [isLoading, user, profile, canManageGrades, isStudent, gradePage]);

  useEffect(() => {
    if (isLoading || !user || !isStudent) return;
    fetchStudentAttendance(user.id);
    fetchAllStudentScores(user.id); // 撈全部成績以計算正確總平均
  }, [isLoading, user, isStudent]);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    navigate('/login');
  };

  const handleOpenAnnouncement = (announcement: Announcement) => {
    setViewingAnnounce(announcement);
    if (readIds.includes(announcement.id)) return;
    const nextReadIds = [...readIds, announcement.id];
    setReadIds(nextReadIds);
    localStorage.setItem('readAnnouncements', JSON.stringify(nextReadIds));
  };

  const handleAddAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !isAdmin) return;
    const title = newAnnounce.title.trim();
    const content = newAnnounce.content.trim();
    if (!title || !content) {
      showToast('請填寫公告標題與內容。', 'error');
      return;
    }

    const { error } = await supabase.from('announcements').insert([
      { title, content, priority: newAnnounce.priority },
    ]);
    if (error) {
      showToast(`發佈公告失敗：${error.message}`, 'error');
      return;
    }

    setIsAnnounceCreateOpen(false);
    setNewAnnounce({ title: '', content: '', priority: false });
    showToast('公告已發佈！');
    if (announcePage !== 0) setAnnouncePage(0);
    else fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!supabase || !isAdmin) return;
    if (!window.confirm('確定要刪除此公告嗎？')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      showToast(`刪除公告失敗：${error.message}`, 'error');
      return;
    }

    showToast('公告已刪除。');
    setViewingAnnounce(null);
    if (announcements.length === 1 && announcePage > 0) setAnnouncePage((prev) => prev - 1);
    else fetchAnnouncements();
  };

  const handleAddGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !user || !canManageGrades) return;

    const subject = newGrade.subject.trim();
    const studentId = newGrade.target_student_id.trim();
    const term = newGrade.term.trim() || '113-2';
    const score = Number(newGrade.score);
    if (!studentId || !subject || Number.isNaN(score)) {
      showToast('請完整輸入成績資料。', 'error');
      return;
    }

    setIsGradeSubmitting(true);
    const { data, error } = await supabase
      .from('grade_records')
      .insert([
        {
          student_id: studentId,
          subject,
          term,
          score,
          exam_date: newGrade.exam_date || null,
          created_by: user.id,
        },
      ])
      .select('id')
      .single();
    setIsGradeSubmitting(false);

    if (error) {
      showToast(`新增成績失敗：${error.message}`, 'error');
      return;
    }

    setIsGradeCreateOpen(false);
    setNewGrade(EMPTY_NEW_GRADE);
    setLastUpdatedGradeId((data as any)?.id ?? null);
    showToast('成績新增成功！');
    window.setTimeout(() => setLastUpdatedGradeId(null), 3000);
    if (gradePage !== 0) setGradePage(0);
    else fetchGrades();
  };

  const openEditGrade = (grade: GradeRecord) => setEditingGrade({ ...grade });

  const handleUpdateGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !editingGrade || !canManageGrades) return;
    const subject = editingGrade.subject.trim();
    const term = editingGrade.term.trim();
    const score = Number(editingGrade.score);
    if (!subject || !term || Number.isNaN(score)) {
      showToast('請完整輸入成績資料。', 'error');
      return;
    }

    setIsGradeSubmitting(true);
    const { error } = await supabase
      .from('grade_records')
      .update({
        subject,
        term,
        score,
        exam_date: editingGrade.exam_date || null,
      })
      .eq('id', editingGrade.id);
    setIsGradeSubmitting(false);

    if (error) {
      showToast(`更新成績失敗：${error.message}`, 'error');
      return;
    }

    setLastUpdatedGradeId(editingGrade.id);
    setEditingGrade(null);
    showToast('成績已更新！');
    window.setTimeout(() => setLastUpdatedGradeId(null), 3000);
    fetchGrades();
  };

  const handleDeleteGrade = async (gradeId: number | string) => {
    if (!supabase || !canManageGrades) return;
    if (!window.confirm('確定要刪除此成績嗎？')) return;
    const { error } = await supabase.from('grade_records').delete().eq('id', gradeId);
    if (error) {
      showToast(`刪除成績失敗：${error.message}`, 'error');
      return;
    }
    showToast('成績已刪除。');
    if (grades.length === 1 && gradePage > 0) setGradePage((prev) => prev - 1);
    else fetchGrades();
  };

  const handleInviteStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !isAdmin) return;

    setIsInviting(true);
    setInviteError('');
    setInviteSuccess('');

    const payload = {
      email: newInvite.email.trim(),
      full_name: newInvite.full_name.trim() || null,
      class_name: newInvite.class_name.trim() || null,
      student_no: newInvite.student_no.trim() || null,
    };

    if (!payload.email) {
      setIsInviting(false);
      showToast('請輸入學生 Email。', 'error');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-student', { body: payload });
      if (error) {
        const context = (error as any)?.context;
        let detailMessage = (data as any)?.error || '';
        if (!detailMessage && context && typeof context.json === 'function') {
          const detailBody = await context.json().catch(() => null);
          detailMessage = detailBody?.error || '';
        }
        throw new Error(detailMessage || error.message || '邀請發送失敗');
      }

      const successMessage = (data as any)?.message || `邀請已發送：${payload.email}`;
      setInviteSuccess(successMessage);
      setNewInvite({ email: '', full_name: '', class_name: '', student_no: '' });
      showToast('邀請發送成功！');
    } catch (error: any) {
      const message = error?.message || '邀請失敗，請重試。';
      setInviteError(message);
      showToast(message, 'error');
    } finally {
      setIsInviting(false);
    }
  };

  // 角色歡迎標題（繁體中文）
  const roleTitle = isAdmin
    ? '您好，校長'
    : isTeacher
      ? '您好，教師'
      : isStaff
        ? '您好，教職員'
        : '歡迎回來';

  if (isLoading) {
    return (
      <section className={STYLES.wrapper} aria-label="儀表板">
        <div className={STYLES.container}>
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 size={32} className="animate-spin text-black" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={STYLES.wrapper} aria-label="儀表板">
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-white rounded-2xl shadow-lg">
              {isAdmin ? <Key size={24} aria-hidden="true" /> : <Star size={24} aria-hidden="true" />}
            </div>
            <div>
              <h1 className={STYLES.title}>{roleTitle}</h1>
              <p className={STYLES.subtitle}>
                {isStudent && profile?.student_no && (
                  <span className="mr-2 font-mono text-[var(--brand-primary)]">{profile.student_no}</span>
                )}
                {profile?.full_name ?? user?.email?.split('@')[0]}，目前身份：{getRoleLabel(role)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell
                size={20}
                className={hasUnread ? 'animate-bounce text-[var(--brand-primary)]' : 'text-black/20'}
                aria-hidden="true"
              />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48] border-2 border-white" />
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => navigate('/check-in')}
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-black tracking-widest uppercase hover:bg-black hover:text-white transition-all"
              >
                <Monitor size={14} />
                打卡模式
              </button>
            )}

            <button onClick={handleLogout} className={STYLES.logoutBtn} aria-label="登出">
              登出
            </button>
          </div>
        </header>

        <main className={`${STYLES.bentoContainer} mb-10 md:mb-12`}>
          <section className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
            <div className="flex justify-between items-start mb-6 w-full">
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}>
                  <Clock size={20} aria-hidden="true" />
                </div>
                <div className="flex items-center gap-2">
                  <span className={STYLES.cardLabel}>公告</span>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />}
                </div>
              </div>

              {isAdmin && (
                <button onClick={() => setIsAnnounceCreateOpen(true)} className={STYLES.addBtn}>
                  <Plus size={12} aria-hidden="true" /> 發佈
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={announcePage}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {announcements.length > 0 ? (
                    <>
                      {announcements.map((announcement) => {
                        const isRead = readIds.includes(announcement.id);
                        return (
                          <div
                            key={announcement.id}
                            className={`${STYLES.announceItem} ${isRead ? 'opacity-60' : ''}`}
                            onClick={() => handleOpenAnnouncement(announcement)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleOpenAnnouncement(announcement);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center">
                                {announcement.priority && <span className={STYLES.priorityTag}>置頂</span>}
                                <span className={STYLES.announceTitle}>{announcement.title}</span>
                              </div>
                              <span className={STYLES.announceDate}>{formatDate(announcement.created_at)}</span>
                            </div>
                            {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />}
                          </div>
                        );
                      })}

                      <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-[var(--ui-border)]">
                        <button
                          disabled={announcePage === 0}
                          onClick={() => setAnnouncePage((prev) => prev - 1)}
                          className={STYLES.pageBtn}
                        >
                          上一頁
                        </button>
                        <span className="text-[10px] font-mono tracking-widest uppercase">
                          {announcePage + 1} / {Math.max(1, Math.ceil(totalAnnounce / PER_PAGE_ANNOUNCE))}
                        </span>
                        <button
                          disabled={(announcePage + 1) * PER_PAGE_ANNOUNCE >= totalAnnounce}
                          onClick={() => setAnnouncePage((prev) => prev + 1)}
                          className={STYLES.pageBtn}
                        >
                          下一頁
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={STYLES.emptyText}>目前沒有公告。</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {isAdmin && (
            <section className={STYLES.bentoItem}>
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}>
                  <UserPlus size={20} aria-hidden="true" />
                </div>
                <span className={STYLES.cardLabel}>邀請學生</span>
              </div>
              <p className="my-4 text-xs leading-relaxed text-[var(--text-sub)] theme-transition">
                以 email、學生姓名、班級、學號邀請學生加入帳號。
              </p>
              <button
                onClick={() => {
                  setIsInviteOpen(true);
                  setInviteSuccess('');
                  setInviteError('');
                }}
                className={STYLES.addBtn}
              >
                <Plus size={12} aria-hidden="true" /> 發送邀請
              </button>
            </section>
          )}

          {canUseStaffCheckIn && (
            <section className={`${STYLES.bentoItem} p-4 md:p-4 justify-start`}>
              <StaffCheckIn onToast={showToast} />
            </section>
          )}

          {isStudent && (
            <section className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
              <div className="flex justify-between items-start mb-6 w-full px-2">
                <div className={`${STYLES.itemHeader} mb-0`}>
                  <div className={STYLES.iconBox}>
                    <Award size={20} aria-hidden="true" />
                  </div>
                  <span className={STYLES.cardLabel}>學期成績單</span>
                </div>
              </div>

              <div className="hidden md:grid md:grid-cols-4 px-4 py-2 bg-[var(--ui-bg)] border-y border-[var(--ui-border)] text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase">
                <span>科目</span>
                <span>學期</span>
                <span>測驗日期</span>
                <span className="text-right">分數</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 mt-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={gradePage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.25 }}
                  >
                    {grades.length > 0 ? (
                      <>
                        {grades.map((grade) => (
                          <motion.div
                            key={grade.id}
                            className="px-4 py-4 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/50 transition-colors"
                            initial={lastUpdatedGradeId === grade.id ? { backgroundColor: 'rgba(0,0,0,0.07)' } : false}
                            animate={{ backgroundColor: 'transparent' }}
                            transition={{ duration: 1.6 }}
                          >
                            <div className="flex items-start justify-between gap-3 md:hidden">
                              <span className={STYLES.gradeSubject}>{grade.subject}</span>
                              <div className="text-right">{renderScore(Number(grade.score || 0))}</div>
                            </div>
                            <div className="mt-2 flex items-center gap-2 md:hidden">
                              <span className={STYLES.gradeMeta}>{grade.term}</span>
                              <span className="text-[9px] text-[var(--text-sub)]">/</span>
                              <span className={STYLES.gradeMeta}>{formatDate(grade.exam_date)}</span>
                            </div>

                            <div className={`hidden md:grid ${STYLES.gradeRow} md:grid-cols-4 md:px-0 md:py-0 md:border-0 md:hover:bg-transparent`}>
                              <span className={STYLES.gradeSubject}>{grade.subject}</span>
                              <span className={STYLES.gradeMeta}>{grade.term}</span>
                              <span className={STYLES.gradeMeta}>{formatDate(grade.exam_date)}</span>
                              <div className="text-right">{renderScore(Number(grade.score || 0))}</div>
                            </div>
                          </motion.div>
                        ))}
                      </>
                    ) : (
                      <div className={STYLES.emptyText}>目前沒有成績資料。</div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {grades.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-[var(--ui-border)]">
                  <button
                    disabled={gradePage === 0}
                    onClick={() => setGradePage((prev) => prev - 1)}
                    className={STYLES.pageBtn}
                  >
                    上一頁
                  </button>
                  <span className="text-[10px] font-mono tracking-widest uppercase">
                    {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_STUDENT_GRADES))}
                  </span>
                  <button
                    disabled={(gradePage + 1) * PER_PAGE_STUDENT_GRADES >= totalGrades}
                    onClick={() => setGradePage((prev) => prev + 1)}
                    className={STYLES.pageBtn}
                  >
                    下一頁
                  </button>
                </div>
              )}
            </section>
          )}

          {isStudent && (
            <>
              <section className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}>
                    <BookOpen size={20} aria-hidden="true" />
                  </div>
                  <span className={STYLES.cardLabel}>平均積分 (GPA)</span>
                </div>
                <div>
                  <div className="text-5xl font-black text-[var(--brand-primary)] mb-2">{averageScore}</div>
                  <p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">
                    全部記錄平均分數
                  </p>
                </div>
              </section>

              <section className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}>
                    <Clock size={20} aria-hidden="true" />
                  </div>
                  <span className={STYLES.cardLabel}>今日出勤</span>
                </div>
                <div>
                  <div className="text-3xl font-black text-[var(--brand-primary)] mb-2">
                    {hasCheckedInToday ? '已打卡' : '尚未打卡'}
                  </div>
                  <p className="text-xs font-light tracking-widest uppercase text-[var(--text-sub)]">
                    累計出勤天數：{attendanceCount}
                  </p>
                </div>
              </section>
            </>
          )}
        </main>

        {canManageGrades && (
          <section className="mt-8 mb-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm theme-transition md:mt-10 md:mb-12">
            <div className="flex flex-col gap-4 p-8 border-b border-[var(--ui-border)] md:flex-row md:items-center md:justify-between md:p-10">
              <div className={`${STYLES.itemHeader} mb-0`}>
                <div className={STYLES.iconBox}>
                  <Award size={20} aria-hidden="true" />
                </div>
                <div>
                  <span className={STYLES.cardLabel}>成績管理</span>
                  <p className="mt-1 text-[10px] text-[var(--text-sub)]">
                    共 {totalGrades} 筆，頁次 {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_MANAGE_GRADES))}
                  </p>
                </div>
              </div>

              <button onClick={() => setIsGradeCreateOpen(true)} className={STYLES.addBtn}>
                <Plus size={12} aria-hidden="true" /> 新增成績
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1020px]">
                <thead>
                  <tr className="bg-[var(--ui-bg)] border-b border-[var(--ui-border)]">
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">姓名</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">學號</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">班級</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">科目</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">學期</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">分數</th>
                    <th className="px-6 py-4 text-left text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">測驗日期</th>
                    <th className="px-6 py-4 text-right text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ui-border)]">
                  {grades.length > 0 ? (
                    grades.map((grade) => (
                      <motion.tr
                        key={grade.id}
                        className="hover:bg-[var(--ui-bg)]/50 transition-colors"
                        initial={lastUpdatedGradeId === grade.id ? { backgroundColor: 'rgba(0,0,0,0.07)' } : false}
                        animate={{ backgroundColor: 'transparent' }}
                        transition={{ duration: 1.6 }}
                      >
                        <td className="px-6 py-5 text-sm font-bold text-[var(--text-main)] whitespace-nowrap">
                          {grade.profile?.full_name ?? '--'}
                        </td>
                        <td className="px-6 py-5 text-sm font-mono text-[var(--text-sub)] whitespace-nowrap">
                          {grade.profile?.student_no ?? grade.student_id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">
                          {grade.profile?.class_name ?? '--'}
                        </td>
                        <td className="px-6 py-5 text-sm text-[var(--text-main)] whitespace-nowrap">{grade.subject}</td>
                        <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">{grade.term}</td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">{renderScore(Number(grade.score || 0))}</td>
                        <td className="px-6 py-5 text-sm text-[var(--text-sub)] whitespace-nowrap">{formatDate(grade.exam_date)}</td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditGrade(grade)}
                              className="px-2 py-1 border border-black text-[9px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteGrade(grade.id)}
                              className="px-2 py-1 border border-red-500 text-red-500 text-[9px] font-bold tracking-widest uppercase hover:bg-red-500 hover:text-white transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className={STYLES.emptyText}>目前沒有成績資料。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center items-center gap-4 px-6 py-6 border-t border-[var(--ui-border)]">
              <button
                disabled={gradePage === 0}
                onClick={() => setGradePage((prev) => prev - 1)}
                className={STYLES.pageBtn}
              >
                上一頁
              </button>
              <span className="text-[10px] font-mono tracking-widest uppercase">
                {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / PER_PAGE_MANAGE_GRADES))}
              </span>
              <button
                disabled={(gradePage + 1) * PER_PAGE_MANAGE_GRADES >= totalGrades}
                onClick={() => setGradePage((prev) => prev + 1)}
                className={STYLES.pageBtn}
              >
                下一頁
              </button>
            </div>
          </section>
        )}

        {isStudent && (
          <div className="mt-12 mb-20">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-10 bg-white border border-black/5 rounded-[2rem] shadow-sm theme-transition">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rotate-3 rounded-2xl bg-black text-white shadow-xl">
                    <Clock size={32} aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block mb-1 text-[10px] font-black tracking-[0.2em] text-black/40 uppercase">
                      連續打卡
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-black">{attendanceCount}</span>
                      <span className="text-xs font-bold uppercase text-black/60">天</span>
                    </div>
                  </div>
                </div>

                <div className="hidden gap-2 lg:flex" aria-hidden="true">
                  {Array.from({ length: 7 }, (_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full border border-black/10 ${
                        index < weeklyProgress ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black tracking-[0.2em] uppercase text-black/20">
                  持續努力，穩定進步
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {canManageGrades && isGradeCreateOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsGradeCreateOpen(false)}>
          <div className={STYLES.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">新增成績</span>
              <button onClick={() => setIsGradeCreateOpen(false)} className="p-2 hover:rotate-90 transition-transform duration-500">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddGrade}>
              {[
                { id: 'g-uid', label: '學生 UUID *', name: 'target_student_id', type: 'text', ph: 'profiles.id' },
                { id: 'g-subject', label: '科目 *', name: 'subject', type: 'text', ph: '數學' },
                { id: 'g-term', label: '學期 *', name: 'term', type: 'text', ph: '113-2' },
                { id: 'g-score', label: '分數 (0-100) *', name: 'score', type: 'number', ph: '85' },
                { id: 'g-date', label: '測驗日期', name: 'exam_date', type: 'date', ph: '' },
              ].map((field) => (
                <div key={field.id}>
                  <label className={STYLES.formLabel} htmlFor={field.id}>{field.label}</label>
                  <input
                    id={field.id}
                    type={field.type}
                    placeholder={field.ph}
                    required={field.label.includes('*')}
                    min={field.type === 'number' ? '0' : undefined}
                    max={field.type === 'number' ? '100' : undefined}
                    className={STYLES.input}
                    value={(newGrade as any)[field.name]}
                    onChange={(event) => setNewGrade((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  />
                </div>
              ))}

              <button type="submit" disabled={isGradeSubmitting} className={STYLES.submitBtn}>
                <Send size={14} aria-hidden="true" />
                {isGradeSubmitting ? '送出中...' : '確認資料'}
              </button>
            </form>
          </div>
        </div>
      )}

      {editingGrade && (
        <div className={STYLES.modalOverlay} onClick={() => setEditingGrade(null)}>
          <div className={STYLES.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">編輯成績</span>
              <button onClick={() => setEditingGrade(null)} className="p-2 hover:rotate-90 transition-transform duration-500">
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleUpdateGrade}>
              <label className={STYLES.formLabel} htmlFor="edit-subject">科目 *</label>
              <input
                id="edit-subject"
                type="text"
                required
                className={STYLES.input}
                value={editingGrade.subject}
                onChange={(event) => setEditingGrade((prev) => (prev ? { ...prev, subject: event.target.value } : prev))}
              />

              <label className={STYLES.formLabel} htmlFor="edit-term">學期 *</label>
              <input
                id="edit-term"
                type="text"
                required
                className={STYLES.input}
                value={editingGrade.term}
                onChange={(event) => setEditingGrade((prev) => (prev ? { ...prev, term: event.target.value } : prev))}
              />

              <label className={STYLES.formLabel} htmlFor="edit-score">分數 (0-100) *</label>
              <input
                id="edit-score"
                type="number"
                min="0"
                max="100"
                required
                className={STYLES.input}
                value={editingGrade.score}
                onChange={(event) => setEditingGrade((prev) => (prev ? { ...prev, score: Number(event.target.value) } : prev))}
              />

              <label className={STYLES.formLabel} htmlFor="edit-exam-date">測驗日期</label>
              <input
                id="edit-exam-date"
                type="date"
                className={STYLES.input}
                value={editingGrade.exam_date ?? ''}
                onChange={(event) => setEditingGrade((prev) => (prev ? { ...prev, exam_date: event.target.value } : prev))}
              />

              <button type="submit" disabled={isGradeSubmitting} className={STYLES.submitBtn}>
                <Send size={14} aria-hidden="true" />
                {isGradeSubmitting ? '儲存中...' : '儲存修改'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingAnnounce && (
        <div className={STYLES.modalOverlay} onClick={() => setViewingAnnounce(null)}>
          <div className={`${STYLES.modalContent} max-w-2xl`} onClick={(event) => event.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className={STYLES.cardLabel}>{formatDate(viewingAnnounce.created_at)}</span>
                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">{viewingAnnounce.title}</h2>
              </div>
              <button onClick={() => setViewingAnnounce(null)} className="p-2 hover:rotate-90 transition-transform duration-500">
                <X size={24} aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 max-h-[50vh] overflow-y-auto pr-2">
              <p className="whitespace-pre-wrap text-base leading-relaxed font-light text-neutral-600">{viewingAnnounce.content}</p>
            </div>

            <div className="flex justify-between items-center mt-12 pt-8 border-t border-black/5">
              {isAdmin && (
                <button
                  onClick={() => handleDeleteAnnouncement(viewingAnnounce.id)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                >
                  刪除
                </button>
              )}
              <button onClick={() => setViewingAnnounce(null)} className="ml-auto px-8 py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase">
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isAnnounceCreateOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsAnnounceCreateOpen(false)}>
          <div className={STYLES.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">發佈公告</span>
              <button onClick={() => setIsAnnounceCreateOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddAnnouncement}>
              <label className={STYLES.formLabel} htmlFor="ann-title">標題 *</label>
              <input
                id="ann-title"
                type="text"
                required
                className={STYLES.input}
                value={newAnnounce.title}
                onChange={(event) => setNewAnnounce((prev) => ({ ...prev, title: event.target.value }))}
              />

              <label className={STYLES.formLabel} htmlFor="ann-content">內容 *</label>
              <textarea
                id="ann-content"
                rows={5}
                required
                className={`${STYLES.input} h-auto resize-none`}
                value={newAnnounce.content}
                onChange={(event) => setNewAnnounce((prev) => ({ ...prev, content: event.target.value }))}
              />

              <div className="flex items-center gap-3 mb-8">
                <input
                  id="ann-priority"
                  type="checkbox"
                  className="w-4 h-4 accent-black"
                  checked={newAnnounce.priority}
                  onChange={(event) => setNewAnnounce((prev) => ({ ...prev, priority: event.target.checked }))}
                />
                <label htmlFor="ann-priority" className="cursor-pointer text-[10px] font-bold tracking-widest uppercase">
                  標記為置頂
                </label>
              </div>

              <button type="submit" className={STYLES.submitBtn}>
                <Send size={14} aria-hidden="true" /> 發佈
              </button>
            </form>
          </div>
        </div>
      )}

      {isAdmin && isInviteOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsInviteOpen(false)}>
          <div className={STYLES.modalContent} onClick={(event) => event.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">邀請學生</span>
              <button onClick={() => setIsInviteOpen(false)}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleInviteStudent}>
              {[
                { id: 'inv-email', label: 'Email *', name: 'email', type: 'email', ph: 'student@example.com' },
                { id: 'inv-name', label: '學生姓名', name: 'full_name', type: 'text', ph: '王大明' },
                { id: 'inv-class', label: '班級名稱', name: 'class_name', type: 'text', ph: '甲班' },
                { id: 'inv-no', label: '學號', name: 'student_no', type: 'text', ph: 'A1001' },
              ].map((field) => (
                <div key={field.id}>
                  <label className={STYLES.formLabel} htmlFor={field.id}>{field.label}</label>
                  <input
                    id={field.id}
                    type={field.type}
                    required={field.label.includes('*')}
                    placeholder={field.ph}
                    className={STYLES.input}
                    value={(newInvite as any)[field.name]}
                    onChange={(event) => setNewInvite((prev) => ({ ...prev, [field.name]: event.target.value }))}
                  />
                </div>
              ))}

              {inviteError && <div className={STYLES.errorBox} role="alert">{inviteError}</div>}
              {inviteSuccess && <div className={STYLES.successBox} role="status">{inviteSuccess}</div>}

              <button type="submit" disabled={isInviting} className={`${STYLES.submitBtn} mt-6`}>
                <Users size={14} aria-hidden="true" />
                {isInviting ? '發送中...' : '發送邀請信'}
              </button>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 16, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[1000] flex items-center gap-3 px-6 py-4 border shadow-2xl ${
              toast.type === 'success' ? 'bg-white border-black text-black' : 'bg-red-50 border-red-500 text-red-600'
            }`}
            role="alert"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-green-500" aria-hidden="true" />
            ) : (
              <AlertCircle size={18} aria-hidden="true" />
            )}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
