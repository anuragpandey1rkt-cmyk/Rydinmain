-- Events Table
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
  category VARCHAR, -- concert, fest, hackathon, sports, tech_talk, etc.
  description TEXT,
  image_url VARCHAR,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Interested Users
CREATE TABLE IF NOT EXISTS event_interested_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Hoppers Table (Ride Requests)
CREATE TABLE IF NOT EXISTS hoppers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  pickup_location VARCHAR NOT NULL,
  drop_location VARCHAR NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  drop_latitude DECIMAL(10, 8),
  drop_longitude DECIMAL(11, 8),
  date DATE NOT NULL,
  departure_time TIME NOT NULL,
  flexibility_minutes INT DEFAULT 30,
  event_id UUID REFERENCES events(id),
  status VARCHAR DEFAULT 'active', -- active, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Hopper Matches/Requests
CREATE TABLE IF NOT EXISTS hopper_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hopper_id UUID NOT NULL REFERENCES hoppers(id) ON DELETE CASCADE,
  requesting_user_id UUID NOT NULL REFERENCES profiles(id),
  requested_user_id UUID NOT NULL REFERENCES profiles(id),
  status VARCHAR DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hopper_id, requesting_user_id, requested_user_id)
);

-- Event Ride Rooms (Auto-created rides per event)
CREATE TABLE IF NOT EXISTS event_ride_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ride_type VARCHAR NOT NULL, -- 'to_event', 'from_event'
  departure_time TIME NOT NULL,
  return_time TIME,
  max_capacity INT DEFAULT 4,
  description VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event Ride Room Members
CREATE TABLE IF NOT EXISTS event_ride_room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_room_id UUID NOT NULL REFERENCES event_ride_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'joined', -- joined, left, completed
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ride_room_id, user_id)
);

-- Travel Timings (Buses, Trains, etc.)
CREATE TABLE IF NOT EXISTS shuttle_timings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name VARCHAR NOT NULL, -- e.g., "SRM to Chennai Airport"
  from_location VARCHAR NOT NULL,
  to_location VARCHAR NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME,
  frequency_minutes INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Train Info
CREATE TABLE IF NOT EXISTS train_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number VARCHAR NOT NULL,
  train_name VARCHAR,
  from_station VARCHAR,
  to_station VARCHAR,
  departure_time TIME,
  arrival_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(train_number, from_station, to_station)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_hoppers_date ON hoppers(date);
CREATE INDEX IF NOT EXISTS idx_hoppers_user ON hoppers(user_id);
CREATE INDEX IF NOT EXISTS idx_hopper_interested_users ON event_interested_users(event_id);
CREATE INDEX IF NOT EXISTS idx_event_ride_rooms_event ON event_ride_rooms(event_id);
