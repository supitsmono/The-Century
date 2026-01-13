import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Lock, Archive, Clock, FileText, Camera, Mic, ChevronDown, Shield, Globe, Heart, BookOpen, Image } from 'lucide-react';
import { VaultCounter } from './VaultCounter';
import { Section } from './Section';
import { getReducedMotionTransition } from './seal/data/variants';

interface VaultPageProps {
  liveCount: number;
  navigate: (path: string) => void;
}

export const VaultPage: React.FC<VaultPageProps> = ({ liveCount, navigate }) => {
  const transition = getReducedMotionTransition({ duration: 0.3, ease: [0.16, 1, 0.3, 1] });
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowScrollHint(false);
      } else {
        setShowScrollHint(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#f5f2ed]">
      {/* Subtle grain texture overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      <div className="relative z-10">
        {/* 1. VAULT HERO SECTION */}
        <Section className="flex flex-col items-center justify-center relative min-h-screen" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={transition}
              className="text-center"
              style={{ willChange: 'opacity' }}
            >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition, delay: 0.1 }}
              className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block"
              style={{ marginBottom: '1.5rem' }}
            >
              THE VAULT
            </motion.span>

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition, delay: 0.2 }}
              className="font-serif text-[#1e293b] tracking-tight leading-tight"
              style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}
            >
              <span className="block">A collective archive</span>
              <span className="italic block mt-2">for the future.</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...transition, delay: 0.3 }}
              className="mx-auto w-full max-w-4xl"
              style={{ marginLeft: 'auto', marginRight: 'auto', marginTop: '2rem' }}
            >
              <p className="font-serif text-lg md:text-xl text-[#475569] leading-relaxed" style={{ marginBottom: '1.5rem' }}>
                Every capsule is locked until 2125. Once you seal it, it cannot be changed.
              </p>
              <p className="text-[14px] md:text-[15px] text-[#64748b] leading-relaxed">
                The archive keeps growing as more people add their stories, creating a collection from around the world.
              </p>
            </motion.div>
            </motion.div>
          </div>

          {/* Scroll Indicator - Fade gradient + subtle hint */}
          <div className="relative" style={{ marginTop: '5rem', paddingTop: '3rem' }}>
            {/* Fade-out gradient at bottom of hero section to suggest more content */}
            <div 
              className="absolute top-0 left-0 right-0 h-48 pointer-events-none z-0"
              style={{
                background: 'linear-gradient(to bottom, transparent, rgba(245, 242, 237, 0.2), rgba(245, 242, 237, 0.6), rgba(245, 242, 237, 0.95), rgba(245, 242, 237, 1))',
              }}
            />

            {/* Subtle scroll hint */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: showScrollHint ? 1 : 0, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              className="flex flex-col items-center relative z-10"
              style={{ gap: '0.75rem' }}
            >
              <motion.div
                animate={{
                  y: [0, 8, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  ...getReducedMotionTransition({ duration: 0 })
                }}
                className="flex flex-col items-center cursor-pointer group"
                style={{ gap: '0.75rem' }}
                onClick={() => {
                  const counterSection = document.querySelector('[data-vault-counter]');
                  if (counterSection) {
                    const rect = counterSection.getBoundingClientRect();
                    const offset = 100; // Offset to show more of the counter
                    window.scrollTo({
                      top: window.scrollY + rect.top - offset,
                      behavior: 'smooth'
                    });
                  }
                }}
              >
                <ChevronDown 
                  size={22} 
                  className="text-[#64748b] opacity-60 group-hover:opacity-80 group-hover:text-[#1e293b] transition-all duration-200" 
                  strokeWidth={1.5} 
                />
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-[#64748b] opacity-50 group-hover:opacity-70 transition-opacity duration-200">
                  Continue exploring
                </span>
              </motion.div>
            </motion.div>
          </div>
        </Section>

        {/* 2. CAPSULE COUNTER (KEY ELEMENT) */}
        <Section className="relative flex flex-col justify-center bg-[#f5f2ed] overflow-hidden" style={{ paddingTop: '4rem', paddingBottom: '4rem', minHeight: '60vh' }}>
          {/* Animated Wave Pattern Background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <motion.div
              className="absolute"
            style={{
                width: '140%',
                height: '140%',
                top: '-20%',
                left: '-20%',
              }}
              animate={{
                x: [0, -100, 0],
                y: [0, 30, 0],
                opacity: [0.25, 0.35, 0.25],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <g opacity="0.9">
                  {/* Main wave bands - overlapping wavy lines */}
                  <path d="M-100,400 Q150,250 400,400 T900,400 T1400,400" stroke="#1e293b" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <path d="M-100,380 Q150,230 400,380 T900,380 T1400,380" stroke="#334155" strokeWidth="1.2" fill="none" opacity="0.45" />
                  <path d="M-100,420 Q150,470 400,420 T900,420 T1400,420" stroke="#334155" strokeWidth="1.2" fill="none" opacity="0.45" />
                  <path d="M-100,360 Q150,210 400,360 T900,360 T1400,360" stroke="#475569" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M-100,440 Q150,490 400,440 T900,440 T1400,440" stroke="#475569" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M-100,340 Q150,190 400,340 T900,340 T1400,340" stroke="#64748b" strokeWidth="0.8" fill="none" opacity="0.35" />
                  <path d="M-100,460 Q150,510 400,460 T900,460 T1400,460" stroke="#64748b" strokeWidth="0.8" fill="none" opacity="0.35" />
                  <path d="M-100,320 Q150,170 400,320 T900,320 T1400,320" stroke="#94a3b8" strokeWidth="0.6" fill="none" opacity="0.3" />
                  <path d="M-100,480 Q150,530 400,480 T900,480 T1400,480" stroke="#94a3b8" strokeWidth="0.6" fill="none" opacity="0.3" />
                  {/* Additional overlapping waves for depth */}
                  <path d="M-50,390 Q200,280 450,390 T950,390 T1450,390" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M-50,410 Q200,520 450,410 T950,410 T1450,410" stroke="#334155" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M0,385 Q250,275 500,385 T1000,385 T1500,385" stroke="#475569" strokeWidth="0.8" fill="none" opacity="0.35" />
                  <path d="M0,415 Q250,525 500,415 T1000,415 T1500,415" stroke="#475569" strokeWidth="0.8" fill="none" opacity="0.35" />
                </g>
              </svg>
            </motion.div>
          </div>

          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10" data-vault-counter style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center"
              style={{ willChange: 'opacity' }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-[11px] uppercase tracking-[0.4em] font-black text-[#64748b] text-center"
                style={{ willChange: 'opacity', marginBottom: '2rem' }}
              >
                Capsules Created
              </motion.p>
              
                <VaultCounter value={liveCount} />
                
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
                className="text-[13px] md:text-[14px] font-serif text-[#475569] text-center italic"
                style={{ willChange: 'opacity', marginTop: '2.5rem', maxWidth: '32rem', lineHeight: 1.6 }}
              >
                Join thousands. Save your story.
                </motion.p>
            </motion.div>
          </div>
        </Section>

        {/* 3. ARCHIVAL CONTEXT SECTION */}
        <Section className="bg-[#f5f2ed] border-y border-[#e8ddd0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{ willChange: 'opacity' }}
            >
              <div className="text-center" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
                <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>
                  How It Works
                </span>
                <h2 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>
                  How we last <span className="italic">a century.</span>
                </h2>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2.5rem' }}>
                <ArchivalStatement
                  icon={Lock}
                  title="Locked Until 2125"
                  statement="Your capsule stays sealed until the countdown timer finishes. No one can open it before then."
                />
                <ArchivalStatement
                  icon={Shield}
                  title="Safe and Protected"
                  statement="Once you seal your capsule, it cannot be changed or removed. It's locked forever."
                />
                <ArchivalStatement
                  icon={Clock}
                  title="Preserved for 100 Years"
                  statement="We keep your capsule safe for one hundred years, so it's still there for people in 2125."
                />
                <ArchivalStatement
                  icon={Globe}
                  title="Join Thousands of Stories"
                  statement="Your capsule joins a collection of stories from people all around the world."
                />
                <ArchivalStatement
                  icon={Heart}
                  title="Your Personal Legacy"
                  statement="People in the future will see your photos, watch your video, and read what you wrote."
                />
                <ArchivalStatement
                  icon={BookOpen}
                  title="Part of History"
                  statement="You become part of a record that shows what life was like in our time."
                />
              </div>
            </motion.div>
          </div>
        </Section>

        {/* 4. ARCHIVAL SHELVES */}
        <Section className="bg-[#f0e9e0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
              style={{ marginTop: '2rem', marginBottom: '4rem', willChange: 'opacity' }}
            >
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>
                What You Can Add
              </span>
              <h2 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>
                <span className="italic">What goes into your capsule</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '2.5rem' }}>
              {archivalShelves.map((shelf, index) => (
                <ArchivalShelfCard
                  key={`shelf-${shelf.title}-${index}`}
                  icon={shelf.icon}
                  title={shelf.title}
                  microcopy={shelf.microcopy}
                  index={index}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* 5. PRIMARY CALL TO ACTION */}
        <Section className="bg-[#f0e9e0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
              style={{ marginTop: '2rem', willChange: 'opacity' }}
            >
              <p className="font-serif text-2xl md:text-3xl text-[#475569] leading-relaxed italic" style={{ marginBottom: '4rem', maxWidth: '36rem', marginLeft: 'auto', marginRight: 'auto' }}>
              Ready to add your story?
            </p>

              <div className="flex flex-col sm:flex-row items-center justify-center" style={{ gap: '1.5rem' }}>
              <button
                onClick={() => navigate('/seal/1')}
                  className="cursor-pointer px-12 py-4 bg-[#1e293b] text-white text-[11px] uppercase tracking-[0.3em] font-black hover:bg-black transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 flex items-center group"
                  style={{ gap: '0.75rem' }}
              >
                <span>Seal Your Capsule</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>

              <button
                  onClick={() => navigate('/')}
                  className="cursor-pointer text-[11px] uppercase tracking-[0.3em] font-black text-[#64748b] hover:text-[#1e293b] transition-colors duration-200 border-b border-transparent hover:border-[#64748b] pb-1"
              >
                Back to Home
              </button>
            </div>
            </motion.div>
          </div>
        </Section>
      </div>
    </div>
  );
};

// Archival Statement Component
interface ArchivalStatementProps {
  icon: React.ElementType;
  title: string;
  statement: string;
}

const ArchivalStatement: React.FC<ArchivalStatementProps> = ({ icon: Icon, title, statement }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ willChange: 'opacity' }}
    >
      <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="rounded-sm bg-[#f8fafc] border border-[#e2e8f0]" style={{ padding: '0.5rem' }}>
          <Icon size={20} className="text-[#334155]" strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-xl md:text-2xl text-[#1e293b] tracking-tight">
          {title}
        </h3>
      </div>
      <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed" style={{ paddingLeft: '2.75rem' }}>
        {statement}
      </p>
    </motion.div>
  );
};

// Archival Shelf Card Component
interface ArchivalShelfCardProps {
  icon: React.ElementType;
  title: string;
  microcopy: string;
  index: number;
}

const archivalShelves = [
  {
    icon: Camera,
    title: 'Photos',
    microcopy: 'Your favorite pictures, saved for the future to see.',
  },
  {
    icon: Mic,
    title: 'Video',
    microcopy: 'Record up to 30 seconds of video telling your story, so they can see and hear you.',
  },
  {
    icon: FileText,
    title: 'Your Message',
    microcopy: 'Write a message that people will read one hundred years from now.',
  },
  {
    icon: Heart,
    title: 'Memories',
    microcopy: 'The moments that matter to you, saved exactly as you remember them.',
  },
  {
    icon: BookOpen,
    title: 'Your Story',
    microcopy: 'Tell them who you are, where you came from, and what you cared about.',
  },
  {
    icon: Image,
    title: 'Your Certificate',
    microcopy: 'Get a certificate showing you joined this archive for the future.',
  },
] as const;

const ArchivalShelfCard: React.FC<ArchivalShelfCardProps> = ({ icon: Icon, title, microcopy, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2, margin: "0px 0px -100px 0px" });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, []);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={prefersReducedMotion 
        ? { duration: 0 }
        : { 
            duration: 0.3, 
            ease: "easeOut",
            delay: index * 0.05
          }
      }
      className="group bg-white/80 border border-[#e2e8f0] rounded-sm cursor-default"
      style={{ padding: '2.5rem', willChange: 'opacity' }}
    >
      <div>
        <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="rounded-sm bg-[#f8fafc] border border-[#e2e8f0]" style={{ padding: '0.5rem' }}>
            <Icon size={22} className="text-[#334155] group-hover:text-[#1e293b] transition-colors duration-200" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-xl md:text-2xl text-[#1e293b] tracking-tight">
            {title}
          </h3>
        </div>
        <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed font-serif italic" style={{ paddingLeft: '2.75rem' }}>
          {microcopy}
        </p>
      </div>
    </motion.div>
  );
};

