-- Allow anyone to join a reservation via share token (public access)
-- This is needed for users to join reservations without authentication

CREATE POLICY "Allow public join via share token"
  ON reservation_players
  FOR INSERT
  WITH CHECK (
    -- Check that the reservation has a valid share_token (is shareable)
    reservation_id IN (
      SELECT id FROM reservations WHERE share_token IS NOT NULL
    )
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Allow public join via share token" ON reservation_players IS
'Allows unauthenticated users to join reservations that have been shared publicly.
Users can only insert their own player record with an email, not modify existing ones.
Required for the public join reservation feature at /reservations/join/[token].';
