-- Add approval system fields to tournament_matches
ALTER TABLE tournament_matches
ADD COLUMN IF NOT EXISTS score_submitted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS score_status VARCHAR(20) DEFAULT 'not_submitted' CHECK (score_status IN ('not_submitted', 'pending_approval', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS score_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS score_approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS score_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tournament_matches_score_status ON tournament_matches(score_status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_submitted_by ON tournament_matches(score_submitted_by);

-- Update existing completed matches to have approved status
UPDATE tournament_matches
SET score_status = 'approved'
WHERE status = 'completed' AND score_status = 'not_submitted';
