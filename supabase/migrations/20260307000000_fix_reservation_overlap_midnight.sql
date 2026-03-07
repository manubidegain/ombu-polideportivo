-- Fix reservation overlap check to handle midnight crossings correctly
-- The issue: when using time + interval, '23:00:00' + 60 minutes = '00:00:00'
-- This causes OVERLAPS to treat it as spanning the entire day

DROP TRIGGER IF EXISTS check_reservation_overlap_trigger ON reservations;
DROP FUNCTION IF EXISTS check_reservation_overlap();

-- Recreate the function with proper timestamp handling
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
  new_start TIMESTAMP;
  new_end TIMESTAMP;
BEGIN
  -- Only check for confirmed reservations
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Create proper timestamps by combining date + time
  new_start := NEW.reservation_date + NEW.start_time;
  new_end := new_start + (NEW.duration_minutes || ' minutes')::interval;

  -- Check for overlapping reservations using timestamps
  SELECT COUNT(*) INTO overlap_count
  FROM reservations
  WHERE
    id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND court_id = NEW.court_id
    AND status = 'confirmed'
    AND (
      -- Check if time ranges overlap using proper timestamp comparison
      -- Range 1: [new_start, new_end)
      -- Range 2: [reservation_date + start_time, reservation_date + start_time + duration)
      (new_start, new_end) OVERLAPS
      (
        reservation_date + start_time,
        reservation_date + start_time + (duration_minutes || ' minutes')::interval
      )
    );

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Reservation overlaps with an existing reservation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER check_reservation_overlap_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();

-- Add comment explaining the fix
COMMENT ON FUNCTION check_reservation_overlap() IS
'Checks for overlapping reservations using timestamps instead of time to properly handle midnight crossings.
A reservation from 23:00 to 00:00 will correctly span into the next day without conflicting with other reservations on the same day.';
