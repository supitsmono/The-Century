-- Test policy logic with a real capsule
-- This will show you the latest capsule and test if the policy would allow uploads

WITH latest_capsule AS (
  SELECT 
    public_id,
    state,
    created_at
  FROM public.capsules
  WHERE state IN ('draft', 'pending_payment')
  ORDER BY created_at DESC
  LIMIT 1
),
test_path AS (
  SELECT 
    lc.public_id::text || '/photos/test.jpg' as path,
    lc.public_id,
    lc.state
  FROM latest_capsule lc
)
SELECT 
  tp.path as "Test Path",
  split_part(tp.path, '/', 1) as "Extracted Public ID",
  tp.state as "Capsule State",
  EXISTS (
    SELECT 1
    FROM public.capsules c
    WHERE c.public_id::text = split_part(tp.path, '/', 1)
      AND c.state IN ('draft', 'pending_payment')
  ) as "Policy Check Passes",
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM public.capsules c
      WHERE c.public_id::text = split_part(tp.path, '/', 1)
        AND c.state IN ('draft', 'pending_payment')
    ) THEN '✅ Upload would be ALLOWED'
    ELSE '❌ Upload would be BLOCKED'
  END as "Result"
FROM test_path tp;
