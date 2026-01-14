import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { Capsule } from '../../types';
import { useWizardState } from './hooks/useWizardState';
import { useDropdown } from './hooks/useDropdown';
import { useRecorder } from './hooks/useRecorder';
import { Step1Identity } from './steps/Step1Identity';
import { Step2Photos } from './steps/Step2Photos';
import { Step3Video } from './steps/Step3Video';
import { Step4Message } from './steps/Step4Message';
import { Step5Review } from './steps/Step5Review';
import { Step6Certificate } from './steps/Step6Certificate';
import { PhotoViewer } from './ui/PhotoGrid';
import { CeremonyOverlay } from './ui/CeremonyOverlay';
import { MONTHS } from './data/constants';
import { getReducedMotionTransition } from './data/variants';
import { createCapsule, getCapsule } from '../../lib/api';
import { mapBackendToUI, mapUIToCreateRequest, uiDobToIso, isoToUiDob } from '../../lib/capsuleMapping';

interface CapsuleWizardProps {
  onClose: () => void;
  onSuccess: (capsule: Capsule) => void;
}

export const CapsuleWizard: React.FC<CapsuleWizardProps> = ({ onClose, onSuccess }) => {
  const { step: stepParam } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, actions] = useWizardState();
  const dropdown = useDropdown(state.formData.country);
  const recorder = useRecorder();
  const [isVideoViewerOpen, setIsVideoViewerOpen] = React.useState(false);

  // Phase 3A: URL persistence - capsule public_id
  const capsuleFromUrl = searchParams.get('capsule');
  const [capsulePublicId, setCapsulePublicId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const effectiveCapsuleId = capsulePublicId ?? capsuleFromUrl;

  // StrictMode guard for hydration
  const hydratedRef = useRef<string | null>(null);
  const createOnceRef = useRef(false);

  // Parse step from URL and sync with state
  const urlStep = stepParam ? parseInt(stepParam, 10) : 1;
  const validStep = urlStep >= 1 && urlStep <= 6 ? urlStep : 1;
  
  // Sync URL step with state on mount/URL change (browser navigation, refresh, etc.)
  useEffect(() => {
    if (validStep !== state.step && validStep >= 1 && validStep <= 6) {
      actions.setStep(validStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validStep]); // Only sync when URL param changes

  // Phase 3A: Hydration - load capsule from backend if ?capsule= exists
  useEffect(() => {
    if (!capsuleFromUrl) return;
    if (hydratedRef.current === capsuleFromUrl) return; // Already hydrated this capsule
    hydratedRef.current = capsuleFromUrl;

    (async () => {
      setIsHydrating(true);
      setHydrationError(null);
      try {
        const backendCapsule = await getCapsule(capsuleFromUrl);
        const uiCapsule = mapBackendToUI(backendCapsule);
        
        // Hydrate wizard state from backend capsule
        actions.setFormData({
          name: uiCapsule.name || '',
          country: uiCapsule.country,
          town: uiCapsule.town,
          message: uiCapsule.message,
        });
        
        // Parse dob (YYYY-MM-DD) to dobDay/dobMonth/dobYear
        const dobParts = isoToUiDob(uiCapsule.dob);
        actions.setDobDay(dobParts.dobDay);
        actions.setDobMonth(dobParts.dobMonth);
        actions.setDobYear(dobParts.dobYear);
        
        // Phase 3B: Hydrate backend paths (source of truth)
        // ONLY set backend paths, NEVER local selections (photosLocal/videoLocal stay empty on refresh)
        // Ignore legacy fields (photos, video) - use only photos_paths and video_path
        actions.setUploadedPhotosPaths(backendCapsule.photos_paths || []);
        actions.setUploadedVideoPath(backendCapsule.video_path || null);
        
        setCapsulePublicId(capsuleFromUrl);
      } catch (error) {
        console.error('Hydration error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load capsule';
        setHydrationError(errorMessage);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [capsuleFromUrl, actions]);

  // Navigate to URL when step changes (from user actions like Next/Back buttons)
  // Phase 3A: Preserve ?capsule= query param
  const handleStepChange = useCallback((newStep: number) => {
    if (newStep >= 1 && newStep <= 6) {
      const path = `/seal/${newStep}`;
      const search = effectiveCapsuleId ? `?capsule=${effectiveCapsuleId}` : '';
      navigate(`${path}${search}`, { replace: true });
    }
  }, [navigate, effectiveCapsuleId]);

  // Phase 3A: Check if all required fields are complete (for capsule creation)
  const requiredFieldsComplete = useCallback(() => {
    return (
      state.formData.country &&
      state.formData.country.trim().length > 0 &&
      state.formData.town &&
      state.formData.town.trim().length > 0 &&
      state.dobYear &&
      state.dobMonth &&
      state.dobDay &&
      state.formData.message &&
      state.formData.message.trim().length > 0
    );
  }, [state.formData.country, state.formData.town, state.dobYear, state.dobMonth, state.dobDay, state.formData.message]);

  // Phase 3A: Create capsule (StrictMode-safe, called from Step 4 "Next")
  const ensureCapsuleCreated = useCallback(async (): Promise<string | null> => {
    if (effectiveCapsuleId) {
      return effectiveCapsuleId; // Already created
    }
    if (createOnceRef.current) {
      return null; // Prevent double creation
    }

    if (!requiredFieldsComplete()) {
      throw new Error('Required fields are not complete');
    }

    createOnceRef.current = true;

    try {
      // Build create request from wizard state
      const dobIso = uiDobToIso(state.dobDay, state.dobMonth, state.dobYear);
      const uiCapsule: Partial<Capsule> = {
        name: state.formData.name || undefined,
        country: state.formData.country,
        town: state.formData.town,
        dob: dobIso,
        message: state.formData.message,
        archivalTimestamp: state.currentMetadata,
        ageAtCreation: actions.calculateAge(),
      };

      const createPayload = mapUIToCreateRequest(uiCapsule);
      const response = await createCapsule(createPayload);

      setCapsulePublicId(response.public_id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('capsule', response.public_id);
        return next;
      }, { replace: true });

      return response.public_id;
    } catch (error) {
      createOnceRef.current = false; // Allow retry on error
      throw error;
    }
  }, [effectiveCapsuleId, requiredFieldsComplete, state, actions, setSearchParams]);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    const confirmed = window.confirm("Are you sure you want to leave? Your progress will not be saved.");
    if (confirmed) {
      onClose();
    }
  };

  // Handle scroll to top when certificate is shown
  useEffect(() => {
    if (state.step === 6 && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [state.step]);

  // Sync recorder video state to wizard state
  useEffect(() => {
    if (recorder.videoBlobUrl !== state.videoBlobUrl) {
      actions.setVideoBlobUrl(recorder.videoBlobUrl);
    }
    if (recorder.videoBase64 !== state.videoBase64) {
      actions.setVideoBase64(recorder.videoBase64);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.videoBlobUrl, recorder.videoBase64]); // Only sync when recorder state changes

  // Prevent body scroll when form is open
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;
    const originalTop = document.body.style.top;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleSeal = () => {
    // Clear previous errors
    actions.clearErrors();
    
    // Basic validation with inline errors
    const newErrors: { name?: string; country?: string; town?: string; dob?: string } = {};
    let hasErrors = false;

    if (!state.formData.name?.trim()) {
      newErrors.name = "Please enter your name";
      hasErrors = true;
    }
    if (!state.formData.country) {
      newErrors.country = "Please select your country";
      hasErrors = true;
    }
    if (!state.formData.town?.trim()) {
      newErrors.town = "Please enter your city";
      hasErrors = true;
    }
    if (!state.dobYear || !state.dobMonth || !state.dobDay) {
      newErrors.dob = "Please select your complete birth date";
      hasErrors = true;
    }

    if (hasErrors) {
      actions.setErrors(newErrors);
      actions.setErrorMessage("Please fix the errors above to continue");
      // Scroll to first error
      const firstErrorField = document.querySelector('[role="alert"]') as HTMLElement;
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Phase 1: Intent
    actions.setSealingPhase('intent');
    actions.setIsSubmitting(true);
    actions.setSealProgress(0);

    // Phase 2: Commitment (after 500ms)
    setTimeout(() => {
      actions.setSealingPhase('preserving');
    }, 500);

    // Phase 3: Preservation (progress animation over 3 seconds)
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress = currentProgress + 1.1;
      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        actions.setSealingPhase('complete');
        actions.setSealProgress(100);
      } else {
        actions.setSealProgress(currentProgress);
      }
    }, 30);

    // Phase 4: Completion & Phase 5: Revelation
    setTimeout(() => {
      const formattedDob = `${state.dobYear}-${(MONTHS.indexOf(state.dobMonth) + 1).toString().padStart(2, '0')}-${state.dobDay.padStart(2, '0')}`;
      const newCapsule: Capsule = {
        ...state.formData,
        dob: formattedDob,
        photos: state.photos,
        video: state.videoBase64 || undefined,
        createdAt: new Date(),
        ageAtCreation: actions.calculateAge(),
        archivalTimestamp: state.currentMetadata
      };
      actions.setFinalCapsule(newCapsule);
      onSuccess(newCapsule);
      handleStepChange(6); // Navigate to step 6 (certificate)

      // Reset after transition
      setTimeout(() => {
        actions.setIsSubmitting(false);
        actions.setSealingPhase('idle');
        actions.setSealProgress(0);
      }, 600);
    }, 4500);
  };

  const handleDownload = () => window.print();

  const handleShare = async () => {
    if (navigator.share && state.finalCapsule) {
      try {
        await navigator.share({
          title: 'The Century Time Capsule',
          text: `I just established my legacy at The Century. Sealed until 2125.`,
          url: window.location.href,
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Sharing legacy...");
    }
  };


  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="capsule-form-container fixed inset-0 bg-[#f5f2ed] z-[60] overflow-hidden"
      style={{ overscrollBehavior: 'none', width: '100vw', height: '100vh', maxWidth: '100vw', maxHeight: '100vh' }}
    >
      {/* Background Grain Texture */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat',
          opacity: 0.02
        }}
      />

      {/* Slow-Moving Ambient Light */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: '-20%', y: '-20%' }}
        animate={{
          x: ['-20%', '120%', '-20%'],
          y: ['-20%', '120%', '-20%']
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(212, 165, 116, 0.04), transparent 70%)',
          filter: 'blur(80px)',
          width: '150%',
          height: '150%'
        }}
      />


      {/* Sealing Ceremony Overlay - must be below close button but above content */}
      <CeremonyOverlay sealingPhase={state.sealingPhase} sealProgress={state.sealProgress} />

      <div className="absolute inset-0 w-full h-full flex flex-col items-center relative print:bg-white overflow-hidden z-10" style={{ overscrollBehavior: 'none', padding: '1.5rem 1.5rem 2rem 1.5rem' }}>
        <button
          onClick={handleClose}
          className={`absolute top-4 right-4 md:top-6 md:right-6 p-2 text-[#1E293B] opacity-70 hover:opacity-100 transition-all z-[85] outline-none group print:hidden hover:bg-[#1E293B]/10 rounded-sm ${isVideoViewerOpen ? 'hidden' : ''}`}
          aria-label="Close"
        >
          <X strokeWidth={1} size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="max-w-6xl w-full h-full flex flex-row overflow-hidden relative z-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative h-full">
          <AnimatePresence mode="wait" initial={false}>
            {state.step === 1 && (
              <Step1Identity
                key="step1"
                formData={state.formData}
                dobDay={state.dobDay}
                dobMonth={state.dobMonth}
                dobYear={state.dobYear}
                countrySearch={dropdown.countrySearch}
                citySearch={dropdown.citySearch}
                showCountryMenu={dropdown.showCountryMenu}
                showCityMenu={dropdown.showCityMenu}
                showDayMenu={dropdown.showDayMenu}
                showMonthMenu={dropdown.showMonthMenu}
                showYearMenu={dropdown.showYearMenu}
                filteredCountries={dropdown.filteredCountries}
                filteredCities={dropdown.filteredCities}
                availableCities={dropdown.availableCities}
                onFormDataChange={(data) => {
                  actions.setFormData(data);
                  // Clear field-specific errors when user starts typing
                  const updatedErrors = { ...state.errors };
                  if (data.name !== undefined) updatedErrors.name = undefined;
                  if (data.country !== undefined) updatedErrors.country = undefined;
                  if (data.town !== undefined) updatedErrors.town = undefined;
                  actions.setErrors(updatedErrors);
                }}
                onDobDayChange={(day) => {
                  actions.setDobDay(day);
                  if (day && state.dobMonth && state.dobYear) {
                    actions.setErrors({ ...state.errors, dob: undefined });
                  }
                }}
                onDobMonthChange={(month) => {
                  actions.setDobMonth(month);
                  if (state.dobDay && month && state.dobYear) {
                    actions.setErrors({ ...state.errors, dob: undefined });
                  }
                }}
                onDobYearChange={(year) => {
                  actions.setDobYear(year);
                  if (state.dobDay && state.dobMonth && year) {
                    actions.setErrors({ ...state.errors, dob: undefined });
                  }
                }}
                onCountrySearchChange={dropdown.setCountrySearch}
                onCitySearchChange={dropdown.setCitySearch}
                onShowCountryMenu={dropdown.setShowCountryMenu}
                onShowCityMenu={dropdown.setShowCityMenu}
                onShowDayMenu={dropdown.setShowDayMenu}
                onShowMonthMenu={dropdown.setShowMonthMenu}
                onShowYearMenu={dropdown.setShowYearMenu}
                onNext={() => {
                  actions.clearErrors();
                  handleStepChange(2);
                }}
                errors={state.errors}
              />
            )}
            {state.step === 2 && (
              <Step2Photos
                key="step2"
                photos={state.photos}
                onUpload={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (state.photos.length + files.length > 10) {
                    actions.setErrorMessage("You can only add 10 images. Please remove some photos first.");
                    return;
                  }
                  actions.setErrorMessage(null);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onloadend = () => actions.setPhotos(prev => [...prev, reader.result as string]);
                    reader.readAsDataURL(file as Blob);
                  });
                }}
                onRemove={(index) => {
                  actions.setPhotos(prev => prev.filter((_, idx) => idx !== index));
                  actions.setErrorMessage(null);
                }}
                onSelect={actions.setSelectedPhoto}
                onBack={() => {
                  actions.setErrorMessage(null);
                  handleStepChange(1);
                }}
                onNext={() => {
                  actions.setErrorMessage(null);
                  handleStepChange(3);
                }}
                errorMessage={state.errorMessage}
              />
            )}
            {state.step === 3 && (
              <Step3Video
                key="step3"
                videoBlobUrl={recorder.videoBlobUrl}
                videoBase64={recorder.videoBase64}
                isPlaying={recorder.isPlayingStep3}
                onTogglePlayback={recorder.togglePlaybackStep3}
                onRemove={() => {
                  recorder.setVideoBlobUrl(null);
                  recorder.setVideoBase64(null);
                  actions.setVideoBlobUrl(null);
                  actions.setVideoBase64(null);
                }}
                onImport={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Validate file size (max 1GB for video)
                    const maxSize = 1024 * 1024 * 1024; // 1GB
                    if (file.size > maxSize) {
                      const fileSizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
                      actions.setErrorMessage(`Video file is too large (${fileSizeGB}GB). Maximum size is 1GB. Please try a shorter video or lower quality.`);
                      return;
                    }
                    // Validate file type
                    if (!file.type.startsWith('video/')) {
                      actions.setErrorMessage("Please select a valid video file.");
                      return;
                    }
                    actions.setErrorMessage(null);
                    if (recorder.videoBlobUrl) {
                      URL.revokeObjectURL(recorder.videoBlobUrl);
                    }
                    if (state.videoBlobUrl) {
                      URL.revokeObjectURL(state.videoBlobUrl);
                    }
                    const url = URL.createObjectURL(file);
                    recorder.setVideoBlobUrl(url);
                    actions.setVideoBlobUrl(url);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64 = reader.result as string;
                      recorder.setVideoBase64(base64);
                      actions.setVideoBase64(base64);
                    };
                    reader.onerror = () => {
                      console.error("Failed to read video file");
                      actions.setErrorMessage("Failed to process video. Please try again.");
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                videoInputRef={recorder.videoInputRef}
                videoRef={recorder.step3VideoRef}
                onViewerOpenChange={setIsVideoViewerOpen}
                onBack={() => handleStepChange(2)}
                onNext={() => handleStepChange(4)}
              />
            )}
            {state.step === 4 && (
              <Step4Message
                key="step4"
                message={state.formData.message}
                onMessageChange={(msg) => actions.setFormData({ message: msg })}
                onBack={() => handleStepChange(3)}
                onNext={async () => {
                  // Phase 3A: Create capsule before proceeding to Step 5
                  try {
                    await ensureCapsuleCreated();
                    handleStepChange(5);
                  } catch (error) {
                    console.error('Failed to create capsule:', error);
                    const errorMessage = error instanceof Error ? error.message : 'Failed to create capsule. Please try again.';
                    actions.setErrorMessage(errorMessage);
                  }
                }}
              />
            )}
            {state.step === 5 && (
              <Step5Review
                key="step5"
                formData={state.formData}
                dobDay={state.dobDay}
                dobMonth={state.dobMonth}
                dobYear={state.dobYear}
                // Phase 3B: New state structure
                photosLocal={state.photosLocal}
                videoLocal={state.videoLocal}
                photosPaths={state.photosPaths}
                videoPath={state.videoPath}
                effectiveCapsuleId={effectiveCapsuleId}
                // Deprecated: Keep for backward compatibility (read-only)
                photos={state.photos}
                videoBlobUrl={state.videoBlobUrl}
                videoBase64={state.videoBase64}
                isPlaying={recorder.isPlaying}
                currentMetadata={state.currentMetadata}
                calculateAge={actions.calculateAge}
                onPhotoSelect={actions.setSelectedPhoto}
                onTogglePlayback={recorder.togglePlayback}
                onDiscard={() => {
                  const confirmed = window.confirm("Are you sure you want to delete your capsule? All your progress will be lost.");
                  if (confirmed) {
                    // Reset all state
                    actions.setStep(1);
                    actions.setFormData({ name: '', country: '', town: '', message: '' });
                    actions.setDobDay('');
                    actions.setDobMonth('');
                    actions.setDobYear('');
                    actions.clearLocalMedia();
                    actions.resetUploadedMedia();
                    actions.setFinalCapsule(null);
                    actions.setSelectedPhoto(null);
                    recorder.setVideoBlobUrl(null);
                    recorder.setVideoBase64(null);
                    setCapsulePublicId(null); // Clear public ID
                    setSearchParams({}, { replace: true }); // Clear URL param
                    handleStepChange(1);
                  }
                }}
                onBack={() => handleStepChange(4)}
                onSeal={handleSeal}
                isSubmitting={state.isSubmitting}
                reviewVideoRef={recorder.reviewVideoRef}
                onViewerOpenChange={setIsVideoViewerOpen}
                // Phase 3B: Upload callbacks
                onPhotosUploaded={(paths) => {
                  actions.setUploadedPhotosPaths(paths);
                }}
                onVideoUploaded={(path) => {
                  actions.setUploadedVideoPath(path);
                }}
                // Phase 3C: Navigate to Step 6 after sealing
                onNavigateToStep6={async () => {
                  if (!effectiveCapsuleId) return;
                  try {
                    // Load sealed capsule from backend
                    const backendCapsule = await getCapsule(effectiveCapsuleId);
                    const uiCapsule = mapBackendToUI(backendCapsule);
                    actions.setFinalCapsule(uiCapsule);
                    onSuccess(uiCapsule);
                    handleStepChange(6);
                  } catch (error) {
                    console.error('Failed to load sealed capsule:', error);
                    actions.setErrorMessage('Failed to load capsule. Please refresh the page.');
                  }
                }}
              />
            )}
            {state.step === 6 && state.finalCapsule && (
              <Step6Certificate
                key="step6"
                capsule={state.finalCapsule}
                onDownload={handleDownload}
                onShare={handleShare}
                onClose={onClose}
              />
            )}
          </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal - rendered outside main container to ensure proper z-index */}
      <AnimatePresence>
        {state.selectedPhoto && (
          <PhotoViewer photo={state.selectedPhoto} onClose={() => actions.setSelectedPhoto(null)} />
        )}
      </AnimatePresence>

      {/* Global Error Announcement - aria-live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.errorMessage && (
          <p>{state.errorMessage}</p>
        )}
        {Object.values(state.errors).some(e => e) && (
          <p>{Object.values(state.errors).filter(e => e).join('. ')}</p>
        )}
      </div>

      <style>{`
        /* Hide all scrollbars in the capsule form container */
        /* Prevent body scroll and ensure container is properly sized */
        .capsule-form-container {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          overflow: hidden !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: 100vw !important;
          max-height: 100vh !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        
        /* Hide scrollbars globally within container except for specific elements */
        .capsule-form-container * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .capsule-form-container *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        
        /* Allow scrolling in specific content areas */
        .photo-grid-scroll,
        .review-content-scroll {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          overflow-y: auto !important;
        }
        .photo-grid-scroll::-webkit-scrollbar,
        .review-content-scroll::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
        }
        
        /* Smooth scrollbar for message textarea */
        .message-textarea {
          scrollbar-width: thin !important;
          scrollbar-color: #D4C9BC transparent !important;
          -ms-overflow-style: auto !important;
        }
        .message-textarea::-webkit-scrollbar {
          display: block !important;
          width: 6px !important;
          height: 6px !important;
        }
        .message-textarea::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .message-textarea::-webkit-scrollbar-thumb {
          background-color: #D4C9BC !important;
          border-radius: 3px !important;
        }
        .message-textarea::-webkit-scrollbar-thumb:hover {
          background-color: #B8A895 !important;
        }
        
        /* Keep scrollbars visible for dropdowns only */
        .dropdown-scroll::-webkit-scrollbar {
          display: block !important;
          width: 3px !important;
        }
        .dropdown-scroll::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 3px !important;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: #1e293b !important;
        }
        .dropdown-scroll {
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 transparent !important;
        }
        
        /* Prevent horizontal overflow */
        .capsule-form-container > div,
        .capsule-form-container * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        
        @media print {
          body * { visibility: hidden; }
          .print\:bg-white { background: white !important; }
          #step6-container, #step6-container * { visibility: visible; }
        }
      `}</style>
    </motion.div>
  );
};

