import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Activate } from './pages/Activate';
import { CheckIn } from './pages/CheckIn';
import { ScrollToAnchor } from './components/common/ScrollToAnchor';
import { BackToTop } from './components/common/BackToTop';

/**
 * [A] 視覺資訊備註
 * 頁面層 (Layer 05)，展示首頁主內容區塊。
 */

const STYLES = {
  wrapper: 'relative flex flex-col min-h-screen bg-[var(--ui-bg)] theme-transition',
  // Main - remove overflow-y-auto so window manages scrolling (required for GSAP ScrollTrigger and window.scrollTo to work correctly)
  main: 'flex flex-col flex-1 w-full pt-32 pb-24 px-2 md:px-16 md:pb-32 lg:px-24 mx-auto max-w-[1600px]',
} as const;

const Home = () => (
  <>
    {/* 欣育英雄區塊 */}
    <Hero />
    
    {/* 核心優勢區塊 */}
    <AdvantageList />
    
    {/* 課程列表區塊 (預覽) */}
    <CourseList />

    {/* 活動錦集元件取代原作品列表 */}
    <WorkList />

    {/* 聯繫與諮詢表單區塊 */}
    <ContactForm />

    {/* 跑馬燈願景背景區塊 */}
    <MarqueeVision />
  </>
);

export default function App() {
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
          <Route path="/login" element={<Login />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/check-in" element={<CheckIn />} />
        </Routes>
        
        {/* 頁腳區塊 */}
        <Footer />
      </main>
      
      <BackToTop />
    </div>
  );
}
