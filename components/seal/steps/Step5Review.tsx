import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Lock, Fingerprint, ArrowLeft, Upload, CheckCircle2, XCircle, Loader2, CreditCard, RefreshCw, ArrowUpIcon } from 'lucide-react';
import { StepShell } from '../ui/StepShell';
import { VideoViewer } from '../ui/VideoViewer';
import { containerVariants, itemVariants, getReducedMotionTransition } from '../data/variants';
import { uploadPhotos, uploadVideo, UploadStatus, LocalPhotoItem, LocalVideoItem } from '../../../lib/mediaUpload';
import { LocalPhoto, LocalVideo } from '../hooks/useWizardState';
import { getCapsule, createCheckoutSession, sealCapsule, resetCapsuleToDraft, CapsuleResponse } from '../../../lib/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
// Button component removed - using motion.button instead for better compatibility

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
  // Phase 3C: Navigation callback
  onNavigateToStep6?: () => void;
}

// Phase 3C: Capsule state type
type CapsuleState = 'draft' | 'pending_payment' | 'paid' | 'sealed';

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
  onNavigateToStep6,
}) => {
  const [isVideoViewerOpen, setIsVideoViewerOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Phase 3C: State-driven controller state
  // Initialize to 'draft' if no capsule ID, otherwise null (will be loaded)
  const [capsuleState, setCapsuleState] = useState<CapsuleState | null>(effectiveCapsuleId ? null : 'draft');
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [isSealing, setIsSealing] = useState(false);
  
  // Phase 3B: Upload statuses (local component state, not wizard state)
  const [photoStatusById, setPhotoStatusById] = useState<Record<string, UploadStatus>>({});
  const [videoStatus, setVideoStatus] = useState<UploadStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Ref guard for double-click protection
  const isUploadingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Phase 3C: Hydrate capsule state on mount and when capsule ID changes
  useEffect(() => {
    if (!effectiveCapsuleId) {
      setCapsuleState('draft'); // No capsule yet = draft
      return;
    }

    const hydrateState = async () => {
      setIsLoadingState(true);
      try {
        const capsule = await getCapsule(effectiveCapsuleId);
        setCapsuleState(capsule.state as CapsuleState);
        
        // Phase 3C: Handle success/cancel URL params
        const paymentStatus = searchParams.get('payment');
        if (paymentStatus === 'success') {
          if (capsule.state === 'pending_payment') {
            // Payment submitted, start polling (will auto-seal when state becomes 'paid')
            startPolling();
          }
          // Note: If state is already 'paid', the useEffect will handle auto-sealing
        } else if (paymentStatus === 'cancelled') {
          // Payment cancelled - reset capsule to draft state
          if (capsule.state === 'pending_payment') {
            try {
              await resetCapsuleToDraft(effectiveCapsuleId);
              setCapsuleState('draft');
              setPaymentError(null);
              // Clear the cancelled param from URL
              const newSearchParams = new URLSearchParams(searchParams);
              newSearchParams.delete('payment');
              const newUrl = newSearchParams.toString() 
                ? `${window.location.pathname}?${newSearchParams.toString()}`
                : window.location.pathname;
              navigate(newUrl, { replace: true });
            } catch (error) {
              console.error('Failed to reset capsule to draft:', error);
              setPaymentError('Payment was cancelled. You can try again by clicking "Seal Capsule Now".');
            }
          } else {
            setPaymentError('Payment was cancelled. You can try again.');
          }
        }
      } catch (error) {
        console.error('Failed to load capsule state:', error);
        setPaymentError(error instanceof Error ? error.message : 'Failed to load capsule state');
      } finally {
        setIsLoadingState(false);
      }
    };

    hydrateState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveCapsuleId, searchParams]);
  
  // Phase 3C: Auto-seal when state becomes 'paid' (only once per capsule)
  const hasSealedCapsuleRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Only auto-seal if:
    // 1. State is 'paid'
    // 2. We have a capsule ID
    // 3. We're not already sealing
    // 4. We haven't already sealed this capsule
    if (capsuleState === 'paid' && effectiveCapsuleId && !isSealing) {
      if (hasSealedCapsuleRef.current !== effectiveCapsuleId) {
        hasSealedCapsuleRef.current = effectiveCapsuleId;
        // Automatically seal and go to Step 6
        handleSealCapsule().catch((error) => {
          console.error('Auto-seal failed:', error);
          setPaymentError('Failed to seal capsule. Please try again.');
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capsuleState, effectiveCapsuleId, isSealing]);

  // Phase 3C: Poll capsule state after payment
  const startPolling = useCallback(() => {
    if (!effectiveCapsuleId || isPolling) return;
    
    setIsPolling(true);
    setPaymentError(null);
    
    let pollCount = 0;
    const maxPolls = 22; // 45 seconds max (22 * 2s = 44s)
    const pollInterval = 2000; // 2 seconds
    
    const poll = async () => {
      if (pollCount >= maxPolls) {
        setIsPolling(false);
        setPaymentError('Still processing. Click "Refresh status" to check the latest status.');
        return;
      }
      
      try {
        const capsule = await getCapsule(effectiveCapsuleId!);
        setCapsuleState(capsule.state as CapsuleState);
        
        if (capsule.state === 'paid') {
          setIsPolling(false);
          // Payment confirmed! Seal immediately and go to Step 6
          handleSealCapsule();
        } else if (capsule.state === 'pending_payment') {
          pollCount++;
          setTimeout(poll, pollInterval);
        } else {
          setIsPolling(false);
          setPaymentError(`Unexpected state: ${capsule.state}`);
        }
      } catch (error) {
        console.error('Polling error:', error);
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, pollInterval);
        } else {
          setIsPolling(false);
          setPaymentError('Failed to check payment status. Please refresh the page.');
        }
      }
    };
    
    poll();
  }, [effectiveCapsuleId, isPolling]);

  // Phase 3C: Manual refresh button
  const handleRefreshState = useCallback(async () => {
    if (!effectiveCapsuleId) return;
    
    setIsLoadingState(true);
    setPaymentError(null);
    try {
      const capsule = await getCapsule(effectiveCapsuleId);
      setCapsuleState(capsule.state as CapsuleState);
      
      // If still pending_payment, start polling
      if (capsule.state === 'pending_payment') {
        startPolling();
      }
    } catch (error) {
      console.error('Failed to refresh state:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to refresh state');
    } finally {
      setIsLoadingState(false);
    }
  }, [effectiveCapsuleId, startPolling]);

  // Phase 3C: Create checkout session and redirect
  const handleProceedToPayment = useCallback(async () => {
    if (!effectiveCapsuleId) {
      setPaymentError('Capsule ID missing. Please go back to step 4 to create your capsule.');
      return;
    }
    
    setIsCreatingCheckout(true);
    setPaymentError(null);
    
    try {
      const response = await createCheckoutSession({
        public_id: effectiveCapsuleId,
      });
      
      console.log('Checkout session response:', response);
      
      // Validate response structure
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }
      
      // Check for url property
      const checkoutUrl = response.url;
      
      if (!checkoutUrl) {
        console.error('Response missing url:', response);
        throw new Error('No checkout URL received from server. Check server logs.');
      }
      
      if (typeof checkoutUrl !== 'string') {
        console.error('URL is not a string:', typeof checkoutUrl, checkoutUrl);
        throw new Error(`Invalid checkout URL type: ${typeof checkoutUrl}`);
      }
      
      if (!checkoutUrl.startsWith('http://') && !checkoutUrl.startsWith('https://')) {
        console.error('URL does not start with http:// or https://:', checkoutUrl);
        throw new Error(`Invalid checkout URL format: ${checkoutUrl}`);
      }
      
      console.log('Redirecting to Stripe Checkout:', checkoutUrl);
      
      // Redirect to Stripe Checkout
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to start payment. Please try again.');
      setIsCreatingCheckout(false);
    }
  }, [effectiveCapsuleId]);

  // Phase 3C: Seal capsule
  const handleSealCapsule = useCallback(async () => {
    if (!effectiveCapsuleId) return;
    
    setIsSealing(true);
    setPaymentError(null);
    
    try {
      await sealCapsule(effectiveCapsuleId);
      setCapsuleState('sealed');
      
      // Navigate to Step 6
      if (onNavigateToStep6) {
        onNavigateToStep6();
      } else {
        onSeal(); // Fallback to old handler
      }
    } catch (error) {
      console.error('Failed to seal capsule:', error);
      setPaymentError(error instanceof Error ? error.message : 'Failed to seal capsule. Please try again.');
      setIsSealing(false);
    }
  }, [effectiveCapsuleId, onNavigateToStep6, onSeal]);
  
  // Phase 3B: Upload handler (only allowed in draft state)
  const handleUploadMedia = useCallback(async () => {
    if (isUploadingRef.current) return;
    if (!effectiveCapsuleId) {
      setUploadError('Capsule ID missing. Please go back to step 4 to create your capsule.');
      return;
    }
    
    // Phase 3C: Block uploads if not in draft state
    if (capsuleState !== 'draft') {
      setUploadError('Media can only be uploaded before payment. Please go back to edit your capsule.');
      return;
    }
    
    isUploadingRef.current = true;
    setIsUploading(true);
    setUploadError(null);
    
    try {
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
          photosPaths,
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
          }
        );
        
        if (isMountedRef.current && photoResult.paths.length > 0) {
          const allPaths = [...photosPaths, ...photoResult.paths];
          onPhotosUploaded(allPaths);
        }
        
        if (isMountedRef.current && photoResult.failures && photoResult.failures.length > 0) {
          setUploadError(`Some photos failed to upload. ${photoResult.failures.length} failed.`);
        }
      }
      
      if (videoLocal && !videoPath) {
        const videoToUpload: LocalVideoItem = {
          file: videoLocal.file,
          previewUrl: videoLocal.previewUrl,
          id: videoLocal.id,
        };
        const videoResult = await uploadVideo(
          effectiveCapsuleId,
          videoToUpload,
          videoPath,
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
          }
        );
        
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
      isUploadingRef.current = false;
    }
  }, [effectiveCapsuleId, photosLocal, photosPaths, videoLocal, videoPath, photoStatusById, onPhotosUploaded, onVideoUploaded, capsuleState]);
  
  // Determine effective media for display
  const effectivePhotos = photosLocal.map(p => p.previewUrl);
  const effectiveVideoUrl = videoLocal?.previewUrl || videoBlobUrl;
  
  // Count uploaded media
  const uploadedPhotoCount = photosPaths.length;
  const hasUploadedVideo = !!videoPath;

  // Phase 3C: Determine if editing is disabled
  const isReadOnly = capsuleState === 'pending_payment' || capsuleState === 'paid' || capsuleState === 'sealed';
  const canEditMedia = capsuleState === 'draft' || capsuleState === null;

  // Phase 3C: Render Payment Status block (always visible)
  const renderPaymentStatus = () => {
    if (!effectiveCapsuleId) {
      return (
        <div className="bg-[#F7F5F0] border border-[#D4C9BC] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#64748B]">Payment Status</span>
            <span className="text-[9px] uppercase tracking-[0.20em] font-black text-[#64748B]">Not created</span>
          </div>
        </div>
      );
    }

    if (capsuleState === 'draft' || capsuleState === null) {
      return (
        <div className="bg-[#F7F5F0] border border-[#D4C9BC] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#64748B]">Payment Status</span>
            <span className="text-[9px] uppercase tracking-[0.20em] font-black text-[#64748B]">Not paid yet</span>
          </div>
        </div>
      );
    }

    if (capsuleState === 'pending_payment') {
      return (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#B45309]">Payment Status</span>
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              {isPolling && <Loader2 size={12} className="animate-spin text-[#B45309]" />}
              <span className="text-[9px] uppercase tracking-[0.20em] font-black text-[#B45309]">
                {isPolling ? 'Processing...' : 'Processing'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (capsuleState === 'paid') {
      return (
        <div className="bg-[#D1FAE5] border border-[#059669] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#059669]">Payment Status</span>
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              <CheckCircle2 size={12} className="text-[#059669]" />
              <span className="text-[9px] uppercase tracking-[0.20em] font-black text-[#059669]">Payment received ✅</span>
            </div>
          </div>
        </div>
      );
    }

    if (capsuleState === 'sealed') {
      return (
        <div className="bg-[#D1FAE5] border border-[#059669] rounded-sm p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.30em] font-black text-[#059669]">Payment Status</span>
            <div className="flex items-center" style={{ gap: '0.5rem' }}>
              <Lock size={12} className="text-[#059669]" />
              <span className="text-[9px] uppercase tracking-[0.20em] font-black text-[#059669]">Sealed 🔒</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Phase 3C: Render state-driven UI
  const renderPaymentSection = () => {
    if (!effectiveCapsuleId) {
      return null;
    }

    if (capsuleState === 'draft' || capsuleState === null) {
      // Return null - payment button is now only in footer
      return null;
    }

    if (capsuleState === 'pending_payment') {
      const hasTimedOut = paymentError && paymentError.includes('Still processing');
      
      return (
        <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-sm p-6" style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.30em] font-black text-[#B45309] mb-2">Processing Payment</h3>
            <p className="text-[9px] uppercase tracking-[0.20em] text-[#B45309] font-black mb-4" style={{ lineHeight: 1.5 }}>
              {hasTimedOut 
                ? 'Still processing. Click "Refresh status" to check the latest status.'
                : isPolling 
                  ? 'Waiting for payment confirmation...' 
                  : 'Payment is being processed. This may take a few moments.'}
            </p>
          </div>
          {isPolling && !hasTimedOut && (
            <div className="flex items-center justify-center" style={{ gap: '0.75rem' }}>
              <Loader2 size={16} className="animate-spin text-[#B45309]" />
              <span className="text-[9px] uppercase tracking-[0.20em] text-[#B45309] font-black">Checking status...</span>
            </div>
          )}
          <motion.button
            onClick={handleRefreshState}
            disabled={isLoadingState}
            className="flex items-center justify-center text-[#B45309] text-[9px] uppercase tracking-[0.25em] font-black border border-[#F59E0B] rounded-sm hover:bg-[#FEF3C7] transition-all duration-200 cursor-pointer"
            style={{ padding: '0.5rem 1rem', gap: '0.5rem' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw size={12} className={isLoadingState ? 'animate-spin' : ''} />
            <span>Refresh Status</span>
          </motion.button>
          {paymentError && !hasTimedOut && (
            <p className="text-[8px] font-black text-[#DC2626] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
              {paymentError}
            </p>
          )}
        </div>
      );
    }

    if (capsuleState === 'paid') {
      // Don't show preview - sealing happens automatically
      // Return null or loading state while sealing
      return (
        <div className="bg-[#D1FAE5] border border-[#059669] rounded-sm p-6" style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="flex items-center justify-center" style={{ gap: '0.75rem' }}>
            <Loader2 size={20} className="animate-spin text-[#059669]" />
            <h3 className="text-[11px] uppercase tracking-[0.30em] font-black text-[#059669]">
              Sealing your capsule...
            </h3>
          </div>
          <p className="text-[9px] uppercase tracking-[0.20em] text-[#059669] font-black" style={{ lineHeight: 1.5 }}>
            Redirecting to certificate
          </p>
        </div>
      );
    }

    if (capsuleState === 'sealed') {
      return (
        <div className="bg-[#D1FAE5] border border-[#059669] rounded-sm p-6">
          <div className="flex items-center" style={{ gap: '0.5rem' }}>
            <CheckCircle2 size={16} className="text-[#059669]" />
            <h3 className="text-[10px] uppercase tracking-[0.30em] font-black text-[#059669]">
              Capsule Sealed
            </h3>
          </div>
          <p className="text-[9px] uppercase tracking-[0.20em] text-[#059669] font-black mt-2" style={{ lineHeight: 1.5 }}>
            Your capsule has been sealed. Redirecting to certificate...
          </p>
        </div>
      );
    }

    return null;
  };

  // Safety check: if component is in a bad state, show error
  if (capsuleState === null && effectiveCapsuleId && !isLoadingState) {
    console.warn('Step5Review: capsuleState is null but capsule ID exists. This may indicate a loading issue.');
  }

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
        <div style={{ gap: '1rem', display: 'flex', flexDirection: 'column' }}>
          {/* Phase 3C: Payment button in footer (only for draft state) */}
          {!isReadOnly && (capsuleState === 'draft' || capsuleState === null) && effectiveCapsuleId && (
            <motion.div
              className="bg-[#1E293B] border border-[#475569] rounded-sm p-4"
              style={{
                boxShadow: '0 2px 8px rgba(30, 41, 59, 0.2), 0 1px 4px rgba(30, 41, 59, 0.1)',
              }}
              variants={itemVariants}
              whileHover={{ 
                boxShadow: '0 4px 12px rgba(30, 41, 59, 0.3), 0 2px 6px rgba(30, 41, 59, 0.15)',
                y: -1,
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ gap: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <motion.button
                  onClick={handleProceedToPayment}
                  disabled={isCreatingCheckout}
                  className="w-full uppercase tracking-wider text-sm font-black rounded-md border transition-all"
                  style={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    cursor: isCreatingCheckout ? 'not-allowed' : 'pointer',
                    padding: '0.75rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                  whileHover={isCreatingCheckout ? {} : { scale: 1.02 }}
                  whileTap={isCreatingCheckout ? {} : { scale: 0.98 }}
                >
                  {isCreatingCheckout ? (
                    <>
                      <Loader2 size={18} className="animate-spin" style={{ color: 'white' }} />
                      <span style={{ color: 'white' }}>Redirecting...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'white' }}>Seal Capsule Now</span>
                      <ArrowUpIcon size={18} style={{ color: 'white' }} />
                    </>
                  )}
                </motion.button>
                {paymentError && (
                  <p className="text-[8px] font-black text-[#FCA5A5] uppercase tracking-[0.20em] text-center" style={{ lineHeight: 1.5 }}>
                    {paymentError}
                  </p>
                )}
              </div>
            </motion.div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex items-center" style={{ gap: '1rem' }}>
              {!isReadOnly && (
                <>
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
                    disabled={isReadOnly}
                    className={`flex items-center text-[9px] uppercase tracking-[0.40em] font-black bg-transparent text-[#475569] hover:text-[#1E293B] hover:border-[#B8A895] transition-colors duration-200 border border-transparent rounded-sm ${
                      isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{ padding: '0.25rem 0.5rem', gap: '0.375rem' }}
                    whileHover={isReadOnly ? {} : { scale: 1.05 }}
                    whileTap={isReadOnly ? {} : { scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200 ease-out" />
                    <span>Back</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
          {isReadOnly && (
            <p className="text-[8px] uppercase tracking-[0.15em] text-[#64748B] font-black text-center" style={{ opacity: 1, lineHeight: 1.5 }}>
              {capsuleState === 'pending_payment' && 'Payment in progress. Editing is locked.'}
              {capsuleState === 'paid' && 'Payment confirmed. Ready to seal.'}
              {capsuleState === 'sealed' && 'Capsule is sealed and cannot be changed.'}
            </p>
          )}
          {!isReadOnly && (
            <p className="text-[8px] uppercase tracking-[0.15em] text-[#64748B] font-black text-center" style={{ opacity: 1, lineHeight: 1.5 }}>
              Once sealed, your message cannot be changed
            </p>
          )}
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
          {/* Phase 3C: Payment Status (always visible) */}
          {renderPaymentStatus()}
          
          {/* Phase 3C: Payment Section (state-driven) */}
          {renderPaymentSection()}
          
          {/* Phase 3C: Cancel banner (if cancelled) */}
          {searchParams.get('payment') === 'cancelled' && capsuleState === 'draft' && (
            <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-[#B45309] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
                  Payment cancelled. You can try again when ready.
                </p>
              </div>
            </div>
          )}

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
              
              {!effectiveCapsuleId && (
                <div className="bg-[#FEF3C7] border border-[#F59E0B] rounded-sm p-3">
                  <p className="text-[9px] font-black text-[#B45309] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
                    ⚠️ Make your capsule first via step 4 before uploading media.
                  </p>
                </div>
              )}
              
              {/* Upload button - only in draft state */}
              {effectiveCapsuleId && canEditMedia && (effectivePhotos.length > 0 || effectiveVideoUrl) && (
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
              
              {isReadOnly && (effectivePhotos.length > 0 || effectiveVideoUrl) && (
                <p className="text-[8px] font-black text-[#64748B] uppercase tracking-[0.20em]" style={{ lineHeight: 1.5 }}>
                  Media editing is locked. Your capsule is ready for sealing.
                </p>
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
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-500 ease-out" />
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
