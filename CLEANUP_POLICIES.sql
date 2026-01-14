-- Cleanup: Remove duplicate storage policies
-- Run this in Supabase SQL Editor to ensure only one policy exists

-- Drop any duplicate/old policies
DROP POLICY IF EXISTS "allow_capsule_media_uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;

-- Keep only the correct policy:
-- "Allow uploads to capsules bucket (anon)"

-- Verify: Run this to check what policies exist
-- SELECT policyname, cmd, roles 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' AND tablename = 'objects';
