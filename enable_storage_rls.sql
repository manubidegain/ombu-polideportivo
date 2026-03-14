-- First, check if RLS is enabled on storage.objects
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on storage.objects for tournament-photos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%tournament%')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
    END LOOP;
END $$;

-- Create policies with explicit schema reference
CREATE POLICY "Anyone can view tournament photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'tournament-photos');

CREATE POLICY "Authenticated users can upload tournament photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tournament-photos'
  );

CREATE POLICY "Authenticated users can update tournament photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tournament-photos');

CREATE POLICY "Authenticated users can delete tournament photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'tournament-photos');

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%tournament%'
ORDER BY policyname;
