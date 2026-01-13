import { useState } from 'react';

export interface UseMediaAssetsReturn {
  photos: string[];
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAudioImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removePhoto: (index: number) => void;
  setPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
}

export const useMediaAssets = (
  audioBlobUrl: string | null,
  setAudioBlobUrl: (url: string | null) => void,
  setAudioBase64: (base64: string | null) => void
): UseMediaAssetsReturn => {
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 10) {
      alert("You can only add 10 images.");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file as Blob);
    });
  };

  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Cleanup previous audio URL to prevent memory leaks
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
      const url = URL.createObjectURL(file);
      setAudioBlobUrl(url);
      
      const reader = new FileReader();
      reader.onloadend = () => setAudioBase64(reader.result as string);
      reader.onerror = () => console.error("Failed to read audio file");
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  return {
    photos,
    handlePhotoUpload,
    handleAudioImport,
    removePhoto,
    setPhotos,
  };
};

