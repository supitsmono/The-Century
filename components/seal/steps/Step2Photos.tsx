import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StepShell } from '../ui/StepShell';
import { PhotoGrid } from '../ui/PhotoGrid';
import { getReducedMotionTransition } from '../data/variants';

interface Step2PhotosProps {
  photos: string[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  onSelect?: (photo: string) => void;
  onBack: () => void;
  onNext: () => void;
  errorMessage?: string | null;
}

export const Step2Photos: React.FC<Step2PhotosProps> = ({
  photos,
  onUpload,
  onRemove,
  onSelect,
  onBack,
  onNext,
  errorMessage,
}) => {
  return (
    <StepShell
      stepNumber={2}
      totalSteps={6}
      title={
        <>
          Add <span className="italic font-light">photos.</span>
        </>
      }
      microcopy="Upload up to 10 photos to preserve your memories."
      onBack={onBack}
      onNext={onNext}
      canGoBack={true}
      canGoNext={true}
      backLabel="Back"
      nextLabel="Record Video"
      backDisabled={false}
      nextDisabled={false}
    >
      <div className="flex-1 flex flex-col" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={getReducedMotionTransition({ duration: 0.3 })}
              className="bg-[#F7F5F0] border border-[#B45309]/40 rounded-sm p-3.5"
              role="alert"
              aria-live="polite"
              style={{
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
              }}
            >
              <p className="text-[9px] uppercase tracking-[0.15em] font-black text-[#B45309]" style={{ lineHeight: 1.5 }}>
                {errorMessage}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <PhotoGrid photos={photos} onUpload={onUpload} onRemove={onRemove} onSelect={onSelect} />
      </div>
    </StepShell>
  );
};

