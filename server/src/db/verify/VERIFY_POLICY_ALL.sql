-- List all storage policies (for debugging)

SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  roles as "Roles"
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;
