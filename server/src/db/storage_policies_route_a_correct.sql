-- Storage Policies for Route A (CORRECT - Use different alias to avoid name conflict)
-- 
-- FIX: Use alias 'cap' instead of 'c' to avoid name conflict with 'name' column
-- In WITH CHECK, 'name' refers to storage.objects.name (object path)
--
-- Run this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
-- FIX: Use alias 'cap' instead of 'c' to avoid name conflict
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
      WHERE cap.public_id::text = split_part(name, '/', 1)
        AND cap.state IN ('draft', 'pending_payment')
    )
  )
);
