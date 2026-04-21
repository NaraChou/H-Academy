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
        </Routes>
        
        {/* Footer Section */}
        <Footer />
      </main>
      
      <BackToTop />
    </div>
  );
}
