
import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles, Lock, Star } from 'lucide-react';
import { PageContainer } from './layout/PageContainer';

export const ProcessSection: React.FC = () => {
  return (
    <div className="bg-[#f5f2ed] min-h-screen relative overflow-hidden flex flex-col justify-center" style={{ paddingTop: '6rem', paddingBottom: '6rem' }}>
      <PageContainer>
        <div style={{ marginTop: '2rem' }}>
        <div className="text-center" style={{ marginBottom: '4rem' }}>
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-[#64748b] font-black block" style={{ marginBottom: '1.5rem' }}>Simple Steps</span>
          <h3 className="font-serif text-[#1e293b] tracking-tight leading-tight" style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '4rem' }}>Establishing Your Legacy.</h3>
        </div>

        <div className="grid md:grid-cols-4 relative" style={{ gap: '2.5rem' }}>
          <div className="hidden md:block absolute top-[40px] left-[10%] right-[10%] h-[1px] bg-[#e8ddd0]" />
          
          <ProcessStep 
            number="01" 
            icon={User} 
            title="Introduction" 
            desc="Enter your name and details. Your identity will be recorded for future generations." 
          />
          <ProcessStep 
            number="02" 
            icon={Sparkles} 
            title="Commemoration" 
            desc="Upload photos and record your voice. Share your story with the future." 
          />
          <ProcessStep 
            number="03" 
            icon={Lock} 
            title="The Seal" 
            desc="Lock your capsule. It stays sealed until the countdown reaches its end." 
          />
          <ProcessStep 
            number="04" 
            icon={Star} 
            title="Establishment" 
            desc="You're all set. Your legacy is now preserved in the global archive." 
          />
        </div>
      </div>
      </PageContainer>
    </div>
  );
};

const ProcessStep: React.FC<{ number: string, icon: React.ElementType, title: string, desc: string }> = ({ number, icon: Icon, title, desc }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true, amount: 0.4 }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="flex flex-col items-center text-center relative z-10 group"
    style={{ willChange: 'opacity', gap: '1.5rem' }}
  >
    <div className="w-20 h-20 rounded-full bg-[#faf8f4] border border-[#e8ddd0] flex items-center justify-center group-hover:border-[#1e293b] group-hover:bg-[#f5f2ed] transition-all duration-500 shadow-sm group-hover:shadow-md">
       <Icon size={24} strokeWidth={1.5} className="text-[#64748b] group-hover:text-[#1e293b] transition-colors" />
    </div>
    <div style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ gap: '0.25rem', display: 'flex', flexDirection: 'column', marginBottom: '0.75rem' }}>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">{number}</span>
        <h4 className="font-serif text-2xl text-[#1e293b]" style={{ marginBottom: '1.5rem' }}>{title}</h4>
      </div>
      <p className="text-[14px] md:text-[15px] text-[#475569] leading-relaxed max-w-[200px] mx-auto font-medium tracking-tight">
        {desc}
      </p>
    </div>
  </motion.div>
);
