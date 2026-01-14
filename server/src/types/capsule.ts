// Shared types between frontend and backend

// Capsule state machine
export type CapsuleState = 'draft' | 'pending_payment' | 'paid' | 'sealed';

// Base capsule interface (frontend format)
export interface Capsule {
  name?: string;
  country: string;
  town: string;
  dob: string; // YYYY-MM-DD
  message: string;
  photos: string[]; // Storage paths (Phase 2) - DEPRECATED: use photosPaths
  photosPaths?: string[]; // Storage paths for photos (Phase 2)
  photosMeta?: PhotoMetadata[]; // Metadata for photos (Phase 2)
  video?: string; // Storage path (Phase 2) - DEPRECATED: use videoPath
  videoPath?: string; // Storage path for video (Phase 2)
  videoMeta?: VideoMetadata; // Metadata for video (Phase 2)
  createdAt: Date;
  ageAtCreation: number;
  openAt: Date; // Replaces archivalTimestamp (TIMESTAMPTZ)
}

// Photo metadata
export interface PhotoMetadata {
  path: string;
  size: number; // bytes
  mimeType: string;
  uploadedAt: Date;
}

// Video metadata
export interface VideoMetadata {
  path: string;
  size: number; // bytes
  mimeType: string;
  duration?: number; // seconds (optional)
  uploadedAt: Date;
}

// Database capsule (includes all DB fields)
export interface CapsuleDB {
  id: number; // Internal ID, never exposed
  public_id: string; // UUID, used in API
  name?: string;
  country: string;
  town: string;
  dob: string;
  message: string;
  photos: string[]; // DEPRECATED: Legacy base64, use photos_paths
  photos_paths?: string[]; // Storage paths for photos (Phase 2)
  photos_meta?: PhotoMetadata[]; // JSONB metadata (Phase 2)
  video?: string; // DEPRECATED: Legacy base64, use video_path
  video_path?: string; // Storage path for video (Phase 2)
  video_meta?: VideoMetadata; // JSONB metadata (Phase 2)
  createdAt: Date;
  ageAtCreation: number;
  openAt: Date;
  state: CapsuleState;
  payment_status?: string; // Legacy field, use state instead
  payment_id?: string; // Stripe payment intent/charge ID
  email?: string;
}

// Request/Response types
export interface CreateCapsuleRequest {
  capsule: Capsule;
  email?: string;
}

export interface CapsuleResponse {
  public_id: string; // Always use public_id in API responses
  message: string;
  state?: CapsuleState; // Initial state (default: "draft")
  email?: string;
}

// State transition validation
export interface StateTransition {
  from: CapsuleState;
  to: CapsuleState;
  allowed: boolean;
}