-- Run this in your Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'tournament-photos';

-- 2. Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%tournament%';

-- 3. If bucket doesn't exist or policies are missing, run this:
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-photos',
  'tournament-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update tournament photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete tournament photos" ON storage.objects;

-- Create policies
CREATE POLICY "Anyone can view tournament photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tournament-photos');

CREATE POLICY "Admins can upload tournament photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tournament-photos'
    AND auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update tournament photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tournament-photos'
    AND auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete tournament photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tournament-photos'
    AND auth.uid() IN (
      SELECT id FROM auth.users
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );
*/
