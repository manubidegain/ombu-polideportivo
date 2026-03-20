-- Allow public read access to tournament_registrations
-- This is needed so unauthenticated users can view match fixtures
-- which require reading team information from registrations

CREATE POLICY "Anyone can view tournament registrations"
ON tournament_registrations
FOR SELECT
USING (true);

-- Note: This only affects SELECT operations
-- INSERT/UPDATE/DELETE are still restricted by existing policies
