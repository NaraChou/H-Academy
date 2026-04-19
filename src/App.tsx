import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { CustomCursor } from './components/common/CustomCursor';
import { Loader } from './components/ui/Loader';
import { Navbar } from './components/layout/Navbar';
import { Hero } from './components/sections/Hero';
import { AdvantageList } from './components/sections/AdvantageList';
import { CourseList } from './components/sections/CourseList';
import { ContactForm } from './components/sections/ContactForm';
import { MarqueeVision } from './components/sections/MarqueeVision';
import { Footer } from './components/layout/Footer';
import { WorkList } from './components/sections/WorkList';
import { EducationPage } from './pages/Education';
import { AboutPage } from './pages/About';
import { CampusPage } from './pages/Campus';
import { News } from './pages/News';
import { StaffLogin } from './pages/auth/StaffLogin';
import { StudentLogin } from './pages/auth/StudentLogin';
import { UpdatePassword } from './pages/auth/UpdatePassword';
import { StaffDashboard } from './pages/dashboard/StaffDashboard';
import { supabase } from './lib/supabase';
import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { AuthGuard } from './components/auth/AuthGuard';
import { AdminCheckIn } from './pages/AdminCheckIn';
import { EmployeeCheckIn } from './pages/EmployeeCheckIn';
import { ScrollToAnchor } from './components/common/ScrollToAnchor';
import { BackToTop } from './components/common/BackToTop';

/**
 * [A] 視覺資訊備註
 * 頁面層 (Layer 05)，展示首頁主內容區塊。
 */

const STYLES = {
  wrapper: 'relative flex flex-col min-h-screen bg-[var(--ui-bg)] theme-transition',
  // Main - remove overflow-y-auto so window manages scrolling (required for GSAP ScrollTrigger and window.scrollTo to work correctly)
  main: 'flex flex-col flex-1 w-full pt-32 px-2 md:px-16 lg:px-24 mx-auto max-w-[1600px]',
} as const;

const Home = () => (
  <>
    {/* Hsinyu Hero Section */}
    <Hero />
    
    {/* Core Advantages Section */}
    <AdvantageList />
    
    {/* Course List Section (preview) */}
    <CourseList />

    {/* 活動錦集元件取代原作品列表 */}
    <WorkList />

    {/* Connect & Consult Form Section */}
    <ContactForm />

    {/* Marquee Vision Background Section */}
    <MarqueeVision />
  </>
);

export default function App() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className={STYLES.wrapper}>
      <ScrollToAnchor />
      <Loader />
      <Navbar />
      <CustomCursor />
      
      <main className={STYLES.main} id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/courses" element={<EducationPage />} /> {/* Fallback support */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/campus" element={<CampusPage />} />
          <Route path="/news" element={<News />} />
          
          {/* Auth Routes */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          {/* Protected Staff Routes */}
          <Route path="/staff/dashboard" element={
            <AuthGuard allowedRoles={['admin', 'staff']}>
              <StaffDashboard />
            </AuthGuard>
          } />
          
          {/* Protected Student Routes */}
          <Route path="/student/dashboard" element={
            <AuthGuard allowedRoles={['student']}>
              <StudentDashboard />
            </AuthGuard>
          } />

          {/* Legacy or unified tools */}
          <Route path="/admin-checkin" element={
            <AuthGuard allowedRoles={['admin']}>
              <AdminCheckIn />
            </AuthGuard>
          } />
          <Route path="/staff/check-in" element={
            <AuthGuard allowedRoles={['admin', 'staff']}>
              <EmployeeCheckIn />
            </AuthGuard>
          } />
        </Routes>
        
        {/* Footer Section */}
        <Footer />
      </main>
      
      <BackToTop />
    </div>
  );
}
