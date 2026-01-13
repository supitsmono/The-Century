import { useState, useMemo } from 'react';
import { Capsule } from '../../../types';
import { MONTHS } from '../data/constants';

export interface WizardFormData {
  name: string;
  country: string;
  town: string;
  message: string;
}

export interface WizardState {
  step: number;
  formData: WizardFormData;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  photos: string[];
  videoBlobUrl: string | null;
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
  setPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
  setVideoBlobUrl: (url: string | null) => void;
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

  const state: WizardState = {
    step,
    formData,
    dobDay,
    dobMonth,
    dobYear,
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

  const actions: WizardActions = {
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
  };

  return [state, actions];
};

