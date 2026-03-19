-- Make customer_email, customer_phone, and user_id optional for imported reservations
-- This allows importing historical reservations from Google Calendar

ALTER TABLE reservations
  ALTER COLUMN customer_email DROP NOT NULL,
  ALTER COLUMN customer_phone DROP NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining nullable fields
COMMENT ON COLUMN reservations.customer_email IS
'Customer email. May be null for imported legacy reservations.';

COMMENT ON COLUMN reservations.customer_phone IS
'Customer phone. May be null for imported legacy reservations.';

COMMENT ON COLUMN reservations.user_id IS
'User who created the reservation. May be null for imported legacy reservations.';
