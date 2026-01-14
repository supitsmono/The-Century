-- Quick Storage Policy Verification
-- Run this ONE query to check if your policy is set up correctly

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles",
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ WITH CHECK clause present'
    ELSE '❌ No WITH CHECK clause'
  END as "Status",
  with_check as "Policy Definition"
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';
