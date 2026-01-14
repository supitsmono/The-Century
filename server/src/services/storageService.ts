import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client (server-side only)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_BUCKET || 'capsules';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase Storage not configured. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.');
}

// Create Supabase client with service role key (has full access)
const supabase: SupabaseClient | null = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Generate storage path for media file (object key within bucket)
 * Format: {public_id}/photos/{uuid}.{ext} or {public_id}/video/{uuid}.{ext}
 * Note: Bucket name is NOT included in the path (it's specified separately in .from(bucketName))
 */
export function generateStoragePath(
  capsulePublicId: string,
  kind: 'photo' | 'video',
  fileName: string
): string {
  const extension = fileName.split('.').pop() || (kind === 'photo' ? 'jpg' : 'mp4');
  const uniqueId = uuidv4();
  const folder = kind === 'photo' ? 'photos' : 'video';
  return `${capsulePublicId}/${folder}/${uniqueId}.${extension}`;
}

/**
 * Create signed upload URL for client-side upload
 * Note: Supabase Storage doesn't have native signed upload URLs
 * Instead, we create a signed URL for PUT operations
 * Client will use this URL to upload directly
 */
export async function createSignedUploadUrl(
  path: string,
  fileSize: number,
  mimeType: string
): Promise<{ signedUrl: string; path: string }> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    // DEBUG: Log bucket, path, and method
    console.log('[DEBUG createSignedUploadUrl]');
    console.log(`  bucket: ${bucketName}`);
    console.log(`  path: ${path}`);
    console.log(`  method: createSignedUrl (Supabase Storage API)`);
    console.log(`  fileSize: ${fileSize}, mimeType: ${mimeType}`);

    // Create signed URL (valid for 1 hour) - works for PUT/upload
    const expiresIn = 3600; // 1 hour
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`[DEBUG createSignedUploadUrl] Error from Supabase:`, error);
      throw new Error(`Failed to create signed upload URL: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from signed URL creation');
    }

    console.log(`[DEBUG createSignedUploadUrl] Success - signed URL generated`);
    return {
      signedUrl: data.signedUrl,
      path: path,
    };
  } catch (error) {
    console.error(`[DEBUG createSignedUploadUrl] Exception:`, error);
    throw new Error(`Storage service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify that object exists in storage (HEAD request)
 * Used in finalize-upload to ensure upload completed successfully
 */
export async function verifyObjectExists(path: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error) {
      console.error(`Error checking object existence: ${error.message}`);
      return false;
    }

    // Check if file exists in the list
    const fileName = path.split('/').pop();
    return data?.some((item) => item.name === fileName) ?? false;
  } catch (error) {
    console.error(`Error verifying object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Get object metadata (size, mime type, etc.)
 * Used for validation in finalize-upload
 */
export async function getObjectMetadata(path: string): Promise<{ size: number; mimeType: string | null } | null> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    // Get file info from storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const fileInfo = data[0];
    return {
      size: fileInfo.metadata?.size || 0,
      mimeType: fileInfo.metadata?.mimetype || null,
    };
  } catch (error) {
    console.error(`Error getting object metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

/**
 * Delete object from storage
 * Used in remove-media endpoint
 */
export async function deleteObject(path: string): Promise<boolean> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error(`Error deleting object: ${error.message}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error deleting object: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Create signed download URL (for admin/future use)
 * Not exposed to frontend in Phase 2
 */
export async function createSignedDownloadUrl(
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase Storage not configured');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to create signed download URL: ${error?.message || 'No data'}`);
    }

    return data.signedUrl;
  } catch (error) {
    throw new Error(`Storage service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
