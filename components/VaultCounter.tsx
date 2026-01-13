
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VaultCounterProps {
  value: number;
}

export const VaultCounter: React.FC<VaultCounterProps> = ({ value }) => {
  const digits = value.toLocaleString().split('');

  return (
    <div className="flex items-center justify-center" style={{ gap: '0.75rem' }}>
      {digits.map((digit, index) => {
        if (digit === ',' || digit === '.') {
          return (
            <span 
              key={`sep-${index}`} 
              className="font-serif text-3xl md:text-5xl self-end"
              style={{ color: 'rgba(30, 41, 59, 0.25)', marginBottom: '0.5rem' }}
            >
              {digit}
            </span>
          );
        }
        return (
          <motion.div 
            key={`slot-${index}`}
            className="relative w-[0.72em] h-[1.2em] bg-white/80 backdrop-blur-sm border border-[#e2e8f0]/60 rounded-lg flex items-center justify-center overflow-hidden"
            style={{ 
              fontSize: 'min(10rem, 12vw)',
              boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.04), 0 2px 4px -2px rgba(0, 0, 0, 0.02)',
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <AnimatePresence mode="popLayout">
              <motion.span
                key={digit}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ 
                  duration: 0.9, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="font-serif text-[#1e293b] tabular-nums tracking-tighter"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.015), transparent)' }} />
            {/* Subtle pulse effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none rounded-lg"
              animate={{
                opacity: [0, 0.03, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.1), transparent)',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
};
