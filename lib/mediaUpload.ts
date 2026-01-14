/**
 * Phase 3B: Media Upload Helper
 * 
 * Stateless upload orchestrator for photos and video.
 * Flow: create-upload → Supabase SDK upload → finalize-upload
 * 
 * Features:
 * - Per-file status progress (queued → uploading → uploaded → finalized → failed)
 * - Limited concurrency (default: 2 for photos, 1 for video)
 * - Retry logic (network/5xx errors only)
 * - Cleanup on finalize failure (remove uploaded file)
 * - Idempotency check (skip if path already exists)
 */

import { createUpload, finalizeUpload, removeMedia, CreateUploadResponse, FinalizeUploadResponse } from './api';
import { supabase, bucketName } from './supabase';

// Upload status per file
export type UploadStatus = 'queued' | 'uploading' | 'uploaded' | 'finalized' | 'failed';

// Callback types
export interface UploadCallbacks {
  onStatus?: (id: string, status: UploadStatus) => void;
  onError?: (id: string, error: Error) => void;
  onOverall?: (status: 'uploading' | 'completed' | 'failed') => void;
}

// Photo upload result
export interface PhotoUploadResult {
  paths: string[];
  failures?: Array<{ id: string; reason: string }>;
}

// Video upload result
export interface VideoUploadResult {
  path: string | null;
  error?: Error;
}

// Local photo item (from wizard state)
export interface LocalPhotoItem {
  file: File;
  previewUrl: string;
  id: string;
}

// Local video item (from wizard state)
export interface LocalVideoItem {
  file: File;
  previewUrl: string;
  id: string;
}

// Upload configuration
const DEFAULT_CONCURRENCY = 2; // Max concurrent photo uploads
const MAX_RETRIES = 2; // Max retries for network errors
const RETRY_DELAY_MS = 1000; // Initial retry delay

/**
 * Check if error is retryable (network/5xx, not 4xx validation)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Check statusCode (from our API client or Supabase)
  if (error.statusCode) {
    const status = error.statusCode;
    // Retry on network errors (no statusCode) or 5xx server errors
    // Don't retry on 4xx client errors (validation, auth, etc.)
    return status >= 500;
  }
  
  // Supabase Storage errors (from error.status)
  if (error.status) {
    return error.status >= 500;
  }
  
  // Network errors (no statusCode) are retryable
  return error.message?.includes('Network error') || error.message?.includes('Failed to fetch');
}

/**
 * Retry helper with exponential backoff
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if not retryable or last attempt
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  throw lastError!;
}

/**
 * Upload single photo file
 */
