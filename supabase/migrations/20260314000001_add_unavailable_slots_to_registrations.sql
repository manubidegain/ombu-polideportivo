-- Add unavailable_slot_ids column to tournament_registrations
ALTER TABLE tournament_registrations
ADD COLUMN unavailable_slot_ids UUID[];

COMMENT ON COLUMN tournament_registrations.unavailable_slot_ids IS 'Array of tournament_time_slots.id that the team is unavailable for';

-- Index for better query performance
CREATE INDEX idx_tournament_registrations_unavailable_slots
ON tournament_registrations USING GIN (unavailable_slot_ids);
