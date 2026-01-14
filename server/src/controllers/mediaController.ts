import { Request, Response } from 'express';
import { pool } from '../db/connection.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { createUploadSchema, finalizeUploadSchema, removeMediaSchema, MEDIA_LIMITS } from '../validation/mediaSchemas.js';
import { generateStoragePath, verifyObjectExists, getObjectMetadata, deleteObject } from '../services/storageService.js';
import { PhotoMetadata, VideoMetadata } from '../types/capsule.js';

/**
 * Create upload - Generate storage path for client-side upload
 * 
 * Route A: Client-side Supabase SDK upload
 * This endpoint validates and generates a path; the client uploads directly via Supabase SDK.
 * 
 * Client flow:
 * 1. Call this endpoint to get validated path
 * 2. Upload file directly to Supabase Storage using frontend SDK (supabase.storage.from('capsules').upload(path, file))
 * 3. Call finalize-upload to verify and link to capsule
 */
export const createUpload = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validationResult = createUploadSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors
      ? validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      : validationResult.error.message || 'Validation failed';
    const error = new Error(`Validation failed: ${errorMessages}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const { capsulePublicId, kind, fileName, mimeType, fileSizeBytes } = validationResult.data;

  // Verify capsule exists
  const capsuleQuery = 'SELECT id, state FROM capsules WHERE public_id = $1';
  const capsuleResult = await pool.query(capsuleQuery, [capsulePublicId]);

  if (capsuleResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const capsule = capsuleResult.rows[0];

  // Verify capsule state allows uploads (draft or pending_payment)
  if (capsule.state !== 'draft' && capsule.state !== 'pending_payment') {
    const error = new Error(`Capsule state '${capsule.state}' does not allow uploads. Only 'draft' and 'pending_payment' states allow uploads.`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  // Check photo count limit (for photos only)
  if (kind === 'photo') {
    const photoCountQuery = 'SELECT COALESCE(array_length(photos_paths, 1), 0) as count FROM capsules WHERE public_id = $1';
    const photoCountResult = await pool.query(photoCountQuery, [capsulePublicId]);
    const currentPhotoCount = parseInt(photoCountResult.rows[0]?.count || '0', 10);

    if (currentPhotoCount >= MEDIA_LIMITS.MAX_PHOTOS) {
      const error = new Error(`Photo limit reached. Maximum ${MEDIA_LIMITS.MAX_PHOTOS} photos allowed.`) as Error & { statusCode?: number };
      error.statusCode = 400;
      throw error;
    }
  }

  // Generate storage path
  const path = generateStoragePath(capsulePublicId, kind, fileName);

  // Return path and metadata (client uploads directly via Supabase SDK)
  res.status(200).json({
    path,
    kind,
    fileName,
    mimeType,
    fileSizeBytes,
  });
});

/**
 * Finalize upload - Verify file exists and link to capsule
 * Idempotent: can be called multiple times with same path
 * 
 * Cleanup/retry policy:
 * - If create-upload is done but upload fails: client can create new upload (new path), old path becomes orphan → TODO: orphan cleanup job
 * - If upload succeeds but finalize fails: endpoint is idempotent (same path can be finalized again)
 */
export const finalizeUpload = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validationResult = finalizeUploadSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors
      ? validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      : validationResult.error.message || 'Validation failed';
    const error = new Error(`Validation failed: ${errorMessages}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const { capsulePublicId, kind, path, mimeType, fileSizeBytes } = validationResult.data;

  // Verify capsule exists
  const capsuleQuery = 'SELECT id, state, photos_paths, video_path FROM capsules WHERE public_id = $1';
  const capsuleResult = await pool.query(capsuleQuery, [capsulePublicId]);

  if (capsuleResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const capsule = capsuleResult.rows[0];

  // Object-exists check: verify file exists in storage (HEAD/list)
  const objectExists = await verifyObjectExists(path);
  if (!objectExists) {
    // TODO: If HEAD/list fails, fallback to server-side check via metadata
    // For now, return error if object doesn't exist
    const error = new Error('Upload not found in storage. Please upload the file first.') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  // Get object metadata for validation
  const metadata = await getObjectMetadata(path);
  if (metadata) {
    // Validate size matches (with some tolerance for metadata differences)
    if (Math.abs(metadata.size - fileSizeBytes) > 1024) { // Allow 1KB difference
      console.warn(`Size mismatch: expected ${fileSizeBytes}, got ${metadata.size}`);
    }
    // Validate MIME type matches (optional, storage might not preserve exact MIME)
    if (metadata.mimeType && metadata.mimeType !== mimeType) {
      console.warn(`MIME type mismatch: expected ${mimeType}, got ${metadata.mimeType}`);
    }
  }

  // Create metadata object
  const uploadedAt = new Date();
  const fileMetadata = kind === 'photo'
    ? ({
        path,
        size: fileSizeBytes,
        mimeType,
        uploadedAt,
      } as PhotoMetadata)
    : ({
        path,
        size: fileSizeBytes,
        mimeType,
        uploadedAt,
      } as VideoMetadata);

  // Update capsule in database (idempotent: check if path already exists)
  if (kind === 'photo') {
    const currentPaths = (capsule.photos_paths || []) as string[];
    const currentMeta = (capsule.photos_meta || []) as PhotoMetadata[];

    // Check if path already exists (idempotency)
    if (currentPaths.includes(path)) {
      // Already finalized, return success
      return res.status(200).json({
        message: 'Upload already finalized',
        path,
        kind,
      });
    }

    // Add to paths and metadata
    const newPaths = [...currentPaths, path];
    const newMeta = [...currentMeta, fileMetadata];

    // Check photo limit
    if (newPaths.length > MEDIA_LIMITS.MAX_PHOTOS) {
      const error = new Error(`Photo limit exceeded. Maximum ${MEDIA_LIMITS.MAX_PHOTOS} photos allowed.`) as Error & { statusCode?: number };
      error.statusCode = 400;
      throw error;
    }

    const updateQuery = `
      UPDATE capsules
      SET photos_paths = $1, photos_meta = $2
      WHERE public_id = $3
      RETURNING public_id
    `;
    await pool.query(updateQuery, [newPaths, JSON.stringify(newMeta), capsulePublicId]);
  } else {
    // Video: replace existing video (only one video allowed)
    const currentPath = capsule.video_path as string | null;
    const currentMeta = capsule.video_meta as VideoMetadata | null;

    // If same path, already finalized (idempotency)
    if (currentPath === path) {
      return res.status(200).json({
        message: 'Upload already finalized',
        path,
        kind,
      });
    }

    // Delete old video if exists and different path
    if (currentPath && currentPath !== path) {
      await deleteObject(currentPath);
    }

    const updateQuery = `
      UPDATE capsules
      SET video_path = $1, video_meta = $2
      WHERE public_id = $3
      RETURNING public_id
    `;
    await pool.query(updateQuery, [path, JSON.stringify(fileMetadata), capsulePublicId]);
  }

  res.status(200).json({
    message: 'Upload finalized successfully',
    path,
    kind,
  });
});

/**
 * Remove media - Delete file from storage and remove from capsule
 */
export const removeMedia = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validationResult = removeMediaSchema.safeParse(req.body);
  if (!validationResult.success) {
    const errorMessages = validationResult.error.errors
      ? validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      : validationResult.error.message || 'Validation failed';
    const error = new Error(`Validation failed: ${errorMessages}`) as Error & { statusCode?: number };
    error.statusCode = 400;
    throw error;
  }

  const { capsulePublicId, kind, path } = validationResult.data;

  // Verify capsule exists
  const capsuleQuery = 'SELECT id, photos_paths, video_path FROM capsules WHERE public_id = $1';
  const capsuleResult = await pool.query(capsuleQuery, [capsulePublicId]);

  if (capsuleResult.rows.length === 0) {
    const error = new Error('Capsule not found') as Error & { statusCode?: number };
    error.statusCode = 404;
    throw error;
  }

  const capsule = capsuleResult.rows[0];

  // Remove from database and storage
  if (kind === 'photo') {
    const currentPaths = (capsule.photos_paths || []) as string[];
    const currentMeta = (capsule.photos_meta || []) as PhotoMetadata[];

    if (!currentPaths.includes(path)) {
      const error = new Error('Photo not found in capsule') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    const newPaths = currentPaths.filter(p => p !== path);
    const newMeta = currentMeta.filter(m => m.path !== path);

    const updateQuery = `
      UPDATE capsules
      SET photos_paths = $1, photos_meta = $2
      WHERE public_id = $3
      RETURNING public_id
    `;
    await pool.query(updateQuery, [newPaths, JSON.stringify(newMeta), capsulePublicId]);

    // Delete from storage (best effort, don't fail if file doesn't exist)
    await deleteObject(path);
  } else {
    const currentPath = capsule.video_path as string | null;

    if (currentPath !== path) {
      const error = new Error('Video not found in capsule') as Error & { statusCode?: number };
      error.statusCode = 404;
      throw error;
    }

    const updateQuery = `
      UPDATE capsules
      SET video_path = NULL, video_meta = NULL
      WHERE public_id = $1
      RETURNING public_id
    `;
    await pool.query(updateQuery, [capsulePublicId]);

    // Delete from storage (best effort)
    await deleteObject(path);
  }

  res.status(200).json({
    message: 'Media removed successfully',
    path,
    kind,
  });
});
