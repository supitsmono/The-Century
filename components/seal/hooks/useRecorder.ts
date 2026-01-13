import { useState, useRef, useEffect } from 'react';

const MAX_VIDEO_DURATION = 30; // 30 seconds max

export interface UseRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  videoBlobUrl: string | null;
  videoBase64: string | null;
  isPlaying: boolean;
  isPlayingStep3: boolean;
  videoPreviewRef: React.RefObject<HTMLVideoElement>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  togglePlayback: () => void;
  togglePlaybackStep3: () => void;
  setVideoBlobUrl: (url: string | null) => void;
  setVideoBase64: (base64: string | null) => void;
  reviewVideoRef: React.RefObject<HTMLVideoElement>;
  step3VideoRef: React.RefObject<HTMLVideoElement>;
  videoInputRef: React.RefObject<HTMLInputElement>;
}

export const useRecorder = (): UseRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingStep3, setIsPlayingStep3] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const step3VideoRef = useRef<HTMLVideoElement | null>(null);

  // Cleanup video URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoBlobUrl) {
        URL.revokeObjectURL(videoBlobUrl);
      }
    };
  }, [videoBlobUrl]);

  // Setup video preview when recording starts
  useEffect(() => {
    if (isRecording && streamRef.current && videoPreviewRef.current) {
      // Ensure video element has the stream
      if (videoPreviewRef.current.srcObject !== streamRef.current) {
        videoPreviewRef.current.srcObject = streamRef.current;
      }
      // Force play in case autoplay didn't work
      videoPreviewRef.current.play().catch(err => {
        console.error("Failed to play video preview:", err);
      });
    }
  }, [isRecording]);

  // Cleanup recording resources on unmount
  useEffect(() => {
    return () => {
      // Cleanup timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      // Cleanup media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []); // Only run on mount/unmount

  const startRecording = async () => {
    try {
      // Request both video and audio with flexible constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          aspectRatio: { ideal: 16/9 }
        }, 
        audio: true 
      });
      streamRef.current = stream;

      // Set recording state first so video element is visible
      setIsRecording(true);
      
      // Try to use the best available MIME type for video
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }
      
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        
        // Validate video duration (should be max 30 seconds, but check blob duration)
        // Note: Blob doesn't have duration property, but MediaRecorder should respect max duration
        // We'll validate file size instead (rough estimate: 30s video should be < 20MB)
        const maxSize = 20 * 1024 * 1024; // 20MB
        if (blob.size > maxSize) {
          alert(`Video is too large (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maximum is ${(maxSize / 1024 / 1024).toFixed(0)}MB. Please record a shorter video.`);
          // Cleanup
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
          }
          setIsRecording(false);
          setRecordingTime(0);
          return;
        }
        
        // Cleanup previous video URL
        if (videoBlobUrl) {
          URL.revokeObjectURL(videoBlobUrl);
        }
        
        const url = URL.createObjectURL(blob);
        setVideoBlobUrl(url);
        
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setVideoBase64(base64);
        };
        reader.onerror = () => {
          console.error("Failed to read recorded video");
          alert("Failed to process video. Please try again.");
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks and clear stream reference
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
          });
          streamRef.current = null;
        }

        // Clear video preview
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };
      
      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        alert("Recording error occurred. Please try again.");
        stopRecording();
      };
      
      // Start recording with timeslice for better data handling
      recorder.start(100);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_VIDEO_DURATION) { 
            stopRecording(); 
            return MAX_VIDEO_DURATION; 
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) { 
      console.error("Recording error:", err);
      if ((err as Error).name === 'NotAllowedError' || (err as Error).name === 'PermissionDeniedError') {
        alert("Camera and microphone access needed to record. Please allow access and try again.");
      } else if ((err as Error).name === 'NotFoundError' || (err as Error).name === 'DevicesNotFoundError') {
        alert("No camera or microphone found. Please connect a device and try again.");
      } else {
        alert("Failed to start recording. Please check your camera and microphone permissions.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Clear video preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }
  };

  // Generic video playback toggle function
  const toggleVideoPlayback = (
    videoRef: React.RefObject<HTMLVideoElement>,
    isCurrentlyPlaying: boolean,
    setIsCurrentlyPlaying: (value: boolean) => void
  ) => {
    if (!videoRef.current || !videoBlobUrl) return;
    
    if (isCurrentlyPlaying) {
      videoRef.current.pause();
      setIsCurrentlyPlaying(false);
    } else {
      // Ensure src is set
      if (videoRef.current.src !== videoBlobUrl) {
        videoRef.current.src = videoBlobUrl;
      }
      videoRef.current.currentTime = 0; // Reset to start
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsCurrentlyPlaying(true);
          })
          .catch((error) => {
            console.error("Playback error:", error);
            setIsCurrentlyPlaying(false);
            alert("Failed to play video. Please try again.");
          });
      }
    }
  };
  
  // Wrapper functions for specific use cases
  const togglePlayback = () => toggleVideoPlayback(reviewVideoRef, isPlaying, setIsPlaying);
  const togglePlaybackStep3 = () => toggleVideoPlayback(step3VideoRef, isPlayingStep3, setIsPlayingStep3);

  return {
    isRecording,
    recordingTime,
    videoBlobUrl,
    videoBase64,
    isPlaying,
    isPlayingStep3,
    videoPreviewRef,
    startRecording,
    stopRecording,
    togglePlayback,
    togglePlaybackStep3,
    setVideoBlobUrl,
    setVideoBase64,
    reviewVideoRef,
    step3VideoRef,
    videoInputRef,
  };
};
