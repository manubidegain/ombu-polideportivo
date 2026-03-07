-- Allow public access to view reservations via share token
-- This is needed for the /reservations/join/[token] page to work without authentication

CREATE POLICY "Allow public access to reservations via share token"
  ON reservations
  FOR SELECT
  USING (
    share_token IS NOT NULL
  );

-- Add comment explaining the policy
COMMENT ON POLICY "Allow public access to reservations via share token" ON reservations IS
'Allows unauthenticated users to view reservation details when accessing via share token URL.
Required for the public join reservation feature at /reservations/join/[token].';
