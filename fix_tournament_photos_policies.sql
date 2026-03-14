-- Create a security definer function to check if user is admin
-- This allows RLS policies to check user metadata without direct access to auth.users
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing tournament_photos policies
DROP POLICY IF EXISTS "Only admins can upload photos" ON tournament_photos;
DROP POLICY IF EXISTS "Only admins can update photos" ON tournament_photos;
DROP POLICY IF EXISTS "Only admins can delete photos" ON tournament_photos;
DROP POLICY IF EXISTS "Anyone can view tournament photos" ON tournament_photos;

-- Recreate policies using the new function
CREATE POLICY "Anyone can view tournament photos"
  ON tournament_photos
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can upload photos"
  ON tournament_photos
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update photos"
  ON tournament_photos
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete photos"
  ON tournament_photos
  FOR DELETE
  USING (is_admin());

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'tournament_photos'
ORDER BY policyname;
