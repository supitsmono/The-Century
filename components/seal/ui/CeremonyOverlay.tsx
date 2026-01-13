import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Sparkles, Lock } from 'lucide-react';

interface CeremonyOverlayProps {
  sealingPhase: 'idle' | 'intent' | 'preserving' | 'complete';
  sealProgress: number;
}

export const CeremonyOverlay: React.FC<CeremonyOverlayProps> = ({ sealingPhase, sealProgress }) => {
  return (
    <AnimatePresence>
      {sealingPhase !== 'idle' && (
        <motion.div
          key="sealing-overlay"
          className="fixed inset-0 z-[70] pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: sealingPhase === 'preserving' || sealingPhase === 'complete' ? 1 : 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{ pointerEvents: sealingPhase === 'preserving' || sealingPhase === 'complete' ? 'auto' : 'none' }}
        >
          {/* Background blur during preserving phase */}
          {sealingPhase === 'preserving' && (
            <motion.div
              className="absolute inset-0 bg-[#f5f2ed]"
              style={{
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)'
              }}
            />
          )}
          
          {/* Radial light from center during preserving - ENHANCED WARM CEREMONIAL ACCENT */}
          {sealingPhase === 'preserving' && (
            <>
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.15) 0%, rgba(212, 165, 116, 0.08) 40%, transparent 70%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1]
                }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 3, ease: [0.16, 1, 0.3, 1], repeat: Infinity }}
              />
              {/* Secondary glow */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.08) 0%, transparent 60%)',
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.4, 0.6]
                }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
          
          {/* Progress indicator during preserving */}
          {sealingPhase === 'preserving' && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Outer rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 border-2 rounded-full relative"
                style={{ borderColor: 'rgba(30, 41, 59, 0.1)', borderTopColor: 'rgba(30, 41, 59, 0.4)' }}
              >
                {/* Progress ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, rgba(30, 41, 59, 0.3) 0%, rgba(30, 41, 59, 0.3) ${sealProgress}%, transparent ${sealProgress}%, transparent 100%)`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
              
              {/* Center icon with pulse */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Fingerprint size={28} style={{ color: 'rgba(30, 41, 59, 0.5)' }} strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              
              {/* Sparkle effects */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(30, 41, 59, 0.4)',
                    top: '50%',
                    left: '50%',
                  }}
                  animate={{
                    x: [`${Math.cos(i * Math.PI / 2) * 60}px`, `${Math.cos(i * Math.PI / 2) * 80}px`],
                    y: [`${Math.sin(i * Math.PI / 2) * 60}px`, `${Math.sin(i * Math.PI / 2) * 80}px`],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut",
                  }}
                />
              ))}
              
              {/* Progress text */}
              <motion.div
                className="flex flex-col items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
              >
                <motion.p
                  className="text-[11px] uppercase tracking-[0.35em] font-black text-[#1E293B]"
                  style={{ lineHeight: 1.5 }}
                >
                  Sealing...
                </motion.p>
                <motion.p
                  className="text-[9px] uppercase tracking-[0.30em] font-bold text-[#64748B]"
                  style={{ lineHeight: 1.5 }}
                  key={Math.floor(sealProgress / 10)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {Math.round(sealProgress)}%
                </motion.p>
              </motion.div>
            </motion.div>
          )}
          
          {/* Completion phase - REVELATION EFFECT */}
          {sealingPhase === 'complete' && (
            <>
              <motion.div
                className="absolute inset-0 bg-[#f5f2ed]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              />
              
              {/* Celebration glow */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.2) 0%, rgba(212, 165, 116, 0.1) 50%, transparent 80%)',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 2, opacity: [0, 1, 0] }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
              
              {/* Success icon reveal */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4"
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <motion.div
                  className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center"
                  style={{ boxShadow: '0 8px 32px rgba(30, 41, 59, 0.3)' }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 8px 32px rgba(30, 41, 59, 0.3)',
                      '0 12px 48px rgba(30, 41, 59, 0.4)',
                      '0 8px 32px rgba(30, 41, 59, 0.3)'
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Lock size={28} className="text-white" strokeWidth={2} fill="currentColor" />
                </motion.div>
                
                {/* Sparkles around icon */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'rgba(30, 41, 59, 0.6)',
                      top: '50%',
                      left: '50%',
                    }}
                    animate={{
                      x: `${Math.cos(i * Math.PI / 3) * 50}px`,
                      y: `${Math.sin(i * Math.PI / 3) * 50}px`,
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                
                <motion.p
                  className="text-[12px] uppercase tracking-[0.40em] font-black text-[#1E293B] mt-4"
                  style={{ lineHeight: 1.5 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  Sealed for Eternity
                </motion.p>
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
