import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StepShell } from '../ui/StepShell';
import { AudioRecorder } from '../ui/AudioRecorder';

interface Step3AudioProps {
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
  onBack: () => void;
  onNext: () => void;
  onEnded: () => void;
}

export const Step3Audio: React.FC<Step3AudioProps> = ({
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
  onBack,
  onNext,
  onEnded,
}) => {
  return (
    <StepShell
      stepNumber={3}
      title={
        <>
          Add <span className="italic font-light">voice.</span>
        </>
      }
      footer={
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            className="text-[9px] uppercase tracking-[0.4em] font-black text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            className="flex items-center text-[10px] uppercase tracking-[0.3em] font-black text-[#1e293b] group hover:opacity-70 transition-opacity"
            style={{ gap: '0.75rem' }}
          >
            <span>Final Message</span>
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      }
    >
      <div className="flex-1 flex flex-col justify-center items-center" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
        <AudioRecorder
          isRecording={isRecording}
          recordingTime={recordingTime}
          audioBlobUrl={audioBlobUrl}
          audioBase64={audioBase64}
          isPlayingStep3={isPlayingStep3}
          onStartRecording={onStartRecording}
          onStopRecording={onStopRecording}
          onTogglePlayback={onTogglePlayback}
          onRemove={onRemove}
          onImport={onImport}
          audioInputRef={audioInputRef}
          step3AudioRef={step3AudioRef}
        />
        <audio
          ref={step3AudioRef}
          src={audioBlobUrl || undefined}
          onEnded={onEnded}
          className="hidden"
          preload="auto"
        />
      </div>
    </StepShell>
  );
};

