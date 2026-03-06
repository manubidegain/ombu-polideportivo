-- Add players and teams functionality to reservations

-- Table for players invited to a reservation
CREATE TABLE reservation_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- NULL if guest player
  guest_name VARCHAR(255), -- Name if not a registered user
  guest_email VARCHAR(255), -- Email if not a registered user
  guest_phone VARCHAR(20), -- Phone if not a registered user
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  team_assignment VARCHAR(20) CHECK (team_assignment IN ('team_a', 'team_b', 'unassigned')),
  invited_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(reservation_id, user_id), -- Prevent duplicate invitations for same user
  CHECK (user_id IS NOT NULL OR (guest_name IS NOT NULL)) -- Either user_id or guest_name must be present
);

-- Table for team configurations (optional, stores team setup preferences)
CREATE TABLE reservation_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL UNIQUE REFERENCES reservations(id) ON DELETE CASCADE,
  team_a_name VARCHAR(100) DEFAULT 'Equipo A',
  team_b_name VARCHAR(100) DEFAULT 'Equipo B',
  team_size INTEGER, -- Players per team (NULL = flexible)
  formation_method VARCHAR(20) CHECK (formation_method IN ('manual', 'random', 'balanced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_reservation_players_reservation ON reservation_players(reservation_id);
CREATE INDEX idx_reservation_players_user ON reservation_players(user_id);
CREATE INDEX idx_reservation_players_status ON reservation_players(status);
CREATE INDEX idx_reservation_teams_reservation ON reservation_teams(reservation_id);

-- Enable RLS
ALTER TABLE reservation_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reservation_players

-- Users can view players for their own reservations or reservations they're invited to
CREATE POLICY "Users can view players for their reservations" ON reservation_players
  FOR SELECT USING (
    -- Owner of the reservation
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    -- Invited to the reservation
    user_id = auth.uid()
    OR
    -- Admin
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Reservation owners and admins can invite players
CREATE POLICY "Reservation owners can invite players" ON reservation_players
  FOR INSERT WITH CHECK (
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Players can update their own invitation status
CREATE POLICY "Players can update their invitation status" ON reservation_players
  FOR UPDATE USING (
    user_id = auth.uid()
    OR
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Reservation owners and admins can delete invitations
CREATE POLICY "Reservation owners can delete invitations" ON reservation_players
  FOR DELETE USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- RLS Policies for reservation_teams

-- Users can view team config for their reservations or reservations they're invited to
CREATE POLICY "Users can view team configs" ON reservation_teams
  FOR SELECT USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    reservation_id IN (
      SELECT reservation_id FROM reservation_players WHERE user_id = auth.uid()
    )
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Reservation owners and admins can manage team configs
CREATE POLICY "Reservation owners can manage team configs" ON reservation_teams
  FOR ALL USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE user_id = auth.uid()
    )
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservation_players_updated_at
  BEFORE UPDATE ON reservation_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_teams_updated_at
  BEFORE UPDATE ON reservation_teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
