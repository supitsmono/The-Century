-- Check if RLS is enabled on storage.objects

SELECT 
  schemaname as "Schema",
  tablename as "Table",
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as "RLS Status"
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';
