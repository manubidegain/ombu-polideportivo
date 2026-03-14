-- Create tournament-photos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tournament-photos',
  'tournament-photos',
  true, -- public bucket so photos can be viewed by anyone
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Storage RLS Policies for tournament-photos bucket

-- Allow anyone to read/view photos
CREATE POLICY "Anyone can view tournament photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tournament-photos');

-- Allow admins to upload photos
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

-- Allow admins to update photos
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

-- Allow admins to delete photos
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

COMMENT ON POLICY "Anyone can view tournament photos" ON storage.objects IS 'Public read access for tournament photo gallery';
COMMENT ON POLICY "Admins can upload tournament photos" ON storage.objects IS 'Only admins can upload tournament photos';
COMMENT ON POLICY "Admins can update tournament photos" ON storage.objects IS 'Only admins can update tournament photos';
COMMENT ON POLICY "Admins can delete tournament photos" ON storage.objects IS 'Only admins can delete tournament photos';
