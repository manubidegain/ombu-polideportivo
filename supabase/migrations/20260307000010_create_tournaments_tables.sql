-- Create tournaments system tables
-- FASE 1: Base tables for tournament management

-- Main tournaments table
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Tournament configuration
  sport_type VARCHAR(50) NOT NULL DEFAULT 'padel', -- padel, futbol
  registration_price DECIMAL(10, 2) NOT NULL DEFAULT 0,

  -- Match configuration
  sets_to_win INTEGER NOT NULL DEFAULT 2,
  games_per_set INTEGER NOT NULL DEFAULT 6,
  tiebreak_points INTEGER NOT NULL DEFAULT 7,
  match_duration_minutes INTEGER NOT NULL DEFAULT 90,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,
  registration_deadline TIMESTAMP,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, registration_open, in_progress, completed, cancelled

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'registration_open', 'in_progress', 'completed', 'cancelled'))
);

-- Tournament categories (A, B, C, etc)
CREATE TABLE tournament_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- "Categoria A", "Principiantes", etc
  description TEXT,
  max_teams INTEGER NOT NULL, -- Maximum number of teams that can register
  min_teams INTEGER DEFAULT 4, -- Minimum teams needed to start

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(tournament_id, name)
);

-- Available time slots for the tournament
CREATE TABLE tournament_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,

  -- Day and time
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_day_of_week CHECK (day_of_week >= 0 AND day_of_week <= 6),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Tournament registrations (teams sign up)
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,

  -- Team info
  team_type VARCHAR(20) NOT NULL, -- 'individual' or 'pair'
  team_name VARCHAR(255),

  -- Players
  player1_id UUID NOT NULL REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id), -- NULL for individual

  -- Contact info
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),

  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, refunded
  payment_amount DECIMAL(10, 2),
  payment_date TIMESTAMP,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, cancelled

  -- Metadata
  registered_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_team_type CHECK (team_type IN ('individual', 'pair')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  CONSTRAINT pair_requires_player2 CHECK (
    (team_type = 'pair' AND player2_id IS NOT NULL) OR
    (team_type = 'individual' AND player2_id IS NULL)
  )
);

-- Time availability (blacklist - times when team CANNOT play)
CREATE TABLE tournament_team_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  time_slot_id UUID NOT NULL REFERENCES tournament_time_slots(id) ON DELETE CASCADE,

  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(registration_id, time_slot_id)
);

-- Tournament series/groups
CREATE TABLE tournament_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES tournament_categories(id) ON DELETE CASCADE,

  -- Series info
  name VARCHAR(100) NOT NULL, -- "Serie A", "Grupo 1", etc
  series_number INTEGER NOT NULL,
  phase VARCHAR(50) NOT NULL DEFAULT 'groups', -- groups, playoffs

  -- Size
  team_count INTEGER NOT NULL, -- 3 or 4 typically

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_phase CHECK (phase IN ('groups', 'playoffs', 'finals')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Teams in series
CREATE TABLE tournament_series_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES tournament_series(id) ON DELETE CASCADE,
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,

  -- Position in series table
  position INTEGER,
  points INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_lost INTEGER DEFAULT 0,
  sets_won INTEGER DEFAULT 0,
  sets_lost INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(series_id, registration_id)
);

-- Tournament matches
CREATE TABLE tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  series_id UUID REFERENCES tournament_series(id) ON DELETE CASCADE,

  -- Teams
  team1_id UUID NOT NULL REFERENCES tournament_registrations(id),
  team2_id UUID NOT NULL REFERENCES tournament_registrations(id),

  -- Schedule
  scheduled_date DATE,
  scheduled_time TIME,
  court_id UUID REFERENCES courts(id),
  reservation_id UUID REFERENCES reservations(id), -- Link to actual reservation

  -- Result
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  winner_id UUID REFERENCES tournament_registrations(id),

  -- Score (JSON for flexibility)
  score JSONB, -- Example: {"sets": [{"team1": 6, "team2": 4}, {"team1": 7, "team2": 5}]}

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'walkover')),
  CONSTRAINT different_teams CHECK (team1_id != team2_id)
);

-- Indexes for performance
CREATE INDEX idx_tournaments_status ON tournaments(status);
CREATE INDEX idx_tournaments_start_date ON tournaments(start_date);
CREATE INDEX idx_tournament_categories_tournament ON tournament_categories(tournament_id);
CREATE INDEX idx_tournament_time_slots_tournament ON tournament_time_slots(tournament_id);
CREATE INDEX idx_tournament_time_slots_court ON tournament_time_slots(court_id);
CREATE INDEX idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_category ON tournament_registrations(category_id);
CREATE INDEX idx_tournament_registrations_player1 ON tournament_registrations(player1_id);
CREATE INDEX idx_tournament_registrations_player2 ON tournament_registrations(player2_id);
CREATE INDEX idx_tournament_series_tournament ON tournament_series(tournament_id);
CREATE INDEX idx_tournament_series_category ON tournament_series(category_id);
CREATE INDEX idx_tournament_matches_tournament ON tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_series ON tournament_matches(series_id);
CREATE INDEX idx_tournament_matches_teams ON tournament_matches(team1_id, team2_id);

-- RLS Policies

-- Tournaments: Everyone can view, only admins can create/edit
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON tournaments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tournaments" ON tournaments
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Categories: Everyone can view, only admins can manage
ALTER TABLE tournament_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON tournament_categories
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON tournament_categories
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Time slots: Everyone can view, only admins can manage
ALTER TABLE tournament_time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time slots" ON tournament_time_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage time slots" ON tournament_time_slots
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Registrations: Users can view their own and create, admins can see all
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own registrations" ON tournament_registrations
  FOR SELECT USING (
    player1_id = auth.uid() OR
    player2_id = auth.uid() OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Users can create registrations" ON tournament_registrations
  FOR INSERT WITH CHECK (
    player1_id = auth.uid() OR player2_id = auth.uid()
  );

CREATE POLICY "Users can update their own registrations" ON tournament_registrations
  FOR UPDATE USING (
    player1_id = auth.uid() OR player2_id = auth.uid()
  );

CREATE POLICY "Admins can manage all registrations" ON tournament_registrations
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Unavailability: Users can manage their own
ALTER TABLE tournament_team_unavailability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their team unavailability" ON tournament_team_unavailability
  FOR ALL USING (
    registration_id IN (
      SELECT id FROM tournament_registrations
      WHERE player1_id = auth.uid() OR player2_id = auth.uid()
    ) OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Series: Everyone can view, only admins can manage
ALTER TABLE tournament_series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series" ON tournament_series
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage series" ON tournament_series
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Series teams: Everyone can view, only admins can manage
ALTER TABLE tournament_series_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view series teams" ON tournament_series_teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage series teams" ON tournament_series_teams
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Matches: Everyone can view, only admins can manage
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view matches" ON tournament_matches
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage matches" ON tournament_matches
  FOR ALL USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Comments for documentation
COMMENT ON TABLE tournaments IS 'Main tournament configuration and metadata';
COMMENT ON TABLE tournament_categories IS 'Categories/divisions within a tournament';
COMMENT ON TABLE tournament_time_slots IS 'Available time slots for tournament matches';
COMMENT ON TABLE tournament_registrations IS 'Team registrations for tournaments';
COMMENT ON TABLE tournament_team_unavailability IS 'Time slots when teams cannot play (blacklist)';
COMMENT ON TABLE tournament_series IS 'Series/groups within a tournament';
COMMENT ON TABLE tournament_series_teams IS 'Teams assigned to series with standings';
COMMENT ON TABLE tournament_matches IS 'Individual matches between teams';
