-- Create tournament_photos table for storing photo gallery
CREATE TABLE IF NOT EXISTS tournament_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Path in Supabase Storage: tournaments/{tournament_id}/{filename}
  file_name TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_tournament_file_path UNIQUE (tournament_id, file_path)
);

-- Indexes for performance
CREATE INDEX idx_tournament_photos_tournament_id ON tournament_photos(tournament_id);
CREATE INDEX idx_tournament_photos_featured ON tournament_photos(tournament_id, is_featured) WHERE is_featured = true;
CREATE INDEX idx_tournament_photos_order ON tournament_photos(tournament_id, display_order);

-- RLS Policies
ALTER TABLE tournament_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos
CREATE POLICY "Anyone can view tournament photos"
  ON tournament_photos
  FOR SELECT
  USING (true);

-- Only admins can upload photos
CREATE POLICY "Only admins can upload photos"
  ON tournament_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can update photos
CREATE POLICY "Only admins can update photos"
  ON tournament_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Only admins can delete photos
CREATE POLICY "Only admins can delete photos"
  ON tournament_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create storage bucket for tournament photos (if not exists)
-- Note: This needs to be run via Supabase Dashboard or manually
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tournament-photos', 'tournament-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for tournament photos bucket
-- Note: These need to be set up in Supabase Dashboard
-- 1. Allow public read access to tournament-photos bucket
-- 2. Allow admins to upload to tournament-photos bucket
-- 3. Allow admins to delete from tournament-photos bucket

COMMENT ON TABLE tournament_photos IS 'Stores tournament photo gallery images';
COMMENT ON COLUMN tournament_photos.file_path IS 'Full path in Supabase Storage bucket';
COMMENT ON COLUMN tournament_photos.display_order IS 'Order for displaying photos in gallery (lower = first)';
COMMENT ON COLUMN tournament_photos.is_featured IS 'Whether this photo is featured on tournament page';
