-- Drop and recreate all admin policies with correct syntax

-- Courts policies
DROP POLICY IF EXISTS "Only admins can insert courts" ON courts;
DROP POLICY IF EXISTS "Only admins can update courts" ON courts;
DROP POLICY IF EXISTS "Only admins can delete courts" ON courts;

CREATE POLICY "Only admins can insert courts" ON courts
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can update courts" ON courts
  FOR UPDATE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can delete courts" ON courts
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Timeslot configs policies
DROP POLICY IF EXISTS "Only admins can insert timeslot configs" ON timeslot_configs;
DROP POLICY IF EXISTS "Only admins can update timeslot configs" ON timeslot_configs;
DROP POLICY IF EXISTS "Only admins can delete timeslot configs" ON timeslot_configs;

CREATE POLICY "Only admins can insert timeslot configs" ON timeslot_configs
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can update timeslot configs" ON timeslot_configs
  FOR UPDATE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can delete timeslot configs" ON timeslot_configs
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Pricing rules policies
DROP POLICY IF EXISTS "Only admins can insert pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Only admins can update pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Only admins can delete pricing rules" ON pricing_rules;

CREATE POLICY "Only admins can insert pricing rules" ON pricing_rules
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can update pricing rules" ON pricing_rules
  FOR UPDATE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can delete pricing rules" ON pricing_rules
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- User profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Reservations policies
DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update any reservation" ON reservations;
DROP POLICY IF EXISTS "Admins can delete any reservation" ON reservations;

CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Admins can update any reservation" ON reservations
  FOR UPDATE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Admins can delete any reservation" ON reservations
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

-- Blocked dates policies
DROP POLICY IF EXISTS "Only admins can insert blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Only admins can update blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Only admins can delete blocked dates" ON blocked_dates;

CREATE POLICY "Only admins can insert blocked dates" ON blocked_dates
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can update blocked dates" ON blocked_dates
  FOR UPDATE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );

CREATE POLICY "Only admins can delete blocked dates" ON blocked_dates
  FOR DELETE USING (
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role'), '') = 'admin'
  );
