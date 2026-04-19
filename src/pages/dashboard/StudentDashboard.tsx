import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LAYOUT } from '../../styles/layout';
import { BookOpen, User, LogOut, Award, Calendar } from 'lucide-react';

/**
 * [A] 視覺資訊備註
 * 頁面：StudentDashboard (學生與家長儀表板)
 * 視覺：親切溫暖的圓角設計，強調重點資訊。
 */

interface Grade {
  id: string;
  subject: string;
  score: number;
  exam_date: string;
}

const STYLES = {
  wrapper: 'flex flex-col min-h-screen w-full px-4 py-10 md:px-6 md:py-20 theme-transition bg-neutral-50',
  container: LAYOUT.container,
  header: 'flex justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm border border-neutral-100',
  titleBox: 'flex flex-col',
  title: 'text-2xl font-bold text-[var(--brand-primary)]',
  subtitle: 'text-sm text-neutral-500 mt-1',
  logoutBtn: 'px-6 py-3 bg-red-50 text-red-600 font-bold rounded-xl transition-all hover:bg-red-100 active:scale-95 text-sm flex items-center gap-2',
  
  grid: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  card: 'bg-white border border-neutral-100 p-8 rounded-3xl shadow-sm h-full',
  cardHeader: 'flex items-center gap-3 mb-6',
  cardTitle: 'text-xl font-bold text-neutral-800',
  iconWrapper: 'p-3 rounded-2xl bg-blue-50 text-[var(--hsinyu-blue)]',
  
  gradeRow: 'flex justify-between items-center py-4 border-b border-neutral-100 last:border-0',
  gradeSubject: 'font-bold text-neutral-700',
  gradeScore: 'text-2xl font-black text-[var(--hsinyu-blue)]',
} as const;

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/student/login');
        return;
      }
      setUser(session.user);

      // fetch personal grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('exam_date', { ascending: false });

      if (gradesData) setGrades(gradesData);
    };

    fetchUserAndData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/student/login');
  };

  return (
    <div className={STYLES.wrapper}>
      <div className={STYLES.container}>
        <header className={STYLES.header}>
          <div className={STYLES.titleBox}>
            <h1 className={STYLES.title}>個人學習儀表板</h1>
            <p className={STYLES.subtitle}>歡迎回來，{user?.email}</p>
          </div>
          <button onClick={handleLogout} className={STYLES.logoutBtn}>
            <LogOut size={16} /> 登出系統
          </button>
        </header>

        <div className={STYLES.grid}>
          {/* 個人成績單 */}
          <div className={`${STYLES.card} lg:col-span-2`}>
            <div className={STYLES.cardHeader}>
              <div className={STYLES.iconWrapper}><Award size={24} /></div>
              <h2 className={STYLES.cardTitle}>個人成績單</h2>
            </div>
            
            <div className="flex flex-col gap-2">
              {grades.length > 0 ? (
                grades.map(grade => (
                  <div key={grade.id} className={STYLES.gradeRow}>
                    <div className="flex flex-col">
                      <span className={STYLES.gradeSubject}>{grade.subject}</span>
                      <span className="text-xs text-neutral-400 mt-1">{new Date(grade.exam_date).toLocaleDateString('zh-TW')}</span>
                    </div>
                    <span className={STYLES.gradeScore}>{grade.score}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-neutral-400 text-sm">目前尚無成績紀錄</div>
              )}
            </div>
          </div>

          {/* 電子聯絡簿 */}
          <div className={STYLES.card}>
            <div className={STYLES.cardHeader}>
              <div className={STYLES.iconWrapper}><BookOpen size={24} /></div>
              <h2 className={STYLES.cardTitle}>電子聯絡簿</h2>
            </div>
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Calendar size={48} className="text-neutral-300 mb-4" />
              <p className="text-neutral-500 font-medium">今日無新增聯絡事項</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
