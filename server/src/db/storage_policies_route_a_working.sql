-- Storage Policies for Route A (WORKING VERSION)
-- 
-- This version uses a simpler approach: extract public_id from path using
-- string_to_array which is more reliable in RLS policies.
--
-- Run this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"
-- 4. Verify with: SELECT policyname, with_check FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
-- Extract public_id from object path (first segment before '/')
-- Check that capsule exists and is in draft or pending_payment state
CREATE POLICY "Allow uploads to capsules bucket (anon)"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'capsules'
  AND (
    EXISTS (
      SELECT 1
      FROM public.capsules cap
      WHERE cap.public_id::text = (string_to_array(name, '/'))[1]
        AND cap.state IN ('draft', 'pending_payment')
    )
  )
);
