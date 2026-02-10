-- ========================================
-- CRITICAL MIGRATIONS FOR RIDEMATE CONNECT
-- Run these in Supabase SQL Editor
-- ========================================

-- 1. Add status enum and locked_at to rides table
ALTER TABLE rides 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open' CHECK(status IN ('open', 'full', 'locked', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- 2. Add emergency contact fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- 3. Add payment_status to ride_members
ALTER TABLE ride_members
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid'));

-- 4. Create RPC function for atomic ride joining
CREATE OR REPLACE FUNCTION join_ride(ride_id UUID, user_id UUID)
RETURNS json AS $$
DECLARE
  v_seats_total INT;
  v_seats_taken INT;
  v_user_exists BOOLEAN;
  v_ride_status TEXT;
BEGIN
  -- Get ride details
  SELECT seats_total, seats_taken, status INTO v_seats_total, v_seats_taken, v_ride_status
  FROM rides
  WHERE id = ride_id;

  -- Check if ride exists
  IF v_seats_total IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ride not found');
  END IF;

  -- Check if ride is open to join
  IF v_ride_status NOT IN ('open', 'full') THEN
    RETURN json_build_object('success', false, 'error', 'Ride is not available for joining');
  END IF;

  -- Check if user already joined
  SELECT EXISTS(
    SELECT 1 FROM ride_members
    WHERE ride_id = $1 AND user_id = $2
  ) INTO v_user_exists;

  IF v_user_exists THEN
    RETURN json_build_object('success', false, 'error', 'You already joined this ride');
  END IF;

  -- Check seat availability
  IF v_seats_taken >= v_seats_total THEN
    RETURN json_build_object('success', false, 'error', 'No seats available');
  END IF;

  -- Atomically insert and update seats
  INSERT INTO ride_members (ride_id, user_id)
  VALUES ($1, $2);

  UPDATE rides
  SET seats_taken = seats_taken + 1
  WHERE id = $1;

  RETURN json_build_object('success', true, 'message', 'Successfully joined ride');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create index for ride lookup performance
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_host_id ON rides(host_id);
CREATE INDEX IF NOT EXISTS idx_ride_members_user_id ON ride_members(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_members_ride_id ON ride_members(ride_id);

-- 6. Enable realtime for ride_members (for live seat updates)
ALTER PUBLICATION supabase_realtime ADD TABLE ride_members;
ALTER PUBLICATION supabase_realtime ADD TABLE rides;
