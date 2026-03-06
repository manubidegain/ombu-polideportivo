-- Create table to store OAuth tokens for multi-tenant Google Calendar integration
-- Each organization/club can connect their own Google account

CREATE TABLE google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization/tenant identifier
  -- For now, we'll use a simple approach: one token per installation
  -- In the future, you could add organization_id if you want multiple tenants

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expiry_date BIGINT, -- Unix timestamp in milliseconds

  -- Google account info
  google_email VARCHAR(255),
  google_account_id VARCHAR(255),

  -- Metadata
  scope TEXT, -- Comma-separated scopes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one active token set per installation for now
  is_active BOOLEAN DEFAULT true
);

-- Index for quick lookups
CREATE INDEX idx_google_oauth_active ON google_oauth_tokens(is_active) WHERE is_active = true;

-- RLS policies - only admins can manage tokens
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view OAuth tokens" ON google_oauth_tokens
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert OAuth tokens" ON google_oauth_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update OAuth tokens" ON google_oauth_tokens
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete OAuth tokens" ON google_oauth_tokens
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_oauth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_oauth_tokens_updated_at
  BEFORE UPDATE ON google_oauth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_google_oauth_tokens_updated_at();

-- Add comment
COMMENT ON TABLE google_oauth_tokens IS 'Stores Google OAuth tokens for multi-tenant calendar integration. Each organization can connect their own Google account.';
