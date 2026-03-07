-- Allow anyone to view players for reservations accessed via share token
-- This is needed to display the player list on the public join page

CREATE POLICY "Allow public view players via share token"
  ON reservation_players
  FOR SELECT
  USING (
    -- Check that the reservation has a valid share_token (is shareable)
    reservation_id IN (
      SELECT id FROM reservations WHERE share_token IS NOT NULL
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Allow public view players via share token" ON reservation_players IS
'Allows unauthenticated users to view the player list for reservations that have been shared publicly.
Required for the public join reservation feature at /reservations/join/[token] to show existing players.';
