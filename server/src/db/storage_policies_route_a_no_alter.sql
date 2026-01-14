-- Storage Policies for Route A (NO ALTER TABLE - for managed storage.objects)
-- 
-- This version does NOT include ALTER TABLE because storage.objects is managed
-- and RLS is usually already enabled. If RLS is not enabled, use Supabase UI
-- to enable it, or contact Supabase support.
--
-- Run this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
CREATE POLICY "Allow uploads to capsules bucket (anon)"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'capsules'
  AND (
    EXISTS (
      SELECT 1
      FROM public.capsules c
      WHERE c.public_id::text = split_part(name, '/', 1)
        AND c.state IN ('draft', 'pending_payment')
    )
  )
);
