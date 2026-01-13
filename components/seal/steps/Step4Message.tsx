import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { StepShell } from '../ui/StepShell';

interface Step4MessageProps {
  message: string;
  onMessageChange: (message: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const Step4Message: React.FC<Step4MessageProps> = ({
  message,
  onMessageChange,
  onBack,
  onNext,
}) => {
  return (
    <StepShell
      stepNumber={4}
      title={
        <>
          Final <span className="italic font-light">words.</span>
        </>
      }
      microcopy="Write a message that will be opened in 100 years. Share your thoughts, hopes, or a message for the future."
      footer={
        <div className="flex justify-between items-center">
          <motion.button
            onClick={onBack}
            className="flex items-center text-[9px] uppercase tracking-[0.40em] font-black bg-transparent text-[#475569] hover:text-[#1E293B] hover:border-[#B8A895] transition-colors duration-200 border border-transparent rounded-sm cursor-pointer group"
            style={{ padding: '0.25rem 0.5rem', gap: '0.375rem' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
            <span>Back</span>
          </motion.button>
          <motion.button
            onClick={onNext}
            className="flex items-center text-[10px] uppercase tracking-[0.30em] font-black bg-[#1E293B] text-white group hover:opacity-92 transition-all duration-200 ease-out rounded-sm cursor-pointer"
            style={{ gap: '0.625rem', padding: '0.5rem 1rem' }}
            whileHover={{ scale: 1.02, opacity: 0.92 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span>Review Manifest</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
          </motion.button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-h-0" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="flex items-center justify-end">
          <p
            className={`text-[10px] uppercase tracking-[0.15em] font-black transition-colors duration-200 ${
              message.length > 4000
                ? 'text-[#B45309]'
                : message.length > 3000
                  ? 'text-[#1E293B]'
                  : message.length > 1500
                    ? 'text-[#475569]'
                    : 'text-[#64748B]'
            }`}
            style={{
              opacity: 1,
              lineHeight: 1.5,
            }}
          >
            {message.length.toLocaleString()} / 5,000 characters
          </p>
        </div>
        <div className="relative" style={{ flex: 1, minHeight: '400px', maxHeight: '500px' }}>
          <textarea
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Your message for 2125..."
            className="message-textarea w-full h-full bg-[#F8F7F3] border-b border-[#D4C9BC] focus:border-[#B8A895] text-base md:text-lg lg:text-xl font-serif font-light tracking-tight focus:ring-0 focus:outline-none placeholder:text-[#94A3B8] leading-relaxed text-[#1E293B] transition-all duration-200 ease-out"
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              letterSpacing: '-0.02em',
              color: '#1E293B',
              lineHeight: 1.65,
              boxShadow: 'none',
              borderBottom: '1px solid #D4C9BC',
              transition: 'border-color 200ms ease-out, box-shadow 200ms ease-out',
              resize: 'none',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollBehavior: 'smooth',
            }}
            onFocus={(e) => {
              e.target.style.borderBottomColor = '#B8A895';
              e.target.style.boxShadow = '0 0 0 3px rgba(184, 168, 149, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderBottomColor = '#D4C9BC';
              e.target.style.boxShadow = 'none';
            }}
            maxLength={5000}
          />
        </div>
      </div>
    </StepShell>
  );
};

