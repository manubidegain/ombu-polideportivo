-- Check timeslot configuration and court capacity

-- 1. Check court capacity
SELECT
  id,
  name,
  type,
  status,
  capacity,
  calendar_sync_enabled,
  calendar_id
FROM courts
WHERE id = 'a3eb0595-2a8d-4483-9e72-16748281cf81';

-- 2. Check if the 23:00 timeslot exists and is active for Thursday (day 4)
SELECT
  id,
  court_id,
  day_of_week,
  start_time,
  duration_minutes,
  max_concurrent_bookings,
  is_active,
  requires_lighting
FROM timeslot_configs
WHERE
  court_id = 'a3eb0595-2a8d-4483-9e72-16748281cf81'
  AND start_time = '23:00:00'
  AND is_active = true;

-- 3. Check the specific timeslot being used
SELECT
  id,
  court_id,
  day_of_week,
  start_time,
  duration_minutes,
  max_concurrent_bookings,
  is_active
FROM timeslot_configs
WHERE id = '2d61d657-9bee-4d3d-9a91-9dd9b4373ad9';

-- 4. Count reservations at 23:00 on 2026-03-06 (Thursday)
SELECT
  COUNT(*) as reservation_count,
  array_agg(customer_name) as customers
FROM reservations
WHERE
  court_id = 'a3eb0595-2a8d-4483-9e72-16748281cf81'
  AND reservation_date = '2026-03-06'
  AND start_time = '23:00:00'
  AND status = 'confirmed';

-- 5. Check day of week for 2026-03-06
SELECT
  '2026-03-06'::date AS date,
  EXTRACT(DOW FROM '2026-03-06'::date) AS day_of_week,
  to_char('2026-03-06'::date, 'Day') AS day_name;
