-- Fix RLS policy for tournament_team_unavailability to allow INSERT operations
-- The previous policy only had USING clause which doesn't work for INSERT

DROP POLICY IF EXISTS "Admins can manage team unavailability" ON tournament_team_unavailability;

CREATE POLICY "Admins can manage team unavailability"
  ON tournament_team_unavailability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
