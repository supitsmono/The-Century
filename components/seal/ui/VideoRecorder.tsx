import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Pause, X, Video as VideoIcon } from 'lucide-react';

interface VideoRecorderProps {
  videoBlobUrl: string | null;
  videoBase64: string | null;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onRemove: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onViewerOpenChange?: (isOpen: boolean) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  videoBlobUrl,
  videoBase64,
  isPlaying,
  onTogglePlayback,
  onRemove,
  onImport,
  videoInputRef,
  videoRef,
  onViewerOpenChange,
}) => {
  const [showVideoViewer, setShowVideoViewer] = useState(false);

  // Block body scroll when video viewer is open
  useEffect(() => {
    if (showVideoViewer) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [showVideoViewer]);

  const handlePlayClick = () => {
    if (!isPlaying) {
      setShowVideoViewer(true);
      onViewerOpenChange?.(true);
      // Start playback after modal opens
      setTimeout(() => {
        onTogglePlayback();
      }, 100);
    } else {
      // If already playing, just pause
      onTogglePlayback();
      setShowVideoViewer(false);
      onViewerOpenChange?.(false);
    }
  };

  const handleCloseViewer = () => {
    setShowVideoViewer(false);
    onViewerOpenChange?.(false);
    // Pause video when closing
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      onTogglePlayback();
    }
  };

  return (
    <>
      <div className="w-full flex flex-col items-center" style={{ gap: '1.5rem' }}>
        {videoBase64 ? (
          <div className="w-full flex flex-col items-center" style={{ gap: '1rem' }}>
            <div className="flex items-center" style={{ gap: '0.75rem' }}>
              <motion.button
                onClick={handlePlayClick}
                className={`flex items-center border-2 transition-all duration-200 ease-out rounded-full cursor-pointer ${
                  isPlaying
                    ? 'bg-[#1E293B] border-[#1E293B] text-white'
                    : 'bg-[#F8F7F3] border-[#D4C9BC] text-[#1E293B] hover:border-[#B8A895] hover:bg-[#F7F5F0]'
                }`}
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                  padding: '0.625rem 1.25rem',
                  lineHeight: 1.5,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isPlaying ? 'bg-white/10' : 'bg-[#F7F5F0]'
                }`}>
                  {isPlaying ? (
                    <Pause size={12} fill="currentColor" />
                  ) : (
                    <Play size={12} fill="currentColor" style={{ marginLeft: '0.125rem' }} />
                  )}
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.20em]" style={{ lineHeight: 1.5, marginLeft: '0.5rem' }}>
                  {isPlaying ? 'Pause' : 'Play Video'}
                </span>
              </motion.button>

              <button
                onClick={onRemove}
                className="border-2 border-[#D4C9BC] rounded-full hover:border-[#B45309]/40 hover:bg-[#F7F5F0] transition-all duration-200 ease-out active:scale-95 cursor-pointer"
                style={{ 
                  padding: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                  lineHeight: 1.5,
                }}
              >
                <X size={16} className="text-[#64748B] transition-transform duration-200" />
              </button>
            </div>

            <div>
              <input
                type="file"
                hidden
                accept="video/*"
                ref={videoInputRef}
                onChange={onImport}
              />
              <button
                onClick={() => videoInputRef.current?.click()}
                className="text-[8px] uppercase tracking-[0.25em] font-black text-[#64748B] hover:text-[#475569] transition-colors duration-200 cursor-pointer"
                style={{ lineHeight: 1.5 }}
              >
                Replace Video
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center" style={{ gap: '1.5rem' }}>
            <div className="flex flex-col items-center" style={{ gap: '1rem' }}>
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.7, 0.9, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#F8F7F3',
                  border: '2px solid #E2E8F0',
                }}
              >
                <VideoIcon size={36} className="text-[#64748B]" strokeWidth={1.5} />
              </motion.div>
              <div className="flex flex-col items-center" style={{ gap: '0.5rem' }}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#475569] text-center" style={{ lineHeight: 1.5 }}>
                  Add Your Video Message
                </p>
                <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-[#64748B] text-center max-w-md" style={{ lineHeight: 1.6 }}>
                  Record a personal message to be opened in 100 years
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center" style={{ gap: '0.75rem' }}>
              <input
                type="file"
                hidden
                accept="video/*"
                ref={videoInputRef}
                onChange={onImport}
              />
              <label
                className="cursor-pointer"
                style={{
                  border: '1px solid #D4C9BC',
                  borderRadius: '2px',
                  backgroundColor: '#F8F7F3',
                  padding: '0.625rem 1.25rem',
                  fontSize: '9px',
                  letterSpacing: '0.25em',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: '#64748B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#B8A895';
                  e.currentTarget.style.backgroundColor = '#F7F5F0';
                  e.currentTarget.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#D4C9BC';
                  e.currentTarget.style.backgroundColor = '#F8F7F3';
                  e.currentTarget.style.color = '#64748B';
                }}
                onClick={() => videoInputRef.current?.click()}
              >
                <Upload size={14} strokeWidth={2} />
                Upload Video
              </label>
              <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#475569] text-center" style={{ lineHeight: 1.5 }}>
                Maximum file size: 1GB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Video Viewer Modal */}
      <AnimatePresence>
        {showVideoViewer && videoBlobUrl && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={handleCloseViewer} 
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center cursor-zoom-out backdrop-blur-md print:hidden pointer-events-auto"
            style={{ padding: '2rem' }}
          >
            <motion.video 
              ref={videoRef}
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              src={videoBlobUrl} 
              controls
              className="max-w-full max-h-full object-contain shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
              onEnded={() => {
                handleCloseViewer();
              }}
              onPlay={() => {
                if (!isPlaying) {
                  onTogglePlayback();
                }
              }}
              onPause={() => {
                if (isPlaying) {
                  onTogglePlayback();
                }
              }}
              autoPlay
            />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleCloseViewer();
              }}
              aria-label="Close video viewer"
              className="absolute top-8 right-8 text-white bg-white/10 backdrop-blur-lg hover:bg-white/20 transition-all duration-200 ease-out rounded-full border border-white/20 cursor-pointer"
              style={{ padding: '1rem', zIndex: 201 }}
            >
              <X size={24} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
