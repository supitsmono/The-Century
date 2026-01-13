import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, StopCircle, CheckCircle2, Play, Pause, RotateCcw, Upload } from 'lucide-react';

interface AudioRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  audioBlobUrl: string | null;
  audioBase64: string | null;
  isPlayingStep3: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onRemove: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audioInputRef: React.RefObject<HTMLInputElement>;
  step3AudioRef: React.RefObject<HTMLAudioElement>;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isRecording,
  recordingTime,
  audioBlobUrl,
  audioBase64,
  isPlayingStep3,
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onRemove,
  onImport,
  audioInputRef,
  step3AudioRef,
}) => {
  return (
    <div className="w-full max-w-lg flex flex-col items-center" style={{ gap: '2rem' }}>
      {/* Recording Button */}
      <div className="relative flex flex-col items-center" style={{ gap: '1rem' }}>
        {/* Idle state: gentle breathing animation */}
        {!isRecording && !audioBase64 && (
          <motion.div
            animate={{
              scale: [1, 1.02, 1],
              opacity: [0.05, 0.08, 0.05]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[#1e293b] rounded-full blur-[40px] -z-10"
          />
        )}
        {/* Recording state: slower, more intentional pulse */}
        {isRecording && (
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }} 
            className="absolute inset-0 bg-[#1e293b] rounded-full blur-[60px] -z-10" 
          />
        )}
        <motion.button 
          onClick={isRecording ? onStopRecording : onStartRecording} 
          className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
            isRecording 
              ? 'bg-[#1e293b] text-white border-[#1e293b] shadow-xl shadow-[#1e293b]/30' 
              : audioBase64 
                ? 'bg-white text-[#334155] border-[#cbd5e1] hover:border-[#1e293b] hover:shadow-lg' 
                : 'bg-white text-[#1e293b] border-[#e2e8f0] hover:border-[#1e293b] hover:shadow-lg'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {isRecording ? (
            <StopCircle size={32} strokeWidth={1.5} />
          ) : audioBase64 ? (
            <CheckCircle2 size={32} strokeWidth={1.5} className="text-[#10b981]" />
          ) : (
            <Mic size={32} strokeWidth={1.5} />
          )}
        </motion.button>
        {isRecording && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </div>
      
      {/* Timer */}
      {isRecording && (
        <motion.div 
          className="w-full max-w-xs"
          style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div 
            className="flex items-baseline justify-center"
            style={{ gap: '0.5rem' }}
            key={recordingTime}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-5xl md:text-7xl font-serif tabular-nums text-[#1e293b] tracking-tight font-light">
              {recordingTime.toString().padStart(2, '0')}
            </span>
            <span className="text-xl md:text-2xl text-[#64748b] font-serif">s</span>
          </motion.div>
          <div className="w-full h-1 bg-[#e2e8f0] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#1e293b] via-[#334155] to-[#1e293b] rounded-full" 
              initial={{ width: 0 }} 
              animate={{ width: `${(recordingTime / 60) * 100}%` }}
              transition={{ duration: 0.3, ease: "linear" }}
            />
          </div>
          <p className="text-[8px] uppercase tracking-[0.3em] font-black text-[#64748b] opacity-50 text-center">
            Max 60 seconds
          </p>
        </motion.div>
      )}
      
      {/* Status Message */}
      {!isRecording && !audioBase64 && (
        <p className="text-xs md:text-sm text-[#64748b] text-center max-w-md">
          Record up to 60 seconds of your voice, or upload an audio file
        </p>
      )}
      
      {/* Audio Preview */}
      {!isRecording && audioBlobUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm border-t border-[#e2e8f0]"
          style={{ gap: '1rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column' }}
        >
          <p className="text-[8px] uppercase tracking-[0.3em] font-black text-[#64748b] text-center">
            Recording Ready
          </p>
          <div className="flex items-center justify-center" style={{ gap: '0.75rem' }}>
            <button 
              onClick={onTogglePlayback}
              className={`flex items-center border-2 transition-all active:scale-95 rounded-full ${
                isPlayingStep3 
                  ? 'bg-[#1e293b] border-[#1e293b] text-white shadow-lg' 
                  : 'bg-white border-[#e2e8f0] text-[#1e293b] hover:border-[#334155] hover:shadow-md'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isPlayingStep3 ? 'bg-white/10' : 'bg-[#f1f5f9]'
              }`}>
                {isPlayingStep3 ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                    <Play size={14} fill="currentColor" style={{ marginLeft: '0.125rem' }} />
                )}
              </div>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                {isPlayingStep3 ? 'Pause' : 'Play'}
              </span>
            </button>
            <button
              onClick={onRemove}
              className="border-2 border-[#e2e8f0] rounded-full hover:border-red-300 hover:bg-red-50 transition-all active:scale-95"
              style={{ padding: '0.75rem' }}
            >
              <RotateCcw size={16} className="text-[#64748b]" />
            </button>
          </div>
        </motion.div>
      )}
      
      {/* Upload Option */}
      {!isRecording && (
        <div style={{ paddingTop: '0.5rem' }}>
          <input 
            type="file" 
            hidden 
            accept="audio/*" 
            ref={audioInputRef} 
            onChange={onImport} 
          />
          <button 
            onClick={() => audioInputRef.current?.click()} 
            className="flex items-center text-[9px] uppercase tracking-[0.2em] font-black text-[#64748b] hover:text-[#1e293b] transition-all border border-[#e2e8f0] rounded-full hover:bg-white hover:border-[#1e293b] active:scale-95"
            style={{ gap: '0.5rem', padding: '0.625rem 1.5rem' }}
          >
            <Upload size={12} /> 
            {audioBase64 ? 'Replace File' : 'Upload Audio File'}
          </button>
        </div>
      )}
    </div>
  );
};

