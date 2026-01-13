import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface VideoViewerProps {
  videoUrl: string | null;
  onClose: () => void;
  onViewerOpenChange?: (isOpen: boolean) => void;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ videoUrl, onClose, onViewerOpenChange }) => {
  // Block body scroll when viewer is open
  useEffect(() => {
    if (videoUrl) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      onViewerOpenChange?.(true);

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
        onViewerOpenChange?.(false);
      };
    }
  }, [videoUrl, onViewerOpenChange]);

  if (!videoUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={onClose}
      >
        <motion.button
          onClick={onClose}
          className="absolute top-8 right-8 z-[10001] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label="Close video viewer"
        >
          <X size={20} className="text-white" />
        </motion.button>
        
        <motion.div
          className="relative w-full h-full flex items-center justify-center p-8"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <video
            src={videoUrl}
            controls
            autoPlay
            className="max-w-full max-h-full rounded-sm"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onEnded={onClose}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

