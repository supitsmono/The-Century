import { z } from 'zod';

// Media limits from environment variables (with safe defaults)
const MAX_PHOTOS = parseInt(process.env.MAX_PHOTOS || '12', 10);
const MAX_PHOTO_MB = parseInt(process.env.MAX_PHOTO_MB || '5', 10);
const MAX_VIDEO_MB = parseInt(process.env.MAX_VIDEO_MB || '50', 10);

// Allowed MIME types from environment (comma-separated) or defaults
const ALLOWED_IMAGE_MIMES = process.env.ALLOWED_IMAGE_MIMES?.split(',').map(m => m.trim()) || [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_VIDEO_MIMES = process.env.ALLOWED_VIDEO_MIMES?.split(',').map(m => m.trim()) || [
  'video/mp4',
  'video/webm',
];

// Convert MB to bytes
const MAX_PHOTO_BYTES = MAX_PHOTO_MB * 1024 * 1024;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

/**
 * Create upload request schema
 */
export const createUploadSchema = z.object({
  capsulePublicId: z.string().uuid('Invalid capsule public ID'),
  kind: z.enum(['photo', 'video'], {
    errorMap: () => ({ message: 'Kind must be "photo" or "video"' }),
  }),
  fileName: z.string().min(1).max(255, 'File name too long'),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive('File size must be positive'),
}).refine((data) => {
  // Validate file size limits
  if (data.kind === 'photo' && data.fileSizeBytes > MAX_PHOTO_BYTES) {
    return false;
  }
  if (data.kind === 'video' && data.fileSizeBytes > MAX_VIDEO_BYTES) {
    return false;
  }
  return true;
}, {
  message: (data) => {
    if (data.kind === 'photo') {
      return `Photo size exceeds limit of ${MAX_PHOTO_MB}MB`;
    }
    return `Video size exceeds limit of ${MAX_VIDEO_MB}MB`;
  },
  path: ['fileSizeBytes'],
}).refine((data) => {
  // Validate MIME types
  if (data.kind === 'photo' && !ALLOWED_IMAGE_MIMES.includes(data.mimeType)) {
    return false;
  }
  if (data.kind === 'video' && !ALLOWED_VIDEO_MIMES.includes(data.mimeType)) {
    return false;
  }
  return true;
}, {
  message: (data) => {
    if (data.kind === 'photo') {
      return `MIME type not allowed. Allowed: ${ALLOWED_IMAGE_MIMES.join(', ')}`;
    }
    return `MIME type not allowed. Allowed: ${ALLOWED_VIDEO_MIMES.join(', ')}`;
  },
  path: ['mimeType'],
});

/**
 * Finalize upload request schema
 */
export const finalizeUploadSchema = z.object({
  capsulePublicId: z.string().uuid('Invalid capsule public ID'),
  kind: z.enum(['photo', 'video']),
  path: z.string().min(1, 'Path is required'),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive('File size must be positive'),
  checksum: z.string().optional(), // Optional checksum for future use
});

/**
 * Remove media request schema
 */
export const removeMediaSchema = z.object({
  capsulePublicId: z.string().uuid('Invalid capsule public ID'),
  kind: z.enum(['photo', 'video']),
  path: z.string().min(1, 'Path is required'),
});

// Export limits for use in controllers
export const MEDIA_LIMITS = {
  MAX_PHOTOS,
  MAX_PHOTO_MB,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_MB,
  MAX_VIDEO_BYTES,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
} as const;

// Type exports
export type CreateUploadInput = z.infer<typeof createUploadSchema>;
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;
export type RemoveMediaInput = z.infer<typeof removeMediaSchema>;
