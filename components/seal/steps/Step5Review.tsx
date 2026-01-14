import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Lock, Fingerprint, ArrowLeft, Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { StepShell } from '../ui/StepShell';
import { VideoViewer } from '../ui/VideoViewer';
import { containerVariants, itemVariants, getReducedMotionTransition } from '../data/variants';
import { uploadPhotos, uploadVideo, UploadStatus, LocalPhotoItem, LocalVideoItem } from '../../../lib/mediaUpload';
import { LocalPhoto, LocalVideo } from '../hooks/useWizardState';

interface Step5ReviewProps {
  formData: {
    name: string;
    country: string;
    town: string;
    message: string;
  };
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  // Phase 3B: New state structure
  photosLocal: LocalPhoto[];
  videoLocal: LocalVideo | null;
  photosPaths: string[];
  videoPath: string | null;
  effectiveCapsuleId: string | null;
  // Deprecated: Keep for backward compatibility (read-only)
  photos: string[];
  videoBlobUrl: string | null;
  videoBase64: string | null;
  isPlaying: boolean;
  currentMetadata: {
    year: number;
    month: string;
    day: number;
    time: string;
  };
  calculateAge: () => number;
  onPhotoSelect: (photo: string) => void;
  onTogglePlayback: () => void;
  onDiscard: () => void;
  onBack: () => void;
  onSeal: () => void;
  isSubmitting: boolean;
  reviewVideoRef: React.RefObject<HTMLVideoElement>;
  onViewerOpenChange?: (isOpen: boolean) => void;
  // Phase 3B: Actions for updating uploaded paths
  onPhotosUploaded: (paths: string[]) => void;
  onVideoUploaded: (path: string | null) => void;
}

