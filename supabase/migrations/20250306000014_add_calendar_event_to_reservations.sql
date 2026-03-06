-- Add calendar event tracking to reservations
-- This allows us to sync reservation changes with Google Calendar

ALTER TABLE reservations
ADD COLUMN calendar_event_id VARCHAR(255);

-- Add comment for clarity
COMMENT ON COLUMN reservations.calendar_event_id IS 'Google Calendar event ID for this reservation (if synced)';

-- Add index for faster lookups
CREATE INDEX idx_reservations_calendar_event_id ON reservations(calendar_event_id);
