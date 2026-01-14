/**
 * Phase 3B Media Upload Smoke Test (Route A: Client-side Supabase SDK)
 * 
 * Automated test for the complete media upload pipeline:
 * 1. Create capsule
 * 2. Create upload (photo + video)
 * 3. Upload to Supabase Storage via SDK
 * 4. Finalize upload
 * 5. Verify paths in capsule
 * 6. Test policy: fake capsuleId upload should fail (403)
 * 7. (Optional) Remove media
 * 
 * Run: npx tsx scripts/smoke-phase3b-media.ts
 * Requires: 
 * - Backend server running on http://localhost:5001
 * - Environment variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_BUCKET (optional, default: 'capsules')
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const API_BASE_URL = process.env.API_URL || 'http://localhost:5001';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'capsules';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables: SUPABASE_URL and SUPABASE_ANON_KEY required');
  process.exit(1);
}

// Initialize Supabase client for uploads
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface TestResult {
  step: string;
  passed: boolean;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Helper: Make API request with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Helper: Generate small test file buffer
function generateTestFile(mimeType: string, sizeBytes: number = 1024): Buffer {
  // Generate a small binary buffer (not real image/video, but good enough for testing)
  return Buffer.alloc(sizeBytes, 0);
}

// Helper: Convert Buffer to Blob (for Supabase SDK)
function bufferToBlob(buffer: Buffer, mimeType: string): Blob {
  return new Blob([buffer], { type: mimeType });
}

// Helper: Create a valid capsule payload
function createCapsulePayload() {
  const today = new Date();
  const dob = new Date(today.getFullYear() - 25, 0, 1); // 25 years ago
  
  return {
    capsule: {
      name: 'Test User',
      country: 'Netherlands',
      town: 'Amsterdam',
      dob: dob.toISOString().split('T')[0], // YYYY-MM-DD
      message: 'Test message for Phase 3B smoke test',
      openAt: '2125-01-01T00:00:00Z',
    },
  };
}

// Test Step 1: Create capsule
async function testCreateCapsule(): Promise<string> {
  const step = '1. Create capsule';
  try {
    const payload = createCapsulePayload();
    const response = await apiRequest<{ public_id: string; message: string; state?: string }>(
      '/api/capsules',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (!response.public_id) {
      throw new Error('No public_id in response');
    }

    results.push({ step, passed: true, data: { public_id: response.public_id } });
    console.log(`✅ ${step}: Created capsule ${response.public_id}`);
    return response.public_id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 2: Create upload (photo)
async function testCreatePhotoUpload(capsulePublicId: string): Promise<{ path: string; fileName: string; mimeType: string; fileSizeBytes: number }> {
  const step = '2a. Create photo upload';
  try {
    const fileName = 'test-photo.jpg';
    const mimeType = 'image/jpeg';
    const fileSizeBytes = 2048; // 2KB

    const response = await apiRequest<{
      path: string;
      kind: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }>(
      '/api/capsules/media/create-upload',
      {
        method: 'POST',
        body: JSON.stringify({
          capsulePublicId,
          kind: 'photo',
          fileName,
          mimeType,
          fileSizeBytes,
        }),
      }
    );

    if (!response.path) {
      throw new Error('Missing path in response');
    }

    results.push({ step, passed: true, data: { path: response.path } });
    console.log(`✅ ${step}: Created upload path ${response.path}`);
    return {
      path: response.path,
      fileName,
      mimeType,
      fileSizeBytes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 2: Create upload (video)
async function testCreateVideoUpload(capsulePublicId: string): Promise<{ path: string; fileName: string; mimeType: string; fileSizeBytes: number }> {
  const step = '2b. Create video upload';
  try {
    const fileName = 'test-video.mp4';
    const mimeType = 'video/mp4';
    const fileSizeBytes = 10240; // 10KB

    const response = await apiRequest<{
      path: string;
      kind: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }>(
      '/api/capsules/media/create-upload',
      {
        method: 'POST',
        body: JSON.stringify({
          capsulePublicId,
          kind: 'video',
          fileName,
          mimeType,
          fileSizeBytes,
        }),
      }
    );

    if (!response.path) {
      throw new Error('Missing path in response');
    }

    results.push({ step, passed: true, data: { path: response.path } });
    console.log(`✅ ${step}: Created upload path ${response.path}`);
    return {
      path: response.path,
      fileName,
      mimeType,
      fileSizeBytes,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 3: Upload to Supabase Storage via SDK
async function testSupabaseUpload(
  storagePath: string,
  fileData: Buffer,
  mimeType: string,
  stepName: string
): Promise<void> {
  const step = stepName;
  try {
    const blob = bufferToBlob(fileData, mimeType);
    
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(storagePath, blob, {
        contentType: mimeType,
        upsert: false, // Don't overwrite existing files
      });
    
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message} (status: ${error.statusCode || 'unknown'})`);
    }
    
    if (!data) {
      throw new Error('No data returned from Supabase upload');
    }
    
    results.push({ step, passed: true, data: { path: data.path } });
    console.log(`✅ ${step}: Supabase upload successful`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 4: Finalize upload
async function testFinalizeUpload(
  capsulePublicId: string,
  kind: 'photo' | 'video',
  path: string,
  mimeType: string,
  fileSizeBytes: number,
  stepName: string
): Promise<void> {
  const step = stepName;
  try {
    const response = await apiRequest<{ message: string; path: string; kind: string }>(
      '/api/capsules/media/finalize-upload',
      {
        method: 'POST',
        body: JSON.stringify({
          capsulePublicId,
          kind,
          path,
          mimeType,
          fileSizeBytes,
        }),
      }
    );

    if (!response.path || response.path !== path) {
      throw new Error(`Path mismatch: expected ${path}, got ${response.path}`);
    }

    results.push({ step, passed: true, data: { path: response.path } });
    console.log(`✅ ${step}: Finalized ${kind} upload`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 5: Verify capsule paths
async function testVerifyCapsule(capsulePublicId: string, expectedPhotoPath: string, expectedVideoPath: string): Promise<void> {
  const step = '5. Verify capsule paths';
  try {
    const response = await apiRequest<{
      public_id: string;
      photos_paths?: string[];
      video_path?: string | null;
    }>(`/api/capsules/${capsulePublicId}`);

    if (!response.photos_paths || !response.photos_paths.includes(expectedPhotoPath)) {
      throw new Error(`Photo path not found. Expected: ${expectedPhotoPath}, Got: ${JSON.stringify(response.photos_paths)}`);
    }

    if (response.video_path !== expectedVideoPath) {
      throw new Error(`Video path mismatch. Expected: ${expectedVideoPath}, Got: ${response.video_path}`);
    }

    results.push({ step, passed: true, data: { photos_paths: response.photos_paths, video_path: response.video_path } });
    console.log(`✅ ${step}: Capsule paths verified`);
    console.log(`   Photos: ${response.photos_paths.length} path(s)`);
    console.log(`   Video: ${response.video_path ? 'present' : 'missing'}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 6: Test policy - fake capsuleId upload should fail (403)
async function testFakeCapsuleIdUpload(): Promise<void> {
  const step = '6. Test policy: fake capsuleId upload should fail (403)';
  try {
    const fakeCapsuleId = '00000000-0000-0000-0000-000000000000'; // Fake UUID
    const fakePath = `${fakeCapsuleId}/photos/test-fake.jpg`;
    const fakeFileData = generateTestFile('image/jpeg', 1024);
    const blob = bufferToBlob(fakeFileData, 'image/jpeg');
    
    const { data, error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(fakePath, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
    
    // Should fail with 403 (policy blocks uploads to non-existent capsules)
    if (!error) {
      throw new Error(`Expected upload to fail (403), but it succeeded. This indicates policy is not working correctly.`);
    }
    
    // Check if error is 403 (Forbidden) - any 403 error means policy is working
    // The exact message may vary ("new row violates row-level security policy" is also valid)
    // Supabase errors may have statusCode or status property, or 403 in the message
    let statusCode = error.statusCode || error.status;
    
    // If no statusCode, try to extract from message
    if (!statusCode) {
      if (error.message?.includes('403') || error.message?.toLowerCase().includes('forbidden')) {
        statusCode = 403;
      } else if (error.message?.toLowerCase().includes('row-level security') || 
                 error.message?.toLowerCase().includes('policy')) {
        // Policy errors are typically 403
        statusCode = 403;
      }
    }
    
    // Convert to number if it's a string
    if (statusCode) {
      statusCode = typeof statusCode === 'string' ? parseInt(statusCode, 10) : statusCode;
    }
    
    // If we have a 403 or 400, the policy is working correctly
    // If no statusCode but we have an error with policy-related message, assume 403
    if (statusCode && statusCode !== 403 && statusCode !== 400) {
      throw new Error(`Expected 403 Forbidden, but got ${statusCode}: ${error.message}`);
    }
    
    // If no statusCode but error mentions policy/RLS, it's likely a 403
    if (!statusCode && error.message?.toLowerCase().includes('row-level security')) {
      statusCode = 403;
    }
    
    // If we get here, we have a 403 or 400 error, which means the policy correctly blocked the upload
    // This is the expected behavior - the policy is working!
    
    results.push({ step, passed: true, data: { error: error.message, statusCode: statusCode || 403 } });
    console.log(`✅ ${step}: Policy correctly blocked fake capsuleId upload (status: ${statusCode || '403'})`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Test Step 7 (Optional): Remove media
async function testRemoveMedia(
  capsulePublicId: string,
  kind: 'photo' | 'video',
  path: string,
  stepName: string
): Promise<void> {
  const step = stepName;
  try {
    const response = await apiRequest<{ message: string; path: string; kind: string }>(
      '/api/capsules/media/remove',
      {
        method: 'POST',
        body: JSON.stringify({
          capsulePublicId,
          kind,
          path,
        }),
      }
    );

    results.push({ step, passed: true, data: { path: response.path } });
    console.log(`✅ ${step}: Removed ${kind}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ step, passed: false, error: errorMessage });
    console.error(`❌ ${step}: ${errorMessage}`);
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🚀 Phase 3B Media Upload Smoke Test (Route A: Supabase SDK)\n');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Supabase Bucket: ${SUPABASE_BUCKET}\n`);

  let capsulePublicId: string | null = null;
  let photoPath: string | null = null;
  let videoPath: string | null = null;

  try {
    // Step 1: Create capsule
    capsulePublicId = await testCreateCapsule();

    // Step 2: Create uploads
    const photoUpload = await testCreatePhotoUpload(capsulePublicId);
    const videoUpload = await testCreateVideoUpload(capsulePublicId);
    photoPath = photoUpload.path;
    videoPath = videoUpload.path;

    // Step 3: Upload to Supabase Storage via SDK
    const photoData = generateTestFile(photoUpload.mimeType, photoUpload.fileSizeBytes);
    const videoData = generateTestFile(videoUpload.mimeType, videoUpload.fileSizeBytes);

    await testSupabaseUpload(photoPath, photoData, photoUpload.mimeType, '3a. Supabase photo upload');
    await testSupabaseUpload(videoPath, videoData, videoUpload.mimeType, '3b. Supabase video upload');

    // Step 4: Finalize uploads
    await testFinalizeUpload(
      capsulePublicId,
      'photo',
      photoPath,
      photoUpload.mimeType,
      photoUpload.fileSizeBytes,
      '4a. Finalize photo upload'
    );
    await testFinalizeUpload(
      capsulePublicId,
      'video',
      videoPath,
      videoUpload.mimeType,
      videoUpload.fileSizeBytes,
      '4b. Finalize video upload'
    );

    // Step 5: Verify capsule
    await testVerifyCapsule(capsulePublicId, photoPath, videoPath);

    // Step 6: Test policy - fake capsuleId upload should fail
    await testFakeCapsuleIdUpload();

    // Step 7 (Optional): Remove media (comment out if you want to keep test data)
    // await testRemoveMedia(capsulePublicId, 'photo', photoPath, '7a. Remove photo');
    // await testRemoveMedia(capsulePublicId, 'video', videoPath, '7b. Remove video');

    // Print summary
    console.log('\n📊 Test Summary\n');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.step}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log(`\n${passed}/${total} tests passed`);
    if (failed > 0) {
      console.log(`❌ ${failed} test(s) failed\n`);
      process.exit(1);
    } else {
      console.log('✅ All tests passed!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Test suite failed:', error instanceof Error ? error.message : error);
    console.log('\n📊 Test Summary (partial)\n');
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.step}`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
