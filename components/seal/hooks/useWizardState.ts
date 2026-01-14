import { useState, useMemo, useEffect, useCallback } from 'react';
import { Capsule } from '../../../types';
import { MONTHS } from '../data/constants';

export interface WizardFormData {
  name: string;
  country: string;
  town: string;
  message: string;
}

// Phase 3B: Local media selection (session-only UX)
export interface LocalPhoto {
  file: File;
  previewUrl: string;
  id: string; // Stable ID for remove/reorder
}

export interface LocalVideo {
  file: File;
  previewUrl: string;
  id: string; // Stable ID
}

// Phase 3B: Backend storage paths (persistent, source of truth)
export interface WizardState {
  step: number;
  formData: WizardFormData;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  
  // Phase 3B: Local selection (session-only, temporary)
  photosLocal: LocalPhoto[];
  videoLocal: LocalVideo | null;
  
  // Phase 3B: Backend paths (persistent, source of truth)
  photosPaths: string[];
  videoPath: string | null;
  
  // DEPRECATED: Keep for backward compatibility, will be removed in cleanup
  /** @deprecated Use photosLocal + photosPaths instead */
  photos: string[];
  /** @deprecated Use videoLocal + videoPath instead */
  videoBlobUrl: string | null;
  /** @deprecated Use videoLocal + videoPath instead */
  videoBase64: string | null;
  
  finalCapsule: Capsule | null;
  selectedPhoto: string | null;
  isSubmitting: boolean;
  sealingPhase: 'idle' | 'intent' | 'preserving' | 'complete';
  sealProgress: number;
  currentMetadata: {
    year: number;
    month: string;
    day: number;
    time: string;
  };
  errors: {
    name?: string;
    country?: string;
    town?: string;
    dob?: string;
  };
  errorMessage: string | null;
}

export interface WizardActions {
  setStep: (step: number) => void;
  setFormData: (data: Partial<WizardFormData> | ((prev: WizardFormData) => WizardFormData)) => void;
  setDobDay: (day: string) => void;
  setDobMonth: (month: string) => void;
  setDobYear: (year: string) => void;
  
  // Phase 3B: Local media actions
  addLocalPhotos: (files: File[]) => void;
  removeLocalPhoto: (id: string) => void;
  setLocalVideo: (file: File | null) => void;
  clearLocalMedia: () => void;
  
  // Phase 3B: Backend paths actions
  setUploadedPhotosPaths: (paths: string[]) => void;
  addUploadedPhotoPath: (path: string) => void;
  removeUploadedPhotoPath: (path: string) => void;
  setUploadedVideoPath: (path: string | null) => void;
  resetUploadedMedia: () => void;
  
  // DEPRECATED: Keep for backward compatibility
  /** @deprecated Use photosLocal + photosPaths instead */
  setPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
  /** @deprecated Use videoLocal + videoPath instead */
  setVideoBlobUrl: (url: string | null) => void;
  /** @deprecated Use videoLocal + videoPath instead */
  setVideoBase64: (base64: string | null) => void;
  