async function uploadPhotoFile(
  capsuleId: string,
  photo: LocalPhotoItem,
  existingPaths: string[],
  callbacks?: UploadCallbacks
): Promise<string | null> {
  const { file, id } = photo;
  
  // Check idempotency: skip if already uploaded
  // (This is a simple check; backend also has state machine checks)
  const fileName = file.name;
  const existingPath = existingPaths.find(path => path.includes(fileName));
  if (existingPath) {
    callbacks?.onStatus?.(id, 'finalized');
    return existingPath;
  }
  
  let uploadedPath: string | null = null; // Track path for cleanup
  let isInFinalizePhase = false; // Track if we're in finalize phase (for cleanup)
  
  try {
    callbacks?.onStatus?.(id, 'queued');
    callbacks?.onStatus?.(id, 'uploading');
    
    // Step 1: Create upload (get validated path)
    const createResponse = await retry(
      () => createUpload({
        capsulePublicId: capsuleId,
        kind: 'photo',
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
      1 // 1 retry for create-upload (usually not needed)
    );
    
    const { path } = createResponse;
    uploadedPath = path; // Store path for cleanup
    
    // Step 2: Upload to Supabase Storage via SDK
    if (!supabase) {
      throw new Error('Supabase client not configured. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required.');
    }
    
    const uploadResponse = await retry(
      async () => {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(path, file, {
            contentType: file.type,
            upsert: false, // Don't overwrite existing files
          });
        
        if (error) {
          throw new Error(`Upload failed: ${error.message} (status: ${error.statusCode || 'unknown'})`);
        }
        
        return data;
      },
      MAX_RETRIES // Retry Supabase upload (network/5xx)
    );
    
    callbacks?.onStatus?.(id, 'uploaded');
    isInFinalizePhase = true; // Mark that we're now in finalize phase
    
    // Step 3: Finalize upload
    const finalizeResponse = await retry(
      () => finalizeUpload({
        capsulePublicId: capsuleId,
        kind: 'photo',
        path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
      MAX_RETRIES // Retry finalize (idempotent-ish)
    );
    
    callbacks?.onStatus?.(id, 'finalized');
    return path;
    
  } catch (error) {
    const err = error as Error;
    callbacks?.onStatus?.(id, 'failed');
    callbacks?.onError?.(id, err);
    
    // Cleanup: If upload succeeded but finalize failed, try to remove the file using the original path
    // (This is best-effort; backend will also clean up orphans)
    if (uploadedPath && isInFinalizePhase) {
      try {
        await removeMedia({
          capsulePublicId: capsuleId,
          kind: 'photo',
          path: uploadedPath, // Use the original path from create-upload
        });
      } catch (cleanupError) {
        // Log cleanup failure but don't block user flow (best-effort)
        console.warn('Cleanup failed (best-effort, file may remain orphaned):', cleanupError);
      }
    }
    
    throw err;
  }
}

/**
 * Upload photos with concurrency control
 */
export async function uploadPhotos(
  capsuleId: string,
  photos: LocalPhotoItem[],
  existingPaths: string[] = [],
  callbacks?: UploadCallbacks,
  concurrency: number = DEFAULT_CONCURRENCY
): Promise<PhotoUploadResult> {
  if (photos.length === 0) {
    return { paths: [] };
  }
  
  callbacks?.onOverall?.('uploading');
  
  const paths: string[] = [];
  const failures: Array<{ id: string; reason: string }> = [];
  
  // Upload in batches with concurrency limit
  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(
      batch.map(photo => uploadPhotoFile(capsuleId, photo, existingPaths, callbacks))
    );
    
    batchResults.forEach((result, index) => {
      const photo = batch[index];
      if (result.status === 'fulfilled' && result.value) {
        paths.push(result.value);
      } else {
        const reason = result.status === 'rejected' 
          ? result.reason?.message || 'Upload failed'
          : 'Upload failed (unknown error)';
        failures.push({ id: photo.id, reason });
      }
    });
  }
  
  const overallStatus = failures.length === 0 ? 'completed' : (paths.length > 0 ? 'completed' : 'failed');
  callbacks?.onOverall?.(overallStatus);
  
  return {
    paths,
    ...(failures.length > 0 && { failures }),
  };
}

/**
 * Upload video file (always solo, no concurrency)
 */
export async function uploadVideo(
  capsuleId: string,
  video: LocalVideoItem,
  existingPath: string | null = null,
  callbacks?: UploadCallbacks
): Promise<VideoUploadResult> {
  const { file, id } = video;
  
  // Check idempotency: skip if already uploaded
  if (existingPath) {
    callbacks?.onStatus?.(id, 'finalized');
    return { path: existingPath };
  }
  
  let uploadedPath: string | null = null; // Track path for cleanup
  let isInFinalizePhase = false; // Track if we're in finalize phase (for cleanup)
  
  try {
    callbacks?.onStatus?.(id, 'queued');
    callbacks?.onStatus?.(id, 'uploading');
    callbacks?.onOverall?.('uploading');
    
    // Step 1: Create upload (get validated path)
    const createResponse = await retry(
      () => createUpload({
        capsulePublicId: capsuleId,
        kind: 'video',
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
      1 // 1 retry for create-upload
    );
    
    const { path } = createResponse;
    uploadedPath = path; // Store path for cleanup
    
    // Step 2: Upload to Supabase Storage via SDK
    if (!supabase) {
      throw new Error('Supabase client not configured. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required.');
    }
    
    const uploadResponse = await retry(
      async () => {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(path, file, {
            contentType: file.type,
            upsert: false, // Don't overwrite existing files
          });
        
        if (error) {
          throw new Error(`Upload failed: ${error.message} (status: ${error.statusCode || 'unknown'})`);
        }
        
        return data;
      },
      MAX_RETRIES // Retry Supabase upload (network/5xx)
    );
    
    callbacks?.onStatus?.(id, 'uploaded');
    isInFinalizePhase = true; // Mark that we're now in finalize phase
    
    // Step 3: Finalize upload
    const finalizeResponse = await retry(
      () => finalizeUpload({
        capsulePublicId: capsuleId,
        kind: 'video',
        path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      }),
      MAX_RETRIES // Retry finalize
    );
    
    callbacks?.onStatus?.(id, 'finalized');
    callbacks?.onOverall?.('completed');
    
    return { path };
    
  } catch (error) {
    const err = error as Error;
    callbacks?.onStatus?.(id, 'failed');
    callbacks?.onError?.(id, err);
    callbacks?.onOverall?.('failed');
    
    // Cleanup: If upload succeeded but finalize failed, try to remove the file using the original path
    // (This is best-effort; backend will also clean up orphans)
    if (uploadedPath && isInFinalizePhase) {
      try {
        await removeMedia({
          capsulePublicId: capsuleId,
          kind: 'video',
          path: uploadedPath, // Use the original path from create-upload
        });
      } catch (cleanupError) {
        // Log cleanup failure but don't block user flow (best-effort)
        console.warn('Cleanup failed (best-effort, file may remain orphaned):', cleanupError);
      }
    }
    
    return { path: null, error: err };
  }
}
