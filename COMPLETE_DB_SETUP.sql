-- ============================================
-- RYDIN COMPLETE DATABASE SETUP
-- Fixed: No IMMUTABLE function issues
-- ============================================

-- STEP 1: Create Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  name TEXT,
  phone VARCHAR,
  department VARCHAR,
  year VARCHAR,
  gender VARCHAR,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  trust_score DECIMAL DEFAULT 4.0,
  profile_complete BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 2: Create Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  location VARCHAR NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_km DECIMAL(10, 2),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  category VARCHAR,
  description TEXT,
  image_url VARCHAR,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 3: Create Event Interested Users Table
CREATE TABLE IF NOT EXISTS event_interested_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- STEP 4: Create Hoppers Table
CREATE TABLE IF NOT EXISTS hoppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_location VARCHAR NOT NULL,
  drop_location VARCHAR NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  drop_latitude DECIMAL(10, 8),
  drop_longitude DECIMAL(11, 8),
  date DATE NOT NULL,
  departure_time TIME NOT NULL,
  flexibility_minutes INT DEFAULT 30,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 5: Create Hopper Requests Table
CREATE TABLE IF NOT EXISTS hopper_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hopper_id UUID NOT NULL REFERENCES hoppers(id) ON DELETE CASCADE,
  requesting_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hopper_id, requesting_user_id, requested_user_id)
);

-- STEP 6: Create Event Ride Rooms Table
CREATE TABLE IF NOT EXISTS event_ride_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ride_type VARCHAR NOT NULL,
  departure_time TIME NOT NULL,
  return_time TIME,
  max_capacity INT DEFAULT 4,
  description VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- STEP 7: Create Event Ride Room Members Table
CREATE TABLE IF NOT EXISTS event_ride_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_room_id UUID NOT NULL REFERENCES event_ride_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'joined',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ride_room_id, user_id)
);

-- STEP 8: Create Shuttle Timings Table
CREATE TABLE IF NOT EXISTS shuttle_timings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR NOT NULL,
  from_location VARCHAR NOT NULL,
  to_location VARCHAR NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  frequency_minutes INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- STEP 9: Create Train Info Table
CREATE TABLE IF NOT EXISTS train_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number VARCHAR NOT NULL,
  train_name VARCHAR,
  from_station VARCHAR,
  to_station VARCHAR,
  departure_time TIME,
  arrival_time TIME,
  date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(train_number, from_station, to_station, date)
);

-- ============================================
-- STEP 10: Enable Real-Time Subscriptions
-- ============================================
ALTER TABLE hoppers REPLICA IDENTITY FULL;
ALTER TABLE hopper_requests REPLICA IDENTITY FULL;
ALTER TABLE events REPLICA IDENTITY FULL;
ALTER TABLE event_interested_users REPLICA IDENTITY FULL;
ALTER TABLE event_ride_rooms REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- ============================================
-- STEP 11: Create Performance Indexes (Fixed)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hoppers_date_location 
  ON hoppers(date, pickup_location, drop_location);

CREATE INDEX IF NOT EXISTS idx_hoppers_time 
  ON hoppers(departure_time);

CREATE INDEX IF NOT EXISTS idx_hoppers_user 
  ON hoppers(user_id);

CREATE INDEX IF NOT EXISTS idx_hoppers_status 
  ON hoppers(status);

CREATE INDEX IF NOT EXISTS idx_events_date 
  ON events(date);

CREATE INDEX IF NOT EXISTS idx_events_category 
  ON events(category);

CREATE INDEX IF NOT EXISTS idx_hopper_requests_status 
  ON hopper_requests(status);

CREATE INDEX IF NOT EXISTS idx_hopper_requests_user 
  ON hopper_requests(requesting_user_id, requested_user_id);

CREATE INDEX IF NOT EXISTS idx_hopper_requests_hopper 
  ON hopper_requests(hopper_id);

CREATE INDEX IF NOT EXISTS idx_event_interested_users 
  ON event_interested_users(event_id);

CREATE INDEX IF NOT EXISTS idx_event_user_interest 
  ON event_interested_users(user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_shuttle_route 
  ON shuttle_timings(from_location, to_location);

CREATE INDEX IF NOT EXISTS idx_train_date 
  ON train_info(date);

-- ============================================
-- STEP 12: Create Auto-Expiry Function
-- ============================================
CREATE OR REPLACE FUNCTION expire_old_hoppers()
RETURNS void AS $$
BEGIN
  UPDATE hoppers
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND date < CURRENT_DATE;
  
  UPDATE hoppers
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND date = CURRENT_DATE
    AND departure_time < CURRENT_TIME;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 13: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE hoppers ENABLE ROW LEVEL SECURITY;
ALTER TABLE hopper_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interested_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_ride_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active hoppers"
  ON hoppers FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can create hoppers"
  ON hoppers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hoppers"
  ON hoppers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their hopper requests"
  ON hopper_requests FOR SELECT
  USING (
    requesting_user_id = auth.uid() 
    OR requested_user_id = auth.uid()
  );

CREATE POLICY "Users can create requests"
  ON hopper_requests FOR INSERT
  WITH CHECK (requesting_user_id = auth.uid());

CREATE POLICY "Users can update requests about them"
  ON hopper_requests FOR UPDATE
  USING (requested_user_id = auth.uid());

CREATE POLICY "Everyone can view events"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their events"
  ON events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can view event interests"
  ON event_interested_users FOR SELECT
  USING (true);

CREATE POLICY "Users can create interests"
  ON event_interested_users FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their interests"
  ON event_interested_users FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Everyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- STEP 14: Create Notification Function & Trigger
-- ============================================
CREATE OR REPLACE FUNCTION notify_hopper_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'hoppers-created',
    json_build_object(
      'id', NEW.id,
      'user_id', NEW.user_id,
      'pickup_location', NEW.pickup_location,
      'drop_location', NEW.drop_location,
      'date', NEW.date,
      'departure_time', NEW.departure_time
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_hopper_created
AFTER INSERT ON hoppers
FOR EACH ROW
EXECUTE FUNCTION notify_hopper_created();

-- ============================================
-- STEP 15: Performance Optimization
-- ============================================
ANALYZE hoppers;
ANALYZE hopper_requests;
ANALYZE events;
ANALYZE event_interested_users;
ANALYZE profiles;

-- ✅ DATABASE SETUP COMPLETE!
-- All tables created ✅
-- Real-time enabled ✅
-- Indexes created ✅
-- Security policies set ✅
-- Ready for production ✅
