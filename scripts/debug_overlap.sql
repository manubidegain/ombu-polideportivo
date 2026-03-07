-- Debug script to check for overlapping reservations
-- Run this in Supabase SQL Editor to debug the overlap issue

-- Test the exact reservation that's failing
WITH new_reservation AS (
  SELECT
    'a3eb0595-2a8d-4483-9e72-16748281cf81'::uuid AS court_id,
    '2026-03-06'::date AS reservation_date,
    '23:00:00'::time AS start_time,
    60 AS duration_minutes,
    'confirmed' AS status
)
SELECT
  r.id,
  r.reservation_date,
  r.start_time,
  r.duration_minutes,
  r.start_time + (r.duration_minutes || ' minutes')::interval AS end_time,
  -- Check OVERLAPS operator
  (
    (new_reservation.start_time, new_reservation.start_time + (new_reservation.duration_minutes || ' minutes')::interval)
    OVERLAPS
    (r.start_time, r.start_time + (r.duration_minutes || ' minutes')::interval)
  ) AS overlaps,
  -- Manual overlap check
  (
    new_reservation.start_time < r.start_time + (r.duration_minutes || ' minutes')::interval
    AND
    new_reservation.start_time + (new_reservation.duration_minutes || ' minutes')::interval > r.start_time
  ) AS manual_overlap,
  r.customer_name,
  r.customer_email
FROM
  reservations r,
  new_reservation
WHERE
  r.court_id = new_reservation.court_id
  AND r.reservation_date = new_reservation.reservation_date
  AND r.status = 'confirmed'
ORDER BY r.start_time;

-- Also check if there are any reservations the next day that might conflict
WITH new_reservation AS (
  SELECT
    'a3eb0595-2a8d-4483-9e72-16748281cf81'::uuid AS court_id,
    '2026-03-06'::date AS reservation_date,
    '23:00:00'::time AS start_time,
    60 AS duration_minutes
)
SELECT
  'Next day check' AS note,
  r.id,
  r.reservation_date,
  r.start_time,
  r.duration_minutes,
  r.customer_name
FROM
  reservations r,
  new_reservation
WHERE
  r.court_id = new_reservation.court_id
  AND r.reservation_date = new_reservation.reservation_date + interval '1 day'
  AND r.status = 'confirmed'
  AND r.start_time < '01:00:00'::time  -- Check reservations in the first hour of next day
ORDER BY r.start_time;

-- List all reservations for this court on 2026-03-06
SELECT
  id,
  reservation_date,
  start_time,
  duration_minutes,
  start_time + (duration_minutes || ' minutes')::interval AS end_time,
  status,
  customer_name,
  customer_email,
  created_at
FROM
  reservations
WHERE
  court_id = 'a3eb0595-2a8d-4483-9e72-16748281cf81'
  AND reservation_date = '2026-03-06'
ORDER BY start_time;
