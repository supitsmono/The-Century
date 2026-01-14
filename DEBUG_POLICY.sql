-- Debug query: Check capsule state and public_id format
-- Run this in Supabase SQL Editor to verify the capsule exists and has correct state

-- Check latest capsule
SELECT 
  public_id,
  state,
  country,
  town,
  created_at
FROM public.capsules
ORDER BY created_at DESC
LIMIT 5;

-- Check if policy exists and is enabled
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';

-- Test policy check manually (replace with actual public_id from above)
-- Example: test if path would be allowed
SELECT 
  '1f3d95d2-dd00-4c17-833f-d71b74f0b4e8/photos/test.jpg' as test_path,
  split_part('1f3d95d2-dd00-4c17-833f-d71b74f0b4e8/photos/test.jpg', '/', 1) as extracted_public_id,
  EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part('1f3d95d2-dd00-4c17-833f-d71b74f0b4e8/photos/test.jpg', '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  ) as policy_check_passes;
