import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LAYOUT } from '../../styles/layout';
import { Award, BookOpen, Clock, TrendingUp, Plus, X, AlertCircle, Trophy, Send, Key, Star, CheckCircle2, Bell, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * [A] 視覺資訊備註
 * 頁面：Dashboard (Academic Portal)
 * 設計：Kiki Design Style — 提供動態歡迎語、每日簽到系統與專業成績管理。
 * 視覺：極簡佈局，黑白高對比，專業間距感。
 */

interface Grade {
  id: string;
  subject: string;
  score: number;
  exam_date: string;
  user_id: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: boolean;
  created_at: string;
}

interface CheckIn {
  id: string;
  created_at: string;
}

const STYLES = {
  wrapper: 'flex flex-col min-h-screen w-full px-1 py-10 md:px-6 md:py-20 theme-transition bg-[var(--ui-bg)]',
  container: LAYOUT.container,
  header: 'flex justify-between items-end mb-8 md:mb-12 border-b border-[var(--ui-border)] pb-6 theme-transition',
  title: 'text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--brand-primary)] theme-transition',
  subtitle: 'text-sm md:text-lg text-[var(--text-sub)] mt-2 font-light',
  button: 'px-4 py-2 md:px-6 md:py-2 bg-[var(--ui-border)] text-[var(--text-main)] text-[10px] md:text-sm font-bold tracking-widest rounded-lg transition-all duration-300 hover:bg-[var(--brand-primary)] hover:text-white',
  
  // Bento Grid
  bentoContainer: 'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-auto md:auto-rows-[200px]',
  bentoItem: 'p-6 md:p-8 bg-[var(--ui-white)] border border-[var(--ui-border)] rounded-2xl shadow-sm theme-transition hover:shadow-lg duration-500 overflow-hidden flex flex-col justify-between min-h-[160px] md:min-h-0',
  
  // Bento Variance
  bentoLarge: 'md:col-span-2 md:row-span-2 h-full',
  bentoFull: 'md:col-span-3 row-span-1',
  bentoMedium: 'md:col-span-1 md:row-span-2 h-full',
  
  itemHeader: 'flex items-center gap-3 mb-4',
  iconBox: 'p-2 rounded-lg bg-[var(--ui-border)] text-[var(--brand-primary)]',
  cardLabel: 'text-[10px] font-bold tracking-widest text-[var(--text-sub)] uppercase',
  cardTitle: 'text-2xl font-bold text-[var(--text-main)]',
  
  // Grade List
  gradeRow: 'flex justify-between items-center py-4 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/50 transition-colors px-2',
  gradeSubject: 'font-bold text-[var(--text-main)]',
  gradeScore: 'font-mono text-xl font-black transition-all duration-300',
  gradeMeta: 'text-[10px] text-[var(--text-sub)] uppercase tracking-tighter',

  // Modal & Form (Kiki Minimalism)
  modalOverlay: 'fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 theme-transition',
  modalContent: 'w-full max-w-md bg-[var(--ui-bg)] border border-black p-8 shadow-2xl theme-transition relative overflow-hidden',
  modalLine: 'absolute top-0 left-0 w-full h-[1px] bg-black',
  
  formLabel: 'block text-[10px] font-bold tracking-[0.2em] text-[var(--text-sub)] uppercase mb-2',
  input: 'w-full px-4 py-3 bg-transparent border border-[var(--ui-border)] focus:border-black outline-none text-sm transition-colors theme-transition mb-6',
  addBtn: 'flex items-center gap-2 px-4 py-2 border border-black text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-all duration-300',
  submitBtn: 'w-full py-4 bg-black text-white text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-neutral-800 transition-all duration-300 flex items-center justify-center gap-3',
  
  // Pagination & Display
  pageBtn: 'px-3 py-1 border border-[var(--ui-border)] text-[9px] font-bold transition-all hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[var(--text-sub)]',
  announceItem: 'group py-4 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/30 transition-all cursor-pointer flex justify-between items-center px-2',
  priorityTag: 'inline-block px-2 py-0.5 bg-black text-white text-[8px] font-bold tracking-widest uppercase mr-3',
  announceTitle: 'text-sm font-bold text-[var(--text-main)] group-hover:translate-x-1 transition-transform',
  announceDate: 'text-[9px] font-mono text-[var(--text-sub)] uppercase',

  emptyText: 'text-center py-12 text-[var(--text-sub)] italic font-light',
} as const;

export const StaffDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementPage, setAnnouncementPage] = useState(0);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [readIds, setReadIds] = useState<string[]>([]);
  const itemsPerPageAnnounce = 10;
  
  // Grades State
  const [gradePage, setGradePage] = useState(0);
  const [totalGrades, setTotalGrades] = useState(0);
  const itemsPerPageGrades = 20;

  // Detail Modal State
  const [viewingAnnounce, setViewingAnnounce] = useState<Announcement | null>(null);
  const [isAnnounceCreateOpen, setIsAnnounceCreateOpen] = useState(false);
  const [newAnnounce, setNewAnnounce] = useState({
    title: '',
    content: '',
    priority: false
  });
  
  // Check-in State
  const [checkInCount, setCheckInCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGrade, setNewGrade] = useState({
    subject: '',
    score: '',
    exam_date: '',
    target_user_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAnnouncements = async () => {
    if (!supabase) return;
    try {
      const from = announcementPage * itemsPerPageAnnounce;
      const to = from + itemsPerPageAnnounce - 1;

      const { data, error, count } = await supabase
        .from('announcements')
        .select('*', { count: 'exact' })
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error && data) {
        setAnnouncements(data);
        setTotalAnnouncements(count || 0);
      }
    } catch (err) {
      console.error('Announce fetch error:', err);
    }
  };

  const fetchGrades = async (userIdStr?: string) => {
    if (!supabase) return;
    try {
      const from = gradePage * itemsPerPageGrades;
      const to = from + itemsPerPageGrades - 1;

      // Logic: Admin with no specific filter shows all. Student shows self.
      let query = supabase.from('grades').select('*', { count: 'exact' });
      
      if (userIdStr) {
        query = query.eq('user_id', userIdStr);
      } else if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error, count } = await query
        .order('exam_date', { ascending: false })
        .range(from, to);
        
      if (!error && data) {
        setGrades(data);
        setTotalGrades(count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch grades:', err);
    }
  };

  const fetchCheckIns = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error, count } = await supabase
        .from('check_ins')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      if (!error && data) {
        setCheckInCount(count || 0);
        
        // Check if any check-in was today (zh-TW localized date)
        const today = new Date().toLocaleDateString('zh-TW');
        const checkedToday = data.some(ci => 
          new Date(ci.created_at).toLocaleDateString('zh-TW') === today
        );
        setHasCheckedInToday(checkedToday);
      }
    } catch (err) {
      console.error('Failed to fetch check-ins:', err);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      if (!supabase) return;
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      setUser(currentUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
        
      const isAdminUser = profile?.role === 'admin';
      setIsAdmin(isAdminUser);

      await Promise.all([
        fetchGrades(isAdminUser ? undefined : currentUser.id),
        fetchCheckIns(currentUser.id),
        fetchAnnouncements()
      ]);
      setIsLoading(false);
    };

    initDashboard();
    
    // Load read status
    const stored = localStorage.getItem('readAnnouncements');
    if (stored) {
      try {
        setReadIds(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse read announcements', e);
      }
    }
  }, [navigate, announcementPage, gradePage]);

  const handleMarkAsRead = (announce: Announcement) => {
    setViewingAnnounce(announce);
    if (!readIds.includes(announce.id)) {
      const updated = [...readIds, announce.id];
      setReadIds(updated);
      localStorage.setItem('readAnnouncements', JSON.stringify(updated));
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleCheckIn = async () => {
    if (!supabase || !user || hasCheckedInToday || isCheckingIn) return;

    setIsCheckingIn(true);
    try {
      const { error } = await supabase
        .from('check_ins')
        .insert([{ user_id: user.id }]);

      if (!error) {
        await fetchCheckIns(user.id);
      } else {
        console.error('Check-in error:', error.message);
      }
    } catch (err) {
      console.error('Check-in exception:', err);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isAdmin) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          title: newAnnounce.title,
          content: newAnnounce.content,
          priority: newAnnounce.priority
        }]);

      if (!error) {
        setIsAnnounceCreateOpen(false);
        setNewAnnounce({ title: '', content: '', priority: false });
        fetchAnnouncements();
      } else {
        alert('發布失敗: ' + error.message);
      }
    } catch (err) {
      console.error('Announce submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!supabase || !isAdmin || !confirm('確定要刪除這條公告嗎？')) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchAnnouncements();
        setViewingAnnounce(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    if (!isAdmin) {
      alert('許可權不足：唯有管理員可新增成績。');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Admin must specify a target UID, students use their own
      const finalUserId = isAdmin ? newGrade.target_user_id.trim() : user.id;
      
      if (isAdmin && !finalUserId) {
        alert('請輸入學生 UID');
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase
        .from('grades')
        .insert([{
          user_id: finalUserId,
          subject: newGrade.subject,
          score: parseInt(newGrade.score),
          exam_date: newGrade.exam_date || null
        }])
        .select();

      if (!error && data && data.length > 0) {
        setIsModalOpen(false);
        setNewGrade({ subject: '', score: '', exam_date: '', target_user_id: '' });
        showToast('成績已成功登入系統');
        
        // Trigger highlight
        setLastAddedId(data[0].id);
        setTimeout(() => setLastAddedId(null), 5000);
        
        // After admin adds, go back to seeing "all" to confirm entry in list
        await fetchGrades(isAdmin ? undefined : user.id);
      } else {
        showToast('提交失敗: ' + (error?.message || '未知錯誤'), 'error');
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageScore = grades.length > 0 
    ? (grades.reduce((acc, curr) => acc + (curr.score || 0), 0) / grades.length).toFixed(1)
    : '0';

  // [視覺邏輯] 動態色彩反饋
  const renderScore = (score: number) => {
    if (score === 100) return (
      <span className={`${STYLES.gradeScore} text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] flex items-center gap-2`}>
        <Trophy size={16} /> {score}
      </span>
    );
    if (score >= 90) return <span className={`${STYLES.gradeScore} text-black font-black`}>{score}</span>;
    if (score >= 60 && score <= 70) return <span className={`${STYLES.gradeScore} text-neutral-400 font-medium`}>{score}</span>;
    if (score < 60) return (
      <span className={`${STYLES.gradeScore} text-[#E11D48] flex items-center gap-1`}>
        <AlertCircle size={14} /> {score}
      </span>
    );
    return <span className={`${STYLES.gradeScore} text-[var(--brand-primary)]`}>{score}</span>;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'YYYY.MM.DD';
    try {
      const date = new Date(dateStr);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}.${m}.${d}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <section className={STYLES.wrapper} aria-label="Dashboard">
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-black text-white rounded-2xl shadow-lg ring-1 ring-black/10">
              {isAdmin ? <Key size={24} /> : <Star size={24} />}
            </div>
            <div>
              <h1 className={STYLES.title}>
                {isAdmin ? '管理員您好' : '教職員您好'}
              </h1>
              <p className={STYLES.subtitle}>
                {isAdmin ? '系統最高權限已驗證，您可進行全面設定。' : `${user?.email?.split('@')[0]} 老師，您好`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Bell 
                size={20} 
                className={announcements.some(a => !readIds.includes(a.id)) ? 'text-[var(--brand-primary)] animate-bounce' : 'text-black/20'} 
              />
              {announcements.some(a => !readIds.includes(a.id)) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E11D48] border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => navigate('/admin-checkin')} className={`${STYLES.button} hidden md:flex items-center gap-2 bg-[var(--ui-border)] hover:bg-[var(--brand-primary)]`}>
                  <QrCode size={14} />
                  展示簽到碼
                </button>
              )}
              <button onClick={handleLogout} className={STYLES.button}>
                安全登出
              </button>
            </div>
          </div>
        </header>

        <main className={`${STYLES.bentoContainer} ${isAdmin ? 'md:auto-rows-auto' : ''}`}>
          {/* Announcements Panel */}
          <div className={`${STYLES.bentoItem} ${STYLES.bentoLarge}`}>
            <div className="flex justify-between items-start mb-6 w-full">
              <div className={STYLES.itemHeader + " mb-0"}>
                <div className={STYLES.iconBox}><Clock size={20} /></div>
                <div className="flex items-center gap-2">
                  <span className={STYLES.cardLabel}>重要公告 Announcements</span>
                  {announcements.some(a => !readIds.includes(a.id)) && (
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                  )}
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => setIsAnnounceCreateOpen(true)} className={STYLES.addBtn}>
                  <Plus size={12} /> Post News
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={announcementPage}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {announcements.length > 0 ? (
                    <>
                      {announcements.map((announce) => {
                        const isRead = readIds.includes(announce.id);
                        return (
                          <div 
                            key={announce.id} 
                            className={`${STYLES.announceItem} ${isRead ? 'opacity-60' : ''}`}
                            onClick={() => handleMarkAsRead(announce)}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                {announce.priority && <span className={STYLES.priorityTag}>TOP</span>}
                                <span className={`${STYLES.announceTitle} flex items-center gap-2`}>
                                  <Bell size={14} className={isRead ? 'text-black/20' : 'text-[var(--brand-primary)]'} />
                                  {announce.title}
                                </span>
                              </div>
                              <span className={STYLES.announceDate}>{formatDate(announce.created_at)}</span>
                            </div>
                            {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" />}
                          </div>
                        );
                      })}
                      
                      {/* Pagination Controls */}
                      <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-[var(--ui-border)] text-black">
                        <button 
                          disabled={announcementPage === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnnouncementPage(p => p - 1);
                          }}
                          className={STYLES.pageBtn}
                        >
                          PREV
                        </button>
                        <span className="text-[10px] font-mono tracking-widest uppercase">
                          Page {announcementPage + 1} / {Math.max(1, Math.ceil(totalAnnouncements / itemsPerPageAnnounce))}
                        </span>
                        <button 
                          disabled={(announcementPage + 1) * itemsPerPageAnnounce >= totalAnnouncements}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAnnouncementPage(p => p + 1);
                          }}
                          className={STYLES.pageBtn}
                        >
                          NEXT
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={STYLES.emptyText}>目前尚無任何公告</div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Main Grades Panel */}
          <div className={`${STYLES.bentoItem} ${isAdmin ? 'md:col-span-3 h-auto min-h-[600px] py-12' : STYLES.bentoLarge}`}>
            <div className="flex justify-between items-start mb-6 w-full px-2">
              <div className={STYLES.itemHeader + " mb-0"}>
                <div className={STYLES.iconBox}><Award size={20} /></div>
                <span className={STYLES.cardLabel}>
                  {isAdmin ? '全校成績登打與管理中心' : '學期成績單'}
                </span>
              </div>
              {isAdmin && (
                <button onClick={() => setIsModalOpen(true)} className={STYLES.addBtn}>
                  <Plus size={12} /> Add Grade
                </button>
              )}
            </div>

            {/* Grade Table Header */}
            {grades.length > 0 && (
              <div className={`grid ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} px-4 py-2 bg-[var(--ui-bg)] border-y border-[var(--ui-border)] text-[9px] font-black tracking-[0.2em] text-[var(--text-sub)] uppercase`}>
                {isAdmin && <span className="hidden md:inline">學生識別 ID</span>}
                <span className="md:inline">資訊 Info / 科目</span>
                <span className="hidden md:inline">考試日期 Date</span>
                <span className="text-right">分數 Score</span>
              </div>
            )}
            
            <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${isAdmin ? 'mt-2' : ''}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={gradePage}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  {grades.length > 0 ? (
                    <>
                      {grades.map((grade) => (
                        <motion.div 
                          key={grade.id} 
                          className={`grid ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'} items-center px-4 py-6 md:py-5 border-b border-[var(--ui-border)] last:border-0 hover:bg-[var(--ui-bg)]/50 transition-colors gap-y-4 md:gap-y-0`}
                          initial={lastAddedId === grade.id ? { backgroundColor: 'rgba(0,0,0,0.05)' } : false}
                          animate={{ backgroundColor: 'transparent' }}
                          transition={{ duration: 2 }}
                        >
                          {isAdmin ? (
                            <>
                              <div className="flex flex-col md:block">
                                <span className="font-mono text-[10px] text-black/40 font-bold mb-1 md:mb-0">
                                  {grade.user_id?.substring(0, 8).toUpperCase() || 'UNKNOWN'}
                                </span>
                                <span className={`${STYLES.gradeSubject} md:hidden block mt-1`}>{grade.subject}</span>
                              </div>
                              <span className={`${STYLES.gradeSubject} hidden md:inline`}>{grade.subject}</span>
                              <div className="flex flex-col items-end md:items-start md:block">
                                <span className={STYLES.gradeMeta}>{formatDate(grade.exam_date)}</span>
                                <div className="md:hidden mt-2">{renderScore(grade.score)}</div>
                              </div>
                              <div className="text-right hidden md:block">{renderScore(grade.score)}</div>
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col md:block">
                                <span className={STYLES.gradeSubject}>{grade.subject}</span>
                              </div>
                              <span className={`${STYLES.gradeMeta} hidden md:inline`}>{formatDate(grade.exam_date)}</span>
                              <div className="flex flex-col items-end md:items-start md:block">
                                <div className="md:hidden text-[9px] text-[var(--text-sub)] mb-2 uppercase tracking-[0.1em] font-black">{formatDate(grade.exam_date)}</div>
                                <div className="text-right">{renderScore(grade.score)}</div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      ))}

                      {/* Grade Pagination */}
                      <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-[var(--ui-border)] text-black">
                        <button 
                          disabled={gradePage === 0}
                          onClick={() => setGradePage(p => p - 1)}
                          className={STYLES.pageBtn}
                        >
                          PREV
                        </button>
                        <span className="text-[10px] font-mono tracking-widest uppercase">
                          Page {gradePage + 1} / {Math.max(1, Math.ceil(totalGrades / itemsPerPageGrades))}
                        </span>
                        <button 
                          disabled={(gradePage + 1) * itemsPerPageGrades >= totalGrades}
                          onClick={() => setGradePage(p => p + 1)}
                          className={STYLES.pageBtn}
                        >
                          NEXT
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={STYLES.emptyText}>
                      {isLoading ? '資調取中...' : '目前尚無成績資料'}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {!isAdmin && (
            <>
              {/* Stats Panel */}
              <div className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}><TrendingUp size={20} /></div>
                  <span className={STYLES.cardLabel}>平均積分 (GPA)</span>
                </div>
                <div>
                  <div className="text-5xl font-black text-[var(--brand-primary)] mb-2">
                    {averageScore}
                  </div>
                  <p className="text-xs text-[var(--text-sub)] font-light tracking-widest uppercase">
                    當前學期間總平均
                  </p>
                </div>
              </div>

              {/* Account Info */}
              <div className={STYLES.bentoItem}>
                <div className={STYLES.itemHeader}>
                  <div className={STYLES.iconBox}><BookOpen size={20} /></div>
                  <span className={STYLES.cardLabel}>註冊課程數</span>
                </div>
                <div>
                  <div className="text-5xl font-black text-[var(--brand-primary)] mb-2">
                    {isLoading ? '--' : grades.length}
                  </div>
                  <p className="text-xs text-[var(--text-sub)] font-light tracking-widest uppercase">
                    本學期已登載科目
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Student-Only Check-in: Full Width Visual Strip */}
          {!isAdmin && (
            <div className={`${STYLES.bentoItem} ${STYLES.bentoFull} flex-row items-center justify-between border-black/10`}>
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center text-white shadow-xl rotate-3">
                    <Clock size={32} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black tracking-[0.2em] text-black/40 uppercase mb-1">STREAK STATUS</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-black">{checkInCount}</span>
                      <span className="text-xs font-bold text-black/60 uppercase">Consecutive Days</span>
                    </div>
                  </div>
                </div>
                
                <div className="hidden lg:flex gap-2">
                  {[...Array(7)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full border border-black/10 ${i < (checkInCount % 7 || (checkInCount > 0 ? 7 : 0)) ? 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-transparent'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <button 
                  onClick={handleCheckIn}
                  disabled={hasCheckedInToday || isCheckingIn}
                  className={`group relative overflow-hidden flex items-center gap-3 px-8 py-4 rounded-xl text-[10px] font-black tracking-[0.3em] transition-all duration-500 ${
                    hasCheckedInToday 
                      ? 'bg-neutral-100 text-neutral-400 border border-neutral-200' 
                      : 'bg-black text-white hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl'
                  }`}
                >
                  {hasCheckedInToday ? (
                    <>
                      <CheckCircle2 size={16} className="text-green-500" />
                      COMPLETED TODAY
                    </>
                  ) : (
                    <>
                      <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      SIGN IN NOW
                    </>
                  )}
                </button>
                <p className="text-[9px] font-bold text-black/30 tracking-[0.1em] uppercase">
                  {hasCheckedInToday ? '已登載今日學習軌跡' : '簽到領取學習點數'}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Grade Modal */}
      {isModalOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">ADD GRADE</span>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:rotate-90 transition-transform duration-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGrade}>
              {isAdmin && (
                <div>
                  <label className={STYLES.formLabel}>學生唯一識別碼 Student UID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="輸入學生的 User ID"
                    className={STYLES.input}
                    value={newGrade.target_user_id}
                    onChange={e => setNewGrade({...newGrade, target_user_id: e.target.value})}
                  />
                </div>
              )}

              <div>
                <label className={STYLES.formLabel}>科目名稱 Subject</label>
                <input 
                  type="text" 
                  required
                  placeholder="例：英文"
                  className={STYLES.input}
                  value={newGrade.subject}
                  onChange={e => setNewGrade({...newGrade, subject: e.target.value})}
                />
              </div>

              <div>
                <label className={STYLES.formLabel}>成績分數 Score (0-100)</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  max="100"
                  placeholder="85"
                  className={STYLES.input}
                  value={newGrade.score}
                  onChange={e => setNewGrade({...newGrade, score: e.target.value})}
                />
              </div>

              <div>
                <label className={STYLES.formLabel}>考試日期 Exam Date</label>
                <input 
                  type="date" 
                  className={STYLES.input}
                  value={newGrade.exam_date}
                  onChange={e => setNewGrade({...newGrade, exam_date: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className={STYLES.submitBtn}
              >
                {isSubmitting ? 'SUBMITTING...' : (
                  <>
                    <Send size={14} /> 
                    CONFIRM DATA
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Detail Modal */}
      {viewingAnnounce && (
        <div className={STYLES.modalOverlay} onClick={() => setViewingAnnounce(null)}>
          <div className={`${STYLES.modalContent} max-w-2xl animate-in fade-in zoom-in duration-300`} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-start mb-10">
              <div>
                <span className={STYLES.formLabel}>
                  {formatDate(viewingAnnounce.created_at)}
                  {viewingAnnounce.priority && ' • PRIORITY NEWS'}
                </span>
                <h2 className="text-2xl font-black mt-2 leading-tight uppercase tracking-tight">
                  {viewingAnnounce.title}
                </h2>
              </div>
              <button onClick={() => setViewingAnnounce(null)} className="p-2 hover:rotate-90 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed font-light mb-12">
              <div className="whitespace-pre-wrap">{viewingAnnounce.content}</div>
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-black/5">
              {isAdmin && (
                <button 
                  onClick={() => handleDeleteAnnouncement(viewingAnnounce.id)}
                  className="px-4 py-2 text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest"
                >
                  Delete Announcement
                </button>
              )}
              <button 
                onClick={() => setViewingAnnounce(null)}
                className="ml-auto px-8 py-3 bg-black text-white text-[10px] font-black tracking-widest uppercase"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Creation Modal (Admin Only) */}
      {isAdmin && isAnnounceCreateOpen && (
        <div className={STYLES.modalOverlay} onClick={() => setIsAnnounceCreateOpen(false)}>
          <div className={STYLES.modalContent} onClick={e => e.stopPropagation()}>
            <div className={STYLES.modalLine} />
            <div className="flex justify-between items-center mb-10">
              <span className="text-xl font-black tracking-widest text-black">POST NEWS</span>
              <button onClick={() => setIsAnnounceCreateOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddAnnouncement}>
              <div>
                <label className={STYLES.formLabel}>公告標題 Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="輸入簡潔的標題"
                  className={STYLES.input}
                  value={newAnnounce.title}
                  onChange={e => setNewAnnounce({...newAnnounce, title: e.target.value})}
                />
              </div>

              <div>
                <label className={STYLES.formLabel}>詳細內容 Content</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="輸入公告詳細內容..."
                  className={`${STYLES.input} h-auto`}
                  value={newAnnounce.content}
                  onChange={e => setNewAnnounce({...newAnnounce, content: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-3 mb-8">
                <input 
                  type="checkbox" 
                  id="priority"
                  className="w-4 h-4 accent-black"
                  checked={newAnnounce.priority}
                  onChange={e => setNewAnnounce({...newAnnounce, priority: e.target.checked})}
                />
                <label htmlFor="priority" className="text-[10px] font-bold tracking-widest uppercase cursor-pointer">
                  Mark as Priority (Pin to Top)
                </label>
              </div>

              <button type="submit" className={STYLES.submitBtn}>
                <Send size={14} /> PUBLISH ANNOUNCEMENT
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`fixed top-8 right-8 z-[1000] px-6 py-4 border shadow-2xl flex items-center gap-3 ${
              toast.type === 'success' ? 'bg-white border-black text-black' : 'bg-red-50 border-red-500 text-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-green-500" /> : <AlertCircle size={18} />}
            <span className="text-sm font-bold tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

