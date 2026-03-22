-- Add round column to tournament_matches table
-- This column identifies the playoff round for bracket visualization and filtering

ALTER TABLE tournament_matches
ADD COLUMN round VARCHAR(50);

-- Add comment explaining the column
COMMENT ON COLUMN tournament_matches.round IS 'Playoff round identifier: round-of-16, quarter-final, semi-final, final. NULL for group stage matches.';

-- Create index for filtering by round
CREATE INDEX idx_tournament_matches_round ON tournament_matches(round) WHERE round IS NOT NULL;
