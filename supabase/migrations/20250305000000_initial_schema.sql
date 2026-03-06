-- Enable btree_gist extension for EXCLUDE constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =====================================================
-- TABLES
-- =====================================================

-- Courts table
CREATE TABLE courts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('padel_cerrada', 'padel_abierta', 'futbol_5', 'futbol_7')),
  is_covered BOOLEAN NOT NULL,
  has_lighting BOOLEAN NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  capacity INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Timeslot configurations table
CREATE TABLE timeslot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (60, 90)),
  requires_lighting BOOLEAN NOT NULL DEFAULT FALSE,
  max_concurrent_bookings INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(court_id, day_of_week, start_time)
);

-- Pricing rules table
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE, -- NULL = applies to all courts
  timeslot_config_id UUID REFERENCES timeslot_configs(id) ON DELETE CASCADE, -- NULL = applies to all timeslots
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- NULL = applies to all days
  start_date DATE,
  end_date DATE,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  is_promotion BOOLEAN NOT NULL DEFAULT FALSE,
  promotion_name VARCHAR(255),
  priority INTEGER NOT NULL DEFAULT 0, -- Higher priority rules override lower ones
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);

-- Users profile extension table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(20),
  whatsapp_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
  timeslot_config_id UUID NOT NULL REFERENCES timeslot_configs(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (60, 90)),
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  requires_lighting BOOLEAN NOT NULL DEFAULT FALSE,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_parent_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  recurrence_end_date DATE,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  notes TEXT,
  google_calendar_event_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (is_recurring = FALSE OR (recurrence_end_date IS NOT NULL AND recurrence_end_date > reservation_date)),
  CHECK (status != 'cancelled' OR cancelled_at IS NOT NULL)
);

-- Blocked dates table
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  court_id UUID REFERENCES courts(id) ON DELETE CASCADE, -- NULL = blocks all courts
  block_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('tournament', 'maintenance', 'other')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_time IS NULL OR end_time IS NULL OR start_time < end_time)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_courts_status ON courts(status);
CREATE INDEX idx_courts_type ON courts(type);

CREATE INDEX idx_timeslot_configs_court_id ON timeslot_configs(court_id);
CREATE INDEX idx_timeslot_configs_day_of_week ON timeslot_configs(day_of_week);
CREATE INDEX idx_timeslot_configs_is_active ON timeslot_configs(is_active);

CREATE INDEX idx_pricing_rules_court_id ON pricing_rules(court_id);
CREATE INDEX idx_pricing_rules_timeslot_config_id ON pricing_rules(timeslot_config_id);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX idx_pricing_rules_priority ON pricing_rules(priority DESC);
CREATE INDEX idx_pricing_rules_is_active ON pricing_rules(is_active);

CREATE INDEX idx_reservations_court_id ON reservations(court_id);
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_recurrence_parent_id ON reservations(recurrence_parent_id);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

CREATE INDEX idx_blocked_dates_court_id ON blocked_dates(court_id);
CREATE INDEX idx_blocked_dates_date ON blocked_dates(block_date);
CREATE INDEX idx_blocked_dates_type ON blocked_dates(type);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeslot_configs_updated_at BEFORE UPDATE ON timeslot_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocked_dates_updated_at BEFORE UPDATE ON blocked_dates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent overlapping reservations
CREATE OR REPLACE FUNCTION check_reservation_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_count INTEGER;
BEGIN
  -- Only check for confirmed reservations
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Check for overlapping reservations
  SELECT COUNT(*) INTO overlap_count
  FROM reservations
  WHERE
    id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND court_id = NEW.court_id
    AND reservation_date = NEW.reservation_date
    AND status = 'confirmed'
    AND (
      -- Check if time ranges overlap
      (NEW.start_time, NEW.start_time + (NEW.duration_minutes || ' minutes')::interval) OVERLAPS
      (start_time, start_time + (duration_minutes || ' minutes')::interval)
    );

  IF overlap_count > 0 THEN
    RAISE EXCEPTION 'Reservation overlaps with an existing reservation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservation_overlap_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_reservation_overlap();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeslot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Courts policies
CREATE POLICY "Courts are viewable by everyone" ON courts
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert courts" ON courts
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can update courts" ON courts
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can delete courts" ON courts
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Timeslot configs policies
CREATE POLICY "Timeslot configs are viewable by everyone" ON timeslot_configs
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert timeslot configs" ON timeslot_configs
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can update timeslot configs" ON timeslot_configs
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can delete timeslot configs" ON timeslot_configs
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Pricing rules policies
CREATE POLICY "Pricing rules are viewable by everyone" ON pricing_rules
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert pricing rules" ON pricing_rules
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can update pricing rules" ON pricing_rules
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can delete pricing rules" ON pricing_rules
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Reservations policies
CREATE POLICY "Users can view their own reservations" ON reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reservations" ON reservations
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Authenticated users can create reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" ON reservations
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any reservation" ON reservations
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Users can cancel their own reservations" ON reservations
  FOR DELETE USING (
    auth.uid() = user_id AND
    status = 'confirmed' AND
    (reservation_date || ' ' || start_time)::timestamp > NOW() + INTERVAL '24 hours'
  );

CREATE POLICY "Admins can delete any reservation" ON reservations
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- Blocked dates policies
CREATE POLICY "Blocked dates are viewable by everyone" ON blocked_dates
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert blocked dates" ON blocked_dates
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can update blocked dates" ON blocked_dates
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

CREATE POLICY "Only admins can delete blocked dates" ON blocked_dates
  FOR DELETE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'email' IN (SELECT email FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin')
  );

-- =====================================================
-- SEED DATA: Initial 5 Courts
-- =====================================================

INSERT INTO courts (name, type, is_covered, has_lighting, status, capacity, description) VALUES
  ('Pádel Cerrada 1', 'padel_cerrada', true, true, 'active', 1, 'Cancha de pádel cerrada con iluminación'),
  ('Pádel Cerrada 2', 'padel_cerrada', true, true, 'active', 1, 'Cancha de pádel cerrada con iluminación'),
  ('Pádel Abierta', 'padel_abierta', false, true, 'active', 1, 'Cancha de pádel abierta con iluminación'),
  ('Fútbol 5', 'futbol_5', false, true, 'active', 1, 'Cancha de fútbol 5 abierta con iluminación'),
  ('Fútbol 7', 'futbol_7', true, true, 'active', 1, 'Cancha de fútbol 7 cerrada con iluminación');
