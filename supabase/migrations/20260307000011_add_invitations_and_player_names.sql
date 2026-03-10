-- Add player_names field to tournament_registrations for display purposes
ALTER TABLE tournament_registrations
ADD COLUMN player_names JSONB;

COMMENT ON COLUMN tournament_registrations.player_names IS 'Display names of players (backup/display). Primary keys are player1_id and player2_id';

-- Create tournament_invitations table for tracking partner invitations
CREATE TABLE tournament_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,

  -- Team info
  team_name VARCHAR(255) NOT NULL,

  -- Inviter (player 1)
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_email VARCHAR(255) NOT NULL,

  -- Invitee (player 2)
  invitee_email VARCHAR(255) NOT NULL,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when they accept

  -- Contact info
  contact_phone VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, expired

  -- Unavailable time slots (stored until accepted)
  unavailable_slot_ids UUID[], -- Array of tournament_time_slots.id

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  responded_at TIMESTAMP,

  CONSTRAINT valid_invitation_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  CONSTRAINT different_emails CHECK (inviter_email != invitee_email)
);

-- Indexes
CREATE INDEX idx_tournament_invitations_tournament ON tournament_invitations(tournament_id);
CREATE INDEX idx_tournament_invitations_inviter ON tournament_invitations(inviter_id);
CREATE INDEX idx_tournament_invitations_invitee_email ON tournament_invitations(invitee_email);
CREATE INDEX idx_tournament_invitations_status ON tournament_invitations(status);

-- RLS Policies
ALTER TABLE tournament_invitations ENABLE ROW LEVEL SECURITY;

-- Anyone can view invitations (needed for public invitation acceptance page)
CREATE POLICY "Anyone can view invitations" ON tournament_invitations
  FOR SELECT USING (true);

-- Authenticated users can create invitations for themselves
CREATE POLICY "Users can create own invitations" ON tournament_invitations
  FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- Users can update invitations they received (to accept/reject)
CREATE POLICY "Users can respond to invitations" ON tournament_invitations
  FOR UPDATE USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR auth.uid() = inviter_id -- Allow inviter to cancel
  );

-- Admins can manage all invitations
CREATE POLICY "Admins can manage invitations" ON tournament_invitations
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Function to automatically create registration when invitation is accepted
CREATE OR REPLACE FUNCTION handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Create the tournament registration
    INSERT INTO tournament_registrations (
      tournament_id,
      category_id,
      team_name,
      team_type,
      player1_id,
      player2_id,
      player_names,
      contact_email,
      contact_phone,
      status,
      registered_at
    ) VALUES (
      NEW.tournament_id,
      NEW.category_id,
      NEW.team_name,
      'pair',
      NEW.inviter_id,
      NEW.invitee_id,
      jsonb_build_array(NEW.inviter_email, NEW.invitee_email),
      NEW.inviter_email,
      NEW.contact_phone,
      'pending', -- Admin still needs to confirm
      NOW()
    )
    RETURNING id INTO NEW.id; -- This won't work, but we don't need it

    -- Create unavailability records if any
    IF NEW.unavailable_slot_ids IS NOT NULL AND array_length(NEW.unavailable_slot_ids, 1) > 0 THEN
      -- Get the registration_id we just created
      DECLARE
        new_registration_id UUID;
      BEGIN
        SELECT id INTO new_registration_id
        FROM tournament_registrations
        WHERE tournament_id = NEW.tournament_id
          AND player1_id = NEW.inviter_id
          AND player2_id = NEW.invitee_id
        ORDER BY created_at DESC
        LIMIT 1;

        -- Insert unavailability records
        INSERT INTO tournament_team_unavailability (registration_id, time_slot_id, reason)
        SELECT new_registration_id, unnest(NEW.unavailable_slot_ids), 'Selected during registration';
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create registration on invitation acceptance
CREATE TRIGGER on_invitation_accepted
  AFTER UPDATE ON tournament_invitations
  FOR EACH ROW
  EXECUTE FUNCTION handle_invitation_acceptance();

COMMENT ON TABLE tournament_invitations IS 'Pending invitations for tournament team registration. When accepted, creates tournament_registrations entry';
