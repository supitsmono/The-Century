-- Verify Storage Policy Setup
-- Run this in Supabase SQL Editor to check if the policy is correctly applied

-- 1. Check if policy exists
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';

-- 2. If no results, list all storage policies to see what exists
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 3. Test the policy logic manually (use a real capsule public_id from your database)
-- Replace '370c8c1b-aaab-41c3-93bc-71b7533bd7b2' with an actual capsule public_id
SELECT 
  '370c8c1b-aaab-41c3-93bc-71b7533bd7b2/photos/test.jpg' as test_path,
  split_part('370c8c1b-aaab-41c3-93bc-71b7533bd7b2/photos/test.jpg', '/', 1) as extracted_public_id,
  EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part('370c8c1b-aaab-41c3-93bc-71b7533bd7b2/photos/test.jpg', '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  ) as policy_check_should_pass,
  (SELECT state FROM public.capsules WHERE public_id::text = '370c8c1b-aaab-41c3-93bc-71b7533bd7b2') as capsule_state;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
