/**
 * API Client for The Century Backend
 * 
 * All backend API calls are centralized here.
 * Uses VITE_API_URL environment variable (defaults to http://localhost:5001)
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Error handling helper
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorData.message || errorMessage;
    } catch {
      // If response is not JSON, try to get text
      try {
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      } catch {
        // Use default error message
      }
    }
    const error = new Error(errorMessage) as Error & { statusCode?: number };
    error.statusCode = response.status;
    throw error;
  }
  
  return response.json();
}

// Request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Capsule API
// ============================================================================

export interface CreateCapsulePayload {
  capsule: {
    name?: string;
    country: string;
    town: string;
    dob: string; // YYYY-MM-DD
    message: string;
    openAt?: string; // ISO datetime string
    ageAtCreation?: number; // Optional, will be calculated if not provided
  };
  email?: string;
}

export interface CreateCapsuleResponse {
  public_id: string;
  message: string;
  state?: string;
  email?: string;
}

/**
 * Create a new capsule (draft state)
 */
export async function createCapsule(payload: CreateCapsulePayload): Promise<CreateCapsuleResponse> {
  return request<CreateCapsuleResponse>('/api/capsules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface CapsuleResponse {
  id: number;
  public_id: string;
  name?: string;
  country: string;
  town: string;
  dob: string;
  message: string;
  photos: string[];
  photos_paths?: string[];
  photos_meta?: any[];
  video?: string;
  video_path?: string;
  video_meta?: any;
  createdAt: string;
  ageAtCreation: number;
  openAt: string;
  state: 'draft' | 'pending_payment' | 'paid' | 'sealed';
  payment_status?: string;
  payment_id?: string;
  email?: string;
}

/**
 * Get capsule by public_id
 */
export async function getCapsule(publicId: string): Promise<CapsuleResponse> {
  return request<CapsuleResponse>(`/api/capsules/${publicId}`);
}

// ============================================================================
// Media API
// ============================================================================

export interface CreateUploadPayload {
  capsulePublicId: string;
  kind: 'photo' | 'video';
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface CreateUploadResponse {
  path: string;
  kind: 'photo' | 'video';
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

/**
 * Create upload - Generate storage path for media file
 */
export async function createUpload(payload: CreateUploadPayload): Promise<CreateUploadResponse> {
  return request<CreateUploadResponse>('/api/capsules/media/create-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface FinalizeUploadPayload {
  capsulePublicId: string;
  kind: 'photo' | 'video';
  path: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface FinalizeUploadResponse {
  message: string;
  path: string;
  kind: 'photo' | 'video';
}

/**
 * Finalize upload - Verify file exists and link to capsule
 */
export async function finalizeUpload(payload: FinalizeUploadPayload): Promise<FinalizeUploadResponse> {
  return request<FinalizeUploadResponse>('/api/capsules/media/finalize-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface RemoveMediaPayload {
  capsulePublicId: string;
  kind: 'photo' | 'video';
  path: string;
}

export interface RemoveMediaResponse {
  message: string;
  path: string;
  kind: 'photo' | 'video';
}

/**
 * Remove media - Delete file from storage and remove from capsule
 */
export async function removeMedia(payload: RemoveMediaPayload): Promise<RemoveMediaResponse> {
  return request<RemoveMediaResponse>('/api/capsules/media/remove', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ============================================================================
// Payment API
// ============================================================================

export interface CreatePaymentIntentPayload {
  public_id: string;
  amount?: number; // Optional, defaults on backend
  currency?: string; // Optional, defaults to 'eur'
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

/**
 * Create payment intent for a capsule
 */
export async function createPaymentIntent(payload: CreatePaymentIntentPayload): Promise<CreatePaymentIntentResponse> {
  return request<CreatePaymentIntentResponse>('/api/payments/create-intent', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
