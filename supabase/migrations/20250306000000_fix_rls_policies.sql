-- Drop all existing admin policies that query auth.users
DROP POLICY IF EXISTS "Only admins can insert courts" ON courts;
DROP POLICY IF EXISTS "Only admins can update courts" ON courts;
DROP POLICY IF EXISTS "Only admins can delete courts" ON courts;

DROP POLICY IF EXISTS "Only admins can insert timeslot configs" ON timeslot_configs;
DROP POLICY IF EXISTS "Only admins can update timeslot configs" ON timeslot_configs;
DROP POLICY IF EXISTS "Only admins can delete timeslot configs" ON timeslot_configs;

DROP POLICY IF EXISTS "Only admins can insert pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Only admins can update pricing rules" ON pricing_rules;
DROP POLICY IF EXISTS "Only admins can delete pricing rules" ON pricing_rules;

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

DROP POLICY IF EXISTS "Admins can view all reservations" ON reservations;
DROP POLICY IF EXISTS "Admins can update any reservation" ON reservations;
DROP POLICY IF EXISTS "Admins can delete any reservation" ON reservations;

DROP POLICY IF EXISTS "Only admins can insert blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Only admins can update blocked dates" ON blocked_dates;
DROP POLICY IF EXISTS "Only admins can delete blocked dates" ON blocked_dates;

-- Create new policies using ONLY auth.jwt() metadata
-- Courts policies
CREATE POLICY "Only admins can insert courts" ON courts
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can update courts" ON courts
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can delete courts" ON courts
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Timeslot configs policies
CREATE POLICY "Only admins can insert timeslot configs" ON timeslot_configs
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can update timeslot configs" ON timeslot_configs
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can delete timeslot configs" ON timeslot_configs
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Pricing rules policies
CREATE POLICY "Only admins can insert pricing rules" ON pricing_rules
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can update pricing rules" ON pricing_rules
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can delete pricing rules" ON pricing_rules
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- User profiles policies
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Reservations policies
CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update any reservation" ON reservations
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can delete any reservation" ON reservations
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Blocked dates policies
CREATE POLICY "Only admins can insert blocked dates" ON blocked_dates
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can update blocked dates" ON blocked_dates
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Only admins can delete blocked dates" ON blocked_dates
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
