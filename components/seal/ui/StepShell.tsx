import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { containerVariants, getReducedMotionTransition } from '../data/variants';
import { Stepper } from './Stepper';

interface StepShellProps {
  stepNumber: number;
  totalSteps?: number;
  title: React.ReactNode;
  microcopy?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
}

export const StepShell: React.FC<StepShellProps> = ({ 
  stepNumber, 
  totalSteps = 6,
  title,
  microcopy,
  children,
  footer,
  onBack,
  onNext,
  canGoBack = true,
  canGoNext = true,
  nextLabel,
  backLabel = "Back",
  nextDisabled = false,
  backDisabled = false,
}) => {
  const phaseIndicator = `Phase ${stepNumber}`;
  
  return (
    <motion.div 
      key={`step${stepNumber}`} 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      exit="exit" 
      className="flex flex-col h-full w-full min-h-0"
      style={{ minWidth: 0 }}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#f5f2ed] backdrop-blur-sm border-b border-[#d4c9bc] mx-0" style={{ paddingTop: '2.5rem', paddingBottom: '1.5rem', marginBottom: '0' }}>
        <div style={{ paddingLeft: '2rem', paddingRight: '2rem', gap: '1rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between" style={{ gap: '1rem' }}>
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#1E293B] font-black">
              {phaseIndicator}
            </span>
          </div>
          <Stepper currentStep={stepNumber} totalSteps={totalSteps} />
          <motion.h3 
            className="font-serif text-3xl md:text-5xl lg:text-6xl tracking-tight leading-tight text-[#1E293B]"
            style={{ 
              letterSpacing: '-0.02em',
              fontVariationSettings: '"wght" 350',
              color: '#1E293B',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h3>
          {microcopy && (
            <motion.p
              className="text-xs md:text-sm text-[#475569] font-serif italic"
              style={{ 
                lineHeight: 1.5,
                opacity: 1,
                marginTop: '0.75rem'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {microcopy}
            </motion.p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0 relative flex flex-col">
        <div className="flex-1 flex flex-col items-center" style={{ paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem' }}>
          <div className="w-full max-w-3xl flex flex-col" style={{ gap: '2.5rem', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 z-30 bg-[#f5f2ed] backdrop-blur-sm border-t border-[#d4c9bc] mx-0" style={{ paddingTop: '1.5rem', paddingBottom: '1.5rem', marginTop: '2rem' }}>
        <div style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
        {footer || (
          <div className="flex justify-between items-center">
            {canGoBack && onBack ? (
              <motion.button
                onClick={onBack}
                disabled={backDisabled}
                className={`flex items-center text-[9px] uppercase tracking-[0.40em] font-black transition-colors duration-200 ${
                  backDisabled
                    ? 'text-[#94A3B8] cursor-not-allowed opacity-60'
                    : 'bg-transparent text-[#475569] hover:text-[#1E293B] hover:border-[#B8A895] cursor-pointer border border-transparent rounded-sm group'
                }`}
                style={!backDisabled ? { padding: '0.25rem 0.5rem', gap: '0.375rem' } : { gap: '0.375rem' }}
                whileHover={backDisabled ? {} : { scale: 1.05 }}
                whileTap={backDisabled ? {} : { scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                aria-label={backLabel}
              >
                {!backDisabled && (
                  <ArrowLeft 
                    size={14} 
                    className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" 
                    aria-hidden="true"
                  />
                )}
                <span>{backLabel}</span>
              </motion.button>
            ) : (
              <div className="w-16" />
            )}
            {canGoNext && onNext ? (
              <motion.button
                onClick={onNext}
                disabled={nextDisabled}
                className={`flex items-center text-[10px] uppercase tracking-[0.30em] font-black transition-all duration-200 ${
                  nextDisabled
                    ? 'bg-[#E8E0D6] text-[#94A3B8] cursor-not-allowed opacity-60'
                    : 'bg-[#1E293B] text-white group hover:opacity-92 cursor-pointer rounded-sm'
                }`}
                style={{ gap: '0.625rem', ...(nextDisabled ? {} : { padding: '0.5rem 1rem' }) }}
                whileHover={nextDisabled ? {} : { opacity: 0.92 }}
                whileTap={nextDisabled ? {} : { scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                aria-label={nextLabel || 'Next step'}
                aria-disabled={nextDisabled}
              >
                <span>{nextLabel || 'Next'}</span>
                {!nextDisabled && (
                  <ArrowRight 
                    size={16} 
                    className="group-hover:translate-x-1 transition-transform duration-200 ease-out" 
                    aria-hidden="true"
                  />
                )}
              </motion.button>
            ) : (
              <div className="w-20" />
            )}
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
};

