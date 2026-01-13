import React from 'react';
import { motion } from 'framer-motion';
import { TimeLeft } from '../types';
import { GlobalClock } from './GlobalClock';
import { Section } from './Section';
import { PageContainer } from './layout/PageContainer';
import { ProcessSection } from './ProcessSection';
import { Lock, Edit3, Globe, Database, Shield, Landmark, History, Radio, Sparkles, Heart, Star, Sun } from 'lucide-react';

interface HomePageProps {
  timeLeft: TimeLeft | null;
  navigate: (path: string) => void;
}

const ConceptItem: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center" style={{ gap: '1.5rem' }}>
    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#faf8f4] border border-[#e8ddd0] flex items-center justify-center text-[#334155]" style={{ marginBottom: '1rem' }}>
      <Icon size={20} strokeWidth={1.5} />
    </div>
    <div style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
      <h3 className="font-serif text-xl md:text-2xl lg:text-3xl text-[#1e293b]" style={{ marginBottom: '1.5rem' }}>{title}</h3>
      <p className="text-[14px] md:text-[15px] lg:text-base text-[#475569] leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
  </div>
);

export const HomePage: React.FC<HomePageProps> = ({ timeLeft, navigate }) => {
  return (
    <>
      <Section className="flex flex-col justify-center text-center relative bg-[#f2efe9] min-h-screen overflow-hidden" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
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

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10"
          style={{ marginLeft: 'auto', marginRight: 'auto', willChange: 'opacity' }}
        >
          <div className="text-center flex flex-col items-center">
            <p className="font-serif italic text-2xl md:text-4xl lg:text-5xl text-[#334155] tracking-normal leading-relaxed max-w-4xl mx-auto font-medium" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
              "Time flies. Don't let your story disappear."
            </p>
            <h1 className="font-serif text-7xl md:text-9xl lg:text-[10rem] leading-[1.05] tracking-tight text-[#1e293b]" style={{ marginBottom: '5rem' }}>
              Your existence. <br/><span className="italic">Forever archived.</span>
            </h1>
          </div>
          
          <div className="flex items-center justify-center relative z-10" style={{ marginTop: '0' }}>
            <div className="relative flex items-center justify-center w-full">
              <div className="relative z-50 w-full pointer-events-none">
                <div className="pointer-events-auto">
                  <GlobalClock />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center" style={{ marginTop: '5rem', gap: '1rem' }}>
            <p className="text-[13px] md:text-[14px] text-[#64748b] uppercase tracking-[0.2em] font-black text-center max-w-2xl">
              Create your time capsule. Seal it for 100 years. Let the future discover your story.
            </p>
            <button 
              onClick={() => navigate('/seal/1')}
              className="cursor-pointer px-10 py-3.5 border-2 border-[#1e293b] text-[#1e293b] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#1e293b] hover:text-white hover:scale-105 transition-all duration-300"
            >
              Create Your Capsule
            </button>
          </div>
        </motion.div>
      </Section>

      <Section className="bg-[#f5f2ed] border-y border-[#e8ddd0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <PageContainer>
          <div>
            <div className="text-center" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>The Concept</span>
              <h2 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>
                <span className="block">Create your message.</span>
                <span className="italic block mt-2">Locked for 100 years.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3" style={{ gap: '2.5rem' }}>
              <ConceptItem 
                icon={Edit3}
                title="1. Create your capsule"
                description="Write a message, upload photos, and record a video. Tell the future who you are and what the world looks like today."
              />
              <ConceptItem 
                icon={Lock}
                title="2. Seal the Vault"
                description="Lock your capsule in our digital Vault. Once sealed, it disappears. No one—not even us—can open it until the timer is finished."
              />
              <ConceptItem 
                icon={Globe}
                title="3. The Great Reveal"
                description="When the 100-year countdown reaches zero, the Vault opens. Your legacy is finally shared with the people of the future."
              />
            </div>
          </div>
        </PageContainer>
      </Section>

      <Section className="bg-[#f0e9e0] border-b border-[#e0d6ca] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <PageContainer>
          <div className="text-center" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>Survival Protocol</span>
            <h2 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>
              How we last <span className="italic">a century.</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3" style={{ gap: '2.5rem' }}>
            <div className="text-center">
              <div className="flex justify-center" style={{ marginBottom: '1.5rem' }}><Database className="text-[#334155]" size={36} strokeWidth={1} /></div>
              <h4 className="font-serif text-xl md:text-2xl text-[#1e293b]" style={{ marginBottom: '1.5rem' }}>Secure Storage</h4>
              <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed">Your capsule is stored securely in the cloud with regular backups, ensuring your message survives for generations.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center" style={{ marginBottom: '1.5rem' }}><Shield className="text-[#334155]" size={36} strokeWidth={1} /></div>
              <h4 className="font-serif text-xl md:text-2xl text-[#1e293b]" style={{ marginBottom: '1.5rem' }}>The Silence Protocol</h4>
              <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed">Your capsule is encrypted and locked until the countdown ends. We cannot access it, and neither can anyone else.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center" style={{ marginBottom: '1.5rem' }}><Landmark className="text-[#334155]" size={36} strokeWidth={1} /></div>
              <h4 className="font-serif text-xl md:text-2xl text-[#1e293b]" style={{ marginBottom: '1.5rem' }}>Long-term Preservation</h4>
              <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed">Your contribution helps ensure your capsule is maintained and preserved for the next century, adapting to future technologies.</p>
            </div>
          </div>
        </PageContainer>
      </Section>

      <div className="w-full bg-[#e8e1d6] text-[#1e293b] overflow-hidden relative border-y border-[#ddd4c4]" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center" style={{ marginLeft: '6rem', marginRight: '6rem', gap: '6rem' }}>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] flex items-center text-[#475569]" style={{ gap: '0.75rem' }}>
                <Heart size={14} className="text-[#64748b]" /> 
                Your story matters to the future
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] flex items-center gap-3 text-[#475569]">
                <Star size={14} className="text-[#64748b]" /> 
                Leave your mark on history
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] flex items-center gap-3 text-[#475569]">
                <Sun size={14} className="text-[#64748b]" /> 
                Become a time traveler
              </span>
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] flex items-center gap-3 text-[#475569]">
                <Sparkles size={14} className="text-[#64748b]" /> 
                Your voice will echo forever
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Emotional Story Section - The Future's Classroom */}
      <Section className="bg-[#f5f1eb] border-y border-[#e8ddd0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <PageContainer>
          <div className="text-center" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>The Future's Classroom</span>
            <h2 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>
              When history books aren't enough.
            </h2>
          </div>

          <div className="text-center flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto"
              style={{ marginBottom: '4rem', marginTop: '2rem', willChange: 'opacity' }}
            >
              <p className="font-serif text-lg md:text-xl lg:text-2xl text-[#334155] leading-relaxed italic">
                "Imagine a classroom in 2125. Instead of reading about the past in textbooks, students will watch your video. They'll see your photos. They'll feel what it was like to be alive in your time."
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 w-full max-w-4xl mx-auto" style={{ marginBottom: '4rem', gap: '2.5rem' }}>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="text-left"
                style={{ willChange: 'opacity' }}
              >
                <div className="flex items-center" style={{ marginBottom: '1.25rem', gap: '0.75rem' }}>
                  <History size={22} className="text-[#1e293b]" strokeWidth={1.5} />
                  <h3 className="font-serif text-xl md:text-2xl text-[#1e293b]">Learn from Real Lives</h3>
                </div>
                <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed">
                  Future generations won't just learn dates and facts. They'll understand what it felt like to live through your era—your struggles, your joys, your perspective on the world as it was.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ willChange: 'opacity' }}
              >
                <div className="flex items-center" style={{ marginBottom: '1.25rem', gap: '0.75rem' }}>
                  <Radio size={24} className="text-[#1e293b]" strokeWidth={1.5} />
                  <h3 className="font-serif text-xl md:text-2xl text-[#1e293b]">Travel Back in Time</h3>
                </div>
                <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed">
                  Your capsule becomes a time machine. Through your words, photos, and video, people 100 years from now will experience your world firsthand. You become their teacher, their window into the past.
                </p>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-3xl mx-auto text-center"
              style={{ paddingTop: '4rem', marginTop: '2rem', marginBottom: '2rem', borderTop: '1px solid #e8ddd0', willChange: 'opacity' }}
            >
              <p className="font-serif text-xl md:text-2xl lg:text-3xl text-[#1e293b] leading-relaxed" style={{ marginBottom: '2.5rem' }}>
                This is your chance to become part of history. Not as a footnote, but as a video that will echo through time.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => navigate('/seal/1')}
                  className="cursor-pointer px-12 py-4 border-2 border-[#1e293b] text-[#1e293b] text-[12px] uppercase tracking-[0.2em] font-medium hover:bg-[#1e293b] hover:text-white hover:scale-105 transition-all duration-300"
                >
                  Become Part of History
                </button>
              </div>
            </motion.div>
          </div>
        </PageContainer>
      </Section>

      <ProcessSection />

      <Section className="bg-[#f0e9e0] min-h-screen flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
        <PageContainer className="max-w-4xl">
          <div className="text-center" style={{ marginTop: '2rem' }}>
            <p className="text-[#334155] font-serif italic text-3xl md:text-5xl lg:text-6xl leading-snug opacity-80">
              "We are the echoes of a world they will never know. Speak now, or be forgotten by time."
            </p>
            <button onClick={() => navigate('/seal/1')} className="cursor-pointer text-[12px] uppercase tracking-[0.25em] font-medium text-[#1e293b] border-b-2 border-[#1e293b] pb-2 hover:opacity-70 hover:scale-105 hover:border-[#334155] transition-all duration-300 outline-none" style={{ marginTop: '2rem' }}>Seal Your Capsule</button>
          </div>
        </PageContainer>
      </Section>
    </>
  );
};

