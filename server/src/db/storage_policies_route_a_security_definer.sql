-- Storage Policies for Route A: Client-side Supabase SDK Upload
-- Route 2: Using Security Definer Function (if Route 1 doesn't work)
-- 
-- Use this if you still get 403 errors after applying Route 1.
-- This uses a security definer function to bypass RLS on capsules table.
--
-- Execute this in Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this script
-- 3. Click "Run"

-- Step 1: Create security definer function
CREATE OR REPLACE FUNCTION public.can_upload_capsule_media(object_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part(object_name, '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  );
$$;

-- Step 2: Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.can_upload_capsule_media(text) TO anon, authenticated;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Step 4: Create policy using the security definer function
CREATE POLICY "Allow uploads to capsules bucket (anon)"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'capsules'
  AND (
    -- Path must contain /photos/ or /video/
    (name LIKE '%/photos/%' OR name LIKE '%/video/%')
    -- Use security definer function to check capsule
    AND public.can_upload_capsule_media(name)
  )
);

-- Note: UPDATE and DELETE are NOT allowed for anon users
-- Backend service role key has full access (bypasses RLS)
-- Frontend should never directly delete/update objects
