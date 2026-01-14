-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for 'capsules' bucket if they exist
DROP POLICY IF EXISTS "Allow uploads to capsules bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to capsules bucket (anon)" ON storage.objects;

-- Policy: Allow INSERT (upload) for anonymous users
-- FIX: Use 'name' directly (not storage.objects.name) in WITH CHECK
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
