-- Debug: Check waarom policy check faalt
-- Run dit in Supabase SQL Editor om te zien wat er mis gaat

-- 1. Check latest capsule (van smoke test)
SELECT 
  public_id,
  state,
  country,
  town,
  created_at
FROM public.capsules
ORDER BY created_at DESC
LIMIT 3;

-- 2. Test policy check manually (gebruik public_id van bovenstaande query)
-- Vervang '730ed285-cd5a-444d-82a6-d7747b656648' met de public_id van je capsule
SELECT 
  '730ed285-cd5a-444d-82a6-d7747b656648/photos/test.jpg' as test_path,
  split_part('730ed285-cd5a-444d-82a6-d7747b656648/photos/test.jpg', '/', 1) as extracted_public_id,
  EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part('730ed285-cd5a-444d-82a6-d7747b656648/photos/test.jpg', '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  ) as policy_check_passes,
  (SELECT state FROM public.capsules WHERE public_id::text = split_part('730ed285-cd5a-444d-82a6-d7747b656648/photos/test.jpg', '/', 1)) as capsule_state;

-- 3. Check policy definitie
SELECT 
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname = 'Allow uploads to capsules bucket (anon)';
