-- Fix RLS policy to avoid querying auth.users table directly
-- Instead, check the JWT claim which is more efficient and doesn't require table access

DROP POLICY IF EXISTS "Admins can manage team unavailability" ON tournament_team_unavailability;

CREATE POLICY "Admins can manage team unavailability"
  ON tournament_team_unavailability
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
