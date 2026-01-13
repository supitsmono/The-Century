import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { StepShell } from '../ui/StepShell';
import { VideoRecorder } from '../ui/VideoRecorder';

interface Step3VideoProps {
  videoBlobUrl: string | null;
  videoBase64: string | null;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onRemove: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoInputRef: React.RefObject<HTMLInputElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  onBack: () => void;
  onNext: () => void;
  onViewerOpenChange?: (isOpen: boolean) => void;
}

export const Step3Video: React.FC<Step3VideoProps> = ({
  videoBlobUrl,
  videoBase64,
  isPlaying,
  onTogglePlayback,
  onRemove,
  onImport,
  videoInputRef,
  videoRef,
  onBack,
  onNext,
  onViewerOpenChange,
}) => {
  return (
    <StepShell
      stepNumber={3}
      title={
        <>
          Add your <span className="italic font-light">video.</span>
        </>
      }
      microcopy="Upload a video file to preserve your message. Maximum file size: 1GB."
      footer={
        <div className="flex justify-between items-center">
          <motion.button
            onClick={onBack}
            className="flex items-center text-[9px] uppercase tracking-[0.40em] font-black bg-transparent text-[#475569] hover:text-[#1E293B] hover:border-[#B8A895] transition-colors duration-200 border border-transparent rounded-sm cursor-pointer group"
            style={{ padding: '0.25rem 0.5rem' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
            <span>Back</span>
          </motion.button>
          <button
            onClick={onNext}
            disabled={!videoBase64}
            className={`flex items-center text-[10px] uppercase tracking-[0.30em] font-black group transition-all duration-200 ease-out rounded-sm ${
              !videoBase64
                ? 'bg-[#E8E0D6] text-[#94A3B8] cursor-not-allowed opacity-60'
                : 'bg-[#1E293B] text-white hover:opacity-92 cursor-pointer'
            }`}
          >
            <span>Final Message</span>
            {videoBase64 && (
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200 ease-out" />
            )}
          </button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col justify-center items-center" style={{ display: 'flex', flexDirection: 'column' }}>
        <VideoRecorder
          videoBlobUrl={videoBlobUrl}
          videoBase64={videoBase64}
          isPlaying={isPlaying}
          onTogglePlayback={onTogglePlayback}
          onRemove={onRemove}
          onImport={onImport}
          videoInputRef={videoInputRef}
          videoRef={videoRef}
          onViewerOpenChange={onViewerOpenChange}
        />
      </div>
    </StepShell>
  );
};