export const Step5Review: React.FC<Step5ReviewProps> = ({
  formData,
  dobDay,
  dobMonth,
  dobYear,
  photosLocal,
  videoLocal,
  photosPaths,
  videoPath,
  effectiveCapsuleId,
  photos,
  videoBlobUrl,
  videoBase64,
  isPlaying,
  currentMetadata,
  calculateAge,
  onPhotoSelect,
  onTogglePlayback,
  onDiscard,
  onBack,
  onSeal,
  isSubmitting,
  reviewVideoRef,
  onViewerOpenChange,
  onPhotosUploaded,
  onVideoUploaded,
}) => {
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  
  // Phase 3B: Upload statuses (local component state, not wizard state)
  const [photoStatusById, setPhotoStatusById] = useState<Record<string, UploadStatus>>({});
  const [videoStatus, setVideoStatus] = useState<UploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Ref guard for double-click protection (bulletproof race condition prevention)
  const isUploadingRef = useRef(false);
  
  // Mount guard: prevent state updates after component unmounts
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Phase 3B: Upload handler
  const handleUploadMedia = useCallback(async () => {
    // Early return guard: prevent double-click/race conditions
    if (isUploadingRef.current) return;
    if (!effectiveCapsuleId) {
      setUploadError('Capsule ID missing. Please go back to step 4 to create your capsule.');
      return;
    }
    
    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Upload photos (only failed ones, or all if none uploaded yet)
      const photosToUpload: LocalPhotoItem[] = photosLocal.filter(photo => {
        const status = photoStatusById[photo.id];
        return !status || status === 'failed';
      }).map(photo => ({
        file: photo.file,
        previewUrl: photo.previewUrl,
        id: photo.id,
      }));
      
      if (photosToUpload.length > 0) {
        const photoResult = await uploadPhotos(
          effectiveCapsuleId,
          photosToUpload,
          photosPaths, // Existing paths for idempotency
          {
            onStatus: (id, status) => {
              if (isMountedRef.current) {
                setPhotoStatusById(prev => ({ ...prev, [id]: status }));
              }
            },
            onError: (id, error) => {
              console.error(`Photo upload failed for ${id}:`, error);
              if (isMountedRef.current) {
                setPhotoStatusById(prev => ({ ...prev, [id]: 'failed' }));
              }
            },
            // onOverall: only for UI state (labels), not for paths processing
            // Paths are processed AFTER await (see below)
          }
        );
        
        // Update wizard state with new paths (AFTER await, when result exists)
        if (isMountedRef.current && photoResult.paths.length > 0) {
          const allPaths = [...photosPaths, ...photoResult.paths];
          onPhotosUploaded(allPaths);
        }
        
        if (isMountedRef.current && photoResult.failures && photoResult.failures.length > 0) {
          setUploadError(`Some photos failed to upload. ${photoResult.failures.length} failed.`);
        }
      }
      
      // Upload video (only if not already uploaded and local exists)
      if (videoLocal && !videoPath) {
        const videoToUpload: LocalVideoItem = {
          file: videoLocal.file,
          previewUrl: videoLocal.previewUrl,
          id: videoLocal.id,
        };
        const videoResult = await uploadVideo(
          effectiveCapsuleId,
          videoToUpload,
          videoPath, // Existing path for idempotency
          {
            onStatus: (id, status) => {
              if (isMountedRef.current) {
                setVideoStatus(status);
              }
            },
            onError: (id, error) => {
              console.error(`Video upload failed:`, error);
              if (isMountedRef.current) {
                setVideoStatus('failed');
              }
            },
            // onOverall: only for UI state (labels), not for paths processing
            // Path is processed AFTER await (see below)
          }
        );
        
        // Update wizard state with video path (AFTER await, when result exists)
        if (isMountedRef.current && videoResult.path) {
          onVideoUploaded(videoResult.path);
        }
        
        if (isMountedRef.current && videoResult.error) {
          setUploadError(`Video upload failed: ${videoResult.error.message}`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (isMountedRef.current) {
        setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
      }
      isUploadingRef.current = false; // Reset ref guard (always, even if unmounted)
    }
  }, [effectiveCapsuleId, photosLocal, photosPaths, videoLocal, videoPath, photoStatusById, onPhotosUploaded, onVideoUploaded]);
  
  // Determine effective media for display (local previews + backend paths)
  const effectivePhotos = photosLocal.map(p => p.previewUrl);
  const effectiveVideoUrl = videoLocal?.previewUrl || videoBlobUrl;
  
  // Count uploaded media
  const uploadedPhotoCount = photosPaths.length;
  const hasUploadedVideo = !!videoPath;

  return (
    <>
      <VideoViewer 
        videoUrl={isVideoViewerOpen ? effectiveVideoUrl : null}
        onClose={() => setIsVideoViewerOpen(false)}
        onViewerOpenChange={onViewerOpenChange}
      />
    <StepShell
      stepNumber={5}
      title={
        <>
          Check your <span className="italic font-light">manifest.</span>
        </>
      }
      footer={
        <div style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center" style={{ gap: '1rem' }}>
              <motion.button
                onClick={onDiscard}
                className="text-[9px] uppercase tracking-[0.35em] font-black text-[#B45309] hover:text-[#DC2626] cursor-pointer"
                style={{ lineHeight: 1.5, padding: '0.25rem 0.5rem' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                Delete
              </motion.button>
              <motion.button
                onClick={onBack}
                className="flex items-center text-[9px] uppercase tracking-[0.40em] font-black bg-transparent text-[#475569] hover:text-[#1E293B] hover:border-[#B8A895] transition-colors duration-200 border border-transparent rounded-sm cursor-pointer group"
                style={{ padding: '0.25rem 0.5rem', gap: '0.375rem' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
                <span>Back</span>
              </motion.button>
            </div>
            <motion.div className="relative">
              <motion.button
                disabled={isSubmitting}
                onClick={onSeal}
                className={`relative text-white text-[10px] md:text-[11px] uppercase tracking-[0.30em] font-black overflow-hidden rounded-sm transition-all duration-200 ease-out ${
                  isSubmitting ? 'bg-[#1E293B] opacity-90 cursor-wait' : 'bg-[#1E293B] hover:opacity-92 cursor-pointer'
                }`}
                style={{
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                  lineHeight: 1.5,
                }}
                whileHover={isSubmitting ? {} : { scale: 1.01, opacity: 0.92 }}
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
                transition={getReducedMotionTransition({ duration: 0.2, ease: [0.16, 1, 0.3, 1] })}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent)' }}
                  initial={{ x: '-100%' }}
                  whileHover={!isSubmitting ? {
                    x: '200%',
                    transition: { duration: 1.2, ease: "easeInOut" }
                  } : {}}
                />
                <span className="relative z-10 flex items-center" style={{ gap: '0.75rem' }}>
                  {isSubmitting ? 'Sealing...' : 'Seal My Message'}
                  <motion.div
                    animate={isSubmitting ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 2, repeat: isSubmitting ? Infinity : 0, ease: "linear" }}
                  >
                    {isSubmitting ? (
                      <Fingerprint size={14} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </motion.div>
                </span>
                {isSubmitting && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-white/30"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4.5, ease: "linear" }}
                  />
                )}
              </motion.button>
            </motion.div>
          </div>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[#64748B] font-black text-center" style={{ opacity: 1, lineHeight: 1.5 }}>
            Once sealed, your message cannot be changed
          </p>
        </div>
      }
    >
      <div className="flex-1 flex flex-col min-h-0" style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}>
        <motion.div
          className="flex-1 overflow-y-auto review-content-scroll"
          style={{ gap: '2rem', display: 'flex', flexDirection: 'column' }}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Personal Info Card */}
          <motion.div
            className="bg-[#F7F5F0] border border-[#D4C9BC] rounded-sm"
            style={{
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
            variants={itemVariants}
            whileHover={{ 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06)',
              y: -2,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '2rem' }}>
              <motion.div style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }} variants={itemVariants}>
                <span className="text-[8px] uppercase tracking-[0.35em] font-black text-[#64748B]" style={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>Name</span>
                <p className="font-serif text-2xl md:text-3xl text-[#1E293B] leading-tight" style={{ lineHeight: 1.3, fontWeight: 350 }}>{formData.name || 'Anonymous'}</p>
              </motion.div>
              <motion.div style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }} variants={itemVariants}>
                <span className="text-[8px] uppercase tracking-[0.35em] font-black text-[#64748B]" style={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>Location</span>
                <p className="font-serif text-2xl md:text-3xl text-[#1E293B] leading-tight" style={{ lineHeight: 1.3, fontWeight: 350 }}>{formData.town}, {formData.country}</p>
              </motion.div>
              <motion.div style={{ gap: '0.5rem', display: 'flex', flexDirection: 'column' }} variants={itemVariants}>
                <span className="text-[8px] uppercase tracking-[0.35em] font-black text-[#64748B]" style={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>Birth Date</span>
                <p className="font-serif text-2xl md:text-3xl text-[#1E293B] leading-tight" style={{ lineHeight: 1.3, fontWeight: 350 }}>{dobDay} {dobMonth} {dobYear}</p>
                <p className="text-[9px] uppercase tracking-[0.25em] font-black text-[#475569]" style={{ lineHeight: 1.5, marginTop: '0.25rem' }}>Age: {calculateAge()} years</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Artifacts Card */}
          <motion.div
            className="bg-[#F7F5F0] border border-[#D4C9BC] rounded-sm"
            style={{
              padding: '2rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
            variants={itemVariants}
            whileHover={{ 
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06)',
              y: -2,
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="flex justify-between items-center">
                <span className="text-[8px] uppercase tracking-[0.35em] font-black text-[#64748B]" style={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>Artifacts</span>
                <div className="flex items-center" style={{ gap: '0.75rem' }}>
                  <span className="text-[9px] font-black text-[#1E293B] uppercase tracking-[0.25em]" style={{ opacity: 1, lineHeight: 1.5 }}>
                    {effectivePhotos.length} {effectivePhotos.length === 1 ? 'Photo' : 'Photos'} {effectiveVideoUrl ? '• 1 Video' : ''}
                  </span>
                  {(uploadedPhotoCount > 0 || hasUploadedVideo) && (
                    <span className="text-[8px] font-black text-[#059669] uppercase tracking-[0.20em] flex items-center" style={{ gap: '0.25rem' }}>
                      <CheckCircle2 size={10} />
                      Uploaded
                    </span>
                  )}
                </div>
              </div>
              
              {/* Guard message if no capsule ID */}
              {!effectiveCapsuleId && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-sm p-3">
                  <p className="text-[9px] font-black text-[#B45309] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
                    ⚠️ Make your capsule first via step 4 before uploading media.
                  </p>
                </div>
              )}
              
              {/* Upload button */}
              {effectiveCapsuleId && (effectivePhotos.length > 0 || effectiveVideoUrl) && (
                <div className="flex items-center" style={{ gap: '0.75rem' }}>
                  <motion.button
                    onClick={handleUploadMedia}
                    disabled={isUploading || (uploadedPhotoCount >= effectivePhotos.length && hasUploadedVideo)}
                    className={`flex items-center text-[9px] uppercase tracking-[0.30em] font-black rounded-sm transition-all duration-200 ${
                      isUploading || (uploadedPhotoCount >= effectivePhotos.length && hasUploadedVideo)
                        ? 'bg-[#94A3B8] text-white cursor-not-allowed opacity-70'
                        : 'bg-[#1E293B] text-white hover:opacity-92 cursor-pointer'
                    }`}
                    style={{ padding: '0.5rem 1rem', gap: '0.5rem' }}
                    whileHover={isUploading || (uploadedPhotoCount >= effectivePhotos.length && hasUploadedVideo) ? {} : { scale: 1.02 }}
                    whileTap={isUploading || (uploadedPhotoCount >= effectivePhotos.length && hasUploadedVideo) ? {} : { scale: 0.98 }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : uploadedPhotoCount >= effectivePhotos.length && hasUploadedVideo ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Uploaded</span>
                      </>
                    ) : (
                      <>
                        <Upload size={12} />
                        <span>Upload Media</span>
                      </>
                    )}
                  </motion.button>
                  {uploadError && (
                    <span className="text-[8px] font-black text-[#DC2626] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
                      {uploadError}
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center" style={{ gap: '1rem' }}>
                {effectivePhotos.slice(0, 5).map((src, i) => {
                  const photo = photosLocal[i];
                  const status = photo ? photoStatusById[photo.id] : null;
                  const isUploaded = photo && photosPaths.some(path => path.includes(photo.id) || i < uploadedPhotoCount);
                  
                  return (
                    <motion.div
                      key={photo?.id || i}
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.1, zIndex: 10, rotate: -2, y: -4 }}
                      onClick={() => onPhotoSelect(src)}
                      className="relative w-20 h-20 md:w-24 md:h-24 bg-[#F7F5F0] border border-[#D4C9BC] overflow-hidden cursor-zoom-in group rounded-sm"
                      style={{
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 ease-out" />
                      {/* Status indicator */}
                      {status && (
                        <div className="absolute top-1 right-1 z-10">
                          {status === 'finalized' || isUploaded ? (
                            <CheckCircle2 size={12} className="text-[#059669]" fill="white" />
                          ) : status === 'failed' ? (
                            <XCircle size={12} className="text-[#DC2626]" fill="white" />
                          ) : status === 'uploading' ? (
                            <Loader2 size={12} className="text-[#1E293B] animate-spin" />
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {effectivePhotos.length > 5 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-20 h-20 md:w-24 md:h-24 bg-[#F7F5F0] border-2 border-dashed border-[#D4C9BC] flex items-center justify-center rounded-sm"
                    style={{
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <span className="text-sm font-black text-[#64748B]" style={{ lineHeight: 1.5 }}>+{effectivePhotos.length - 5}</span>
                  </motion.div>
                )}
                {effectiveVideoUrl && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-20 h-20 md:w-24 md:h-24 border-2 border-[#D4C9BC] rounded-sm overflow-hidden bg-[#1E293B] group cursor-pointer"
                    onClick={() => setIsVideoViewerOpen(true)}
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <video
                      ref={reviewVideoRef}
                      src={effectiveVideoUrl || undefined}
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300"
                      muted
                      loop={false}
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm bg-black/40">
                        <Play size={16} fill="white" className="ml-0.5" />
                      </div>
                    </div>
                    {/* Video status indicator */}
                    {videoStatus && (
                      <div className="absolute top-1 right-1 z-10">
                        {videoStatus === 'finalized' || hasUploadedVideo ? (
                          <CheckCircle2 size={12} className="text-[#059669]" fill="white" />
                        ) : videoStatus === 'failed' ? (
                          <XCircle size={12} className="text-[#DC2626]" fill="white" />
                        ) : videoStatus === 'uploading' ? (
                          <Loader2 size={12} className="text-white animate-spin" />
                        ) : null}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Message Card */}
          {formData.message && (
            <motion.div
              className="bg-[#F7F5F0] border border-[#D4C9BC] rounded-sm"
              style={{
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
              variants={itemVariants}
              whileHover={{ 
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.06)',
                y: -2,
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-[8px] uppercase tracking-[0.35em] font-black text-[#64748B]" style={{ lineHeight: 1.5, letterSpacing: '0.08em' }}>Message</span>
              <div className="bg-white/50 border border-[#D4C9BC]/50 rounded-sm" style={{
                padding: '1.5rem',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
              }}>
                <p 
                  className="font-serif text-base md:text-lg lg:text-xl leading-relaxed text-[#1E293B]" 
                  style={{ 
                    lineHeight: 1.7, 
                    fontWeight: 300,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    width: '100%',
                    maxWidth: '100%',
                  }}
                >
                  "{formData.message}"
                </p>
              </div>
            </motion.div>
          )}

          {/* Timestamp */}
          <motion.div
            className="flex items-center justify-center gap-3 py-2"
            variants={itemVariants}
            style={{ lineHeight: 1.5 }}
          >
            <div className="w-2 h-2 rounded-full bg-[#475569]" style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#64748B]" style={{ opacity: 1, lineHeight: 1.5 }}>
              Prepared: {currentMetadata.day} {currentMetadata.month} {currentMetadata.year} — {currentMetadata.time}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </StepShell>
    </>
  );
};

