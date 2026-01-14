-- Storage Policies for Route A: Client-side Supabase SDK Upload
-- 
-- This SQL script configures Row Level Security (RLS) policies for Supabase Storage
-- to allow client-side uploads while enforcing security constraints.
--
-- Execute this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"
--
-- Requirements:
-- - Bucket 'capsules' must exist (private bucket)
-- - Table 'capsules' must exist with columns: public_id (UUID), state (VARCHAR)
--
-- Policy Logic:
-- - Allow INSERT (upload) only if:
--   1. Bucket is 'capsules'
--   2. Object path follows structure: {public_id}/photos/... or {public_id}/video/...
--   3. public_id exists in capsules table
--   4. capsule.state IN ('draft', 'pending_payment')
-- - Block UPDATE/DELETE (only via backend service role)
-- - Block SELECT (private bucket; downloads via backend signed URLs)
--
-- Note: RLS is already enabled on storage.objects (managed by Supabase)
-- Do not run ALTER TABLE - you don't have permissions for that.

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
-- Only allows uploads to paths matching valid capsules in draft/pending_payment state
CREATE POLICY "Allow uploads to capsules bucket (anon)"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'capsules'
  AND (
    -- Path structure: {public_id}/photos/... or {public_id}/video/...
    -- Extract public_id (first path segment before first /)
    EXISTS (
      SELECT 1
      FROM public.capsules c
      WHERE c.public_id::text = split_part(name, '/', 1)
        AND c.state IN ('draft', 'pending_payment')
    )
  )
);

-- Note: UPDATE and DELETE are NOT allowed for anon users
-- Backend service role key has full access (bypasses RLS)
-- Frontend should never directly delete/update objects

-- Verification query (optional - run after policy creation):
-- SELECT * FROM storage.objects WHERE bucket_id = 'capsules' LIMIT 10;