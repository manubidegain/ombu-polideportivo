-- Update invitation system to use email-based invitations only
-- Add invitation token for magic link invitations

ALTER TABLE reservation_players
DROP COLUMN IF EXISTS guest_name,
DROP COLUMN IF EXISTS guest_phone;

-- Add invitation token for email-based invitations
ALTER TABLE reservation_players
ADD COLUMN invitation_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN invitation_email VARCHAR(255) NOT NULL;

-- Update constraint: email is always required
ALTER TABLE reservation_players
DROP CONSTRAINT IF EXISTS reservation_players_check;

ALTER TABLE reservation_players
ADD CONSTRAINT invitation_email_or_user_required
  CHECK (user_id IS NOT NULL OR invitation_email IS NOT NULL);

-- Add index on invitation token for quick lookups
CREATE INDEX idx_reservation_players_invitation_token ON reservation_players(invitation_token);
CREATE INDEX idx_reservation_players_invitation_email ON reservation_players(invitation_email);

-- Update unique constraint to use email instead of user_id
ALTER TABLE reservation_players
DROP CONSTRAINT IF EXISTS reservation_players_reservation_id_user_id_key;

CREATE UNIQUE INDEX unique_reservation_invitation
  ON reservation_players(reservation_id, COALESCE(user_id::text, invitation_email));

-- Update RLS policies to allow invited users to view via token
DROP POLICY IF EXISTS "Users can view players for their reservations" ON reservation_players;

CREATE POLICY "Users can view players for their reservations" ON reservation_players
  FOR SELECT USING (
    -- Owner of the reservation
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    -- Invited user (registered)
    user_id = auth.uid()
    OR
    -- Admin
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Allow users to accept invitations via token (will be handled in app logic)
-- Users must be authenticated to accept