  setFinalCapsule: (capsule: Capsule | null) => void;
  setSelectedPhoto: (photo: string | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSealingPhase: (phase: 'idle' | 'intent' | 'preserving' | 'complete') => void;
  setSealProgress: (progress: number) => void;
  setErrors: (errors: Partial<{ name?: string; country?: string; town?: string; dob?: string }>) => void;
  clearErrors: () => void;
  setErrorMessage: (message: string | null) => void;
  calculateAge: () => number;
}

export const useWizardState = (): [WizardState, WizardActions] => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    country: '',
    town: '',
    message: '',
  });
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  
  // Phase 3B: Local selection (session-only)
  const [photosLocal, setPhotosLocal] = useState<LocalPhoto[]>([]);
  const [videoLocal, setVideoLocal] = useState<LocalVideo | null>(null);
  
  // Phase 3B: Backend paths (persistent, source of truth)
  const [photosPaths, setPhotosPaths] = useState<string[]>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  
  // DEPRECATED: Keep for backward compatibility
  const [photos, setPhotos] = useState<string[]>([]);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  
  const [finalCapsule, setFinalCapsule] = useState<Capsule | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sealingPhase, setSealingPhase] = useState<'idle' | 'intent' | 'preserving' | 'complete'>('idle');
  const [sealProgress, setSealProgress] = useState(0);
  const [errors, setErrors] = useState<{ name?: string; country?: string; town?: string; dob?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const now = new Date();
  const currentMetadata = useMemo(() => ({
    year: now.getFullYear(),
    month: MONTHS[now.getMonth()],
    day: now.getDate(),
    time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })
  }), [now]);

  const calculateAge = () => {
    if (!dobYear || !dobMonth || !dobDay) return 0;
    const birthDate = new Date(parseInt(dobYear), MONTHS.indexOf(dobMonth), parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Phase 3B: Local media actions with object URL cleanup
  const addLocalPhotos = useCallback((files: File[]) => {
    const newPhotos: LocalPhoto[] = files.map(file => {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { file, previewUrl, id };
    });
    setPhotosLocal(prev => [...prev, ...newPhotos]);
  }, []);

  const removeLocalPhoto = useCallback((id: string) => {
    setPhotosLocal(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.previewUrl); // Cleanup object URL
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const setLocalVideo = useCallback((file: File | null) => {
    setVideoLocal(prev => {
      if (prev) {
        URL.revokeObjectURL(prev.previewUrl); // Cleanup old object URL
      }
      if (!file) {
        return null;
      }
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      return { file, previewUrl, id };
    });
  }, []);

  const clearLocalMedia = useCallback(() => {
    // Cleanup all object URLs
    photosLocal.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
    if (videoLocal) {
      URL.revokeObjectURL(videoLocal.previewUrl);
    }
    setPhotosLocal([]);
    setVideoLocal(null);
  }, [photosLocal, videoLocal]);

  // Phase 3B: Backend paths actions
  const setUploadedPhotosPaths = useCallback((paths: string[]) => {
    setPhotosPaths(paths);
  }, []);

  const addUploadedPhotoPath = useCallback((path: string) => {
    setPhotosPaths(prev => [...prev, path]);
  }, []);

  const removeUploadedPhotoPath = useCallback((path: string) => {
    setPhotosPaths(prev => prev.filter(p => p !== path));
  }, []);

  const setUploadedVideoPath = useCallback((path: string | null) => {
    setVideoPath(path);
  }, []);

  const resetUploadedMedia = useCallback(() => {
    setPhotosPaths([]);
    setVideoPath(null);
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      photosLocal.forEach(photo => URL.revokeObjectURL(photo.previewUrl));
      if (videoLocal) {
        URL.revokeObjectURL(videoLocal.previewUrl);
      }
    };
  }, [photosLocal, videoLocal]);

  const state: WizardState = {
    step,
    formData,
    dobDay,
    dobMonth,
    dobYear,
    photosLocal,
    videoLocal,
    photosPaths,
    videoPath,
    // DEPRECATED
    photos,
    videoBlobUrl,
    videoBase64,
    finalCapsule,
    selectedPhoto,
    isSubmitting,
    sealingPhase,
    sealProgress,
    currentMetadata,
    errors,
    errorMessage,
  };

  // Memoize actions object to prevent unnecessary re-renders in dependent effects
  // (e.g. hydration effect in CapsuleWizard)
  const actions: WizardActions = useMemo(() => ({
    setStep,
    setFormData: (data) => {
      if (typeof data === 'function') {
        setFormData(data);
      } else {
        setFormData(prev => ({ ...prev, ...data }));
      }
    },
    setDobDay,
    setDobMonth,
    setDobYear,
    
    // Phase 3B: Local media actions
    addLocalPhotos,
    removeLocalPhoto,
    setLocalVideo,
    clearLocalMedia,
    
    // Phase 3B: Backend paths actions
    setUploadedPhotosPaths,
    addUploadedPhotoPath,
    removeUploadedPhotoPath,
    setUploadedVideoPath,
    resetUploadedMedia,
    
    // DEPRECATED: Keep for backward compatibility
    setPhotos: (photos) => {
      if (typeof photos === 'function') {
        setPhotos(photos);
      } else {
        setPhotos(photos);
      }
    },
    setVideoBlobUrl,
    setVideoBase64,
    
    setFinalCapsule,
    setSelectedPhoto,
    setIsSubmitting,
    setSealingPhase,
    setSealProgress,
    setErrors: (newErrors) => {
      setErrors(prev => ({ ...prev, ...newErrors }));
    },
    clearErrors: () => {
      setErrors({});
      setErrorMessage(null);
    },
    setErrorMessage,
    calculateAge,
  }), [
    // All setter functions are stable (from useState), so dependencies are minimal
    // But we include all action callbacks for safety
    addLocalPhotos,
    removeLocalPhoto,
    setLocalVideo,
    clearLocalMedia,
    setUploadedPhotosPaths,
    addUploadedPhotoPath,
    removeUploadedPhotoPath,
    setUploadedVideoPath,
    resetUploadedMedia,
    calculateAge,
  ]);

  return [state, actions];
};

