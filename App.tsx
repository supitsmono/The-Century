import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring, useScroll } from 'framer-motion';
import { TARGET_DATE } from './constants';
import { TimeLeft, Capsule } from './types';
import { CapsuleWizard } from './components/seal/CapsuleWizard';
import { VaultPage } from './components/VaultPage';
import { HomePage } from './components/HomePage';
import { ProcessSection } from './components/ProcessSection';
import { Landmark, ShieldCheck, Radio, UserCheck, History, Sparkles, Heart, Star, Sun, Lock, Edit3, EyeOff, Globe, Shield, Database, Infinity, Search, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Fingerprint, BadgeCheck } from 'lucide-react';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [liveCount, setLiveCount] = useState(142829);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX);
    mouseY.set(clientY);
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount(prev => prev + Math.floor(Math.random() * 2));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const calculateTimeLeft = useCallback(() => {
    const now = new Date();
    const difference = TARGET_DATE.getTime() - now.getTime();
    if (difference <= 0) return null;
    const seconds = Math.floor((difference / 1000) % 60);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const days = Math.floor((difference / (1000 * 60 * 60 * 24)) % 365);
    const years = Math.floor(difference / (1000 * 60 * 60 * 24 * 365));
    return { years, days, hours, minutes, seconds };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  // Scroll to top on route change
  useEffect(() => {
    // Scroll immediately when route changes
    window.scrollTo(0, 0);
    // Also ensure scroll after a brief delay to handle any async rendering
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Phase 3A: localStorage removed, navigation handled by wizard
  // This callback is kept for Phase 3C (payment flow) compatibility
  const handleCapsuleCreated = (capsule: Capsule) => {
    // For Phase 3A: navigation is handled by wizard, this is a no-op
    // Phase 3C will use this for payment completion flow
  };

  // Determine active view from location
  const isHome = location.pathname === '/';
  const isVault = location.pathname === '/vault';
  const isSeal = location.pathname.startsWith('/seal');

  const navItemClass = "cursor-pointer transition-all duration-300 outline-none pb-2 border-b-2 border-transparent hover:border-[#1e293b] text-[#1e293b] font-medium text-[11px] uppercase tracking-[0.15em] whitespace-nowrap opacity-70 hover:opacity-100 hover:scale-105";
  const activeNavItemClass = "border-[#1e293b] opacity-100";

  const bgX = useTransform(mouseX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [25, -25]);
  const bgY = useTransform(mouseY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [25, -25]);

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full selection:bg-[#cbd5e1] bg-[#f2efe9] text-[#1e293b] relative overflow-x-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      <motion.div 
        className="fixed top-0 left-0 right-0 h-[3px] z-50 origin-left bg-[#1e293b]" 
        style={{ scaleX }} 
      />

      <nav className="fixed top-0 left-0 right-0 w-full flex flex-col md:flex-row justify-between items-center gap-8 md:gap-0 z-40 bg-[#f2efe9]/70 backdrop-blur-xl border-b border-[#d4c9bc]/50" style={{ boxSizing: 'border-box', paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <button onClick={() => navigate('/')} className="cursor-pointer flex flex-col text-center md:text-left hover:opacity-70 transition-opacity duration-300 outline-none group">
          <span className="font-serif italic text-2xl md:text-3xl tracking-tight lowercase text-[#1e293b]">the century</span>
          <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-black text-[#64748b] mt-1 group-hover:text-[#1e293b] transition-colors duration-300">Digital Monument</span>
        </button>
        
        <div className="flex items-center" style={{ gap: '2.5rem' }}>
          <button onClick={() => navigate('/')} className={`${navItemClass} ${isHome ? activeNavItemClass : ''}`}>Home</button>
          <button onClick={() => navigate('/vault')} className={`${navItemClass} ${isVault ? activeNavItemClass : ''}`}>The Vault</button>
          <button onClick={() => navigate('/seal/1')} className={navItemClass}>Seal Your Capsule</button>
        </div>
      </nav>

      <main className="w-full" style={{ boxSizing: 'border-box', paddingTop: '6.5rem' }}>
        <Routes>
          <Route path="/vault" element={<VaultPage liveCount={liveCount} navigate={navigate} />} />
          <Route path="/seal" element={<Navigate to="/seal/1" replace />} />
          <Route path="/seal/:step" element={<CapsuleWizard onClose={() => navigate('/')} onSuccess={handleCapsuleCreated} />} />
          <Route path="/" element={<HomePage timeLeft={timeLeft} navigate={navigate} />} />
        </Routes>
      </main>

      <footer className="border-t border-[#d4c9bc] bg-[#f2efe9] relative z-20" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="flex flex-col items-center justify-center text-center" style={{ gap: '1rem' }}>
            <span className="font-serif italic text-4xl md:text-5xl tracking-tight text-[#1e293b]">the century</span>
            <p className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase font-black text-[#64748b]">Human legacies preserved for the next age.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: fit-content;
          animation: marquee 80s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Vault Page Component - Now imported from separate file
// Home Page Component - Now imported from separate file

const LogItem: React.FC<{ country: string, time: string }> = ({ country, time }) => (
  <div className="flex justify-between items-center py-6 border-b border-[#e8ddd0] group hover:bg-[#faf8f4] px-6 transition-all rounded-[2px] cursor-default">
     <div className="flex items-center" style={{ gap: '1.5rem' }}>
        <div className="w-2 h-2 rounded-full bg-[#cbd5e1] group-hover:bg-[#1e293b] transition-colors duration-500" />
        <span className="text-[16px] font-serif text-[#1e293b] group-hover:translate-x-1 transition-transform duration-500">{country}</span>
     </div>
     <span className="text-[10px] uppercase tracking-[0.2em] font-black text-[#64748b] opacity-40 group-hover:opacity-100 transition-opacity duration-500">{time}</span>
  </div>
);

export default App;
