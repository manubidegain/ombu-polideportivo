-- TEMPORARY: More permissive policies for debugging
-- Once we identify the issue, we'll make them more restrictive again

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tournament photos" ON storage.objects;

-- Create new policies

-- 1. Anyone can view
CREATE POLICY "Anyone can view tournament photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tournament-photos');

-- 2. TEMPORARY: Any authenticated user can upload (for testing)
CREATE POLICY "Authenticated users can upload tournament photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tournament-photos'
    AND auth.uid() IS NOT NULL
  );

-- 3. TEMPORARY: Any authenticated user can update (for testing)
CREATE POLICY "Authenticated users can update tournament photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tournament-photos'
    AND auth.uid() IS NOT NULL
  );

-- 4. TEMPORARY: Any authenticated user can delete (for testing)
CREATE POLICY "Authenticated users can delete tournament photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tournament-photos'
    AND auth.uid() IS NOT NULL
  );

-- Check if policies were created successfully
SELECT
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%tournament%';
