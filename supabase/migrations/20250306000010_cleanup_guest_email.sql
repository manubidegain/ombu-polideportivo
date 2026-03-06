-- Remove guest_email column that was not properly dropped in previous migration

ALTER TABLE reservation_players
DROP COLUMN IF EXISTS guest_email;
