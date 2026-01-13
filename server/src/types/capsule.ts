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
  photos: string[]; // Will be storage paths in Phase 2, base64 for now
  video?: string; // Will be storage path in Phase 2, base64 for now
  createdAt: Date;
  ageAtCreation: number;
  openAt: Date; // Replaces archivalTimestamp (TIMESTAMPTZ)
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
  photos: string[];
  video?: string;
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
  email?: string;
}

// State transition validation
export interface StateTransition {
  from: CapsuleState;
  to: CapsuleState;
  allowed: boolean;
}