-- Storage Policies for Route A (FINAL - Explicit table reference)
-- 
-- FIX: Explicitly reference storage.objects.name using table-qualified column
-- In Supabase Storage RLS policies, 'name' should refer to storage.objects.name
-- but in subqueries it can be ambiguous. This version uses explicit qualification.
--
-- Run this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
-- FIX: Use explicit table reference (storage.objects.name) in subquery
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
      WHERE cap.public_id::text = (string_to_array((storage.objects.name)::text, '/'))[1]
        AND cap.state IN ('draft', 'pending_payment')
    )
  )
);
