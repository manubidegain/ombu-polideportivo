-- Refactor tournament_team_unavailability to use day + time ranges instead of time_slot_id
-- This allows teams to say "I can't play Friday 8am-11am" without being tied to specific court slots

-- Remove the old unavailable_slot_ids column from tournament_registrations if it exists
DROP INDEX IF EXISTS idx_tournament_registrations_unavailable_slots;
ALTER TABLE tournament_registrations DROP COLUMN IF EXISTS unavailable_slot_ids CASCADE;

-- Drop the old table and recreate with new schema
DROP TABLE IF EXISTS tournament_team_unavailability CASCADE;

CREATE TABLE tournament_team_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES tournament_registrations(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure start_time < end_time
  CONSTRAINT valid_time_range CHECK (start_time < end_time),

  -- Prevent duplicate/overlapping ranges for same team on same day
  UNIQUE(registration_id, day_of_week, start_time, end_time)
);

-- Add indexes for performance
CREATE INDEX idx_team_unavailability_registration ON tournament_team_unavailability(registration_id);
CREATE INDEX idx_team_unavailability_day ON tournament_team_unavailability(day_of_week);

-- Enable RLS
ALTER TABLE tournament_team_unavailability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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
  );

CREATE POLICY "Teams can view their own unavailability"
  ON tournament_team_unavailability
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournament_registrations tr
      WHERE tr.id = tournament_team_unavailability.registration_id
      AND (tr.player1_id = auth.uid() OR tr.player2_id = auth.uid())
    )
  );

COMMENT ON TABLE tournament_team_unavailability IS
'Stores time ranges when teams cannot play, independent of court schedules.
Example: "Cannot play Friday 8am-11am due to work"';

COMMENT ON COLUMN tournament_team_unavailability.day_of_week IS
'Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';

COMMENT ON COLUMN tournament_team_unavailability.start_time IS
'Start of unavailable time range (e.g., 08:00:00)';

COMMENT ON COLUMN tournament_team_unavailability.end_time IS
'End of unavailable time range (e.g., 11:00:00)';
