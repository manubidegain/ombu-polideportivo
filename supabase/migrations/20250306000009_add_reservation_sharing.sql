-- Add public sharing functionality to reservations

ALTER TABLE reservations
ADD COLUMN share_token UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN join_approval_required BOOLEAN DEFAULT true;

-- Index for quick token lookups
CREATE INDEX idx_reservations_share_token ON reservations(share_token);

-- Comment on columns
COMMENT ON COLUMN reservations.share_token IS 'Unique token for public sharing link';
COMMENT ON COLUMN reservations.join_approval_required IS 'If true, owner must approve join requests. If false, anyone can join automatically';

-- RLS policy to allow viewing reservation by share token (without authentication)
CREATE POLICY "Anyone can view reservation via share token" ON reservations
  FOR SELECT USING (
    share_token IS NOT NULL
  );
