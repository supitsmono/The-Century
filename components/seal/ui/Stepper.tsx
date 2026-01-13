import React from 'react';
import { motion } from 'framer-motion';
import { getReducedMotionTransition } from '../data/variants';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div 
      className="relative w-full" 
      role="progressbar" 
      aria-valuenow={currentStep} 
      aria-valuemin={1} 
      aria-valuemax={totalSteps} 
      aria-label={`Phase ${currentStep} of ${totalSteps}`}
    >
      {/* Background track with subtle glow */}
      <div 
        className="w-full rounded-full overflow-hidden relative"
        style={{
          height: '4px',
          backgroundColor: '#E2E8F0',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Progress fill with gradient and glow */}
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: 'linear-gradient(90deg, #1E293B 0%, #334155 100%)',
            boxShadow: '0 0 8px rgba(30, 41, 59, 0.3), 0 0 4px rgba(30, 41, 59, 0.2)',
          }}
          initial={false}
          animate={{
            width: `${progress}%`,
          }}
          transition={getReducedMotionTransition({ 
            duration: 0.6, 
            ease: [0.16, 1, 0.3, 1] 
          })}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute top-0 left-0 h-full w-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
            }}
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
