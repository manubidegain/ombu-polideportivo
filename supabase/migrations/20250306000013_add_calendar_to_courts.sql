-- Add Google Calendar integration to courts
-- Each court can be linked to a specific Google Calendar

ALTER TABLE courts
ADD COLUMN calendar_id VARCHAR(255),
ADD COLUMN calendar_sync_enabled BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN courts.calendar_id IS 'Google Calendar ID for this court (e.g., primary or custom calendar ID)';
COMMENT ON COLUMN courts.calendar_sync_enabled IS 'Whether automatic calendar sync is enabled for this court';
