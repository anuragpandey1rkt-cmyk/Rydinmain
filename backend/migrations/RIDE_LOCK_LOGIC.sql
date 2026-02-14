-- ================================================================
-- RIDE LOCK LOGIC IMPLEMENTATION
-- Auto-lock when seats full, manual lock by host
-- ================================================================

-- 1. Ensure rides table has locked_at column
ALTER TABLE rides
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP;

-- 2. Create auto-lock trigger when all seats are taken
CREATE OR REPLACE FUNCTION auto_lock_ride_when_full()
RETURNS TRIGGER AS $$
BEGIN
  -- If all seats are now taken, auto-lock the ride
  IF NEW.seats_taken >= NEW.seats_total AND NEW.status != 'locked' THEN
    NEW.status := 'locked';
    NEW.locked_at := NOW();
    RAISE NOTICE 'Auto-locking ride % because all seats filled', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_lock_ride ON rides;

CREATE TRIGGER trigger_auto_lock_ride
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION auto_lock_ride_when_full();

-- 4. Create function for manual lock by host
CREATE OR REPLACE FUNCTION lock_ride_by_host(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS json AS $$
DECLARE
  v_ride_status TEXT;
  v_host_id UUID;
BEGIN
  -- Get ride and verify host
  SELECT status, host_id INTO v_ride_status, v_host_id
  FROM rides
  WHERE id = p_ride_id;

  -- Check if ride exists
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ride not found');
  END IF;

  -- Check if user is the host
  IF v_host_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Only host can lock ride');
  END IF;

  -- Check if ride is already locked/completed/cancelled
  IF v_ride_status IN ('locked', 'completed', 'cancelled') THEN
    RETURN json_build_object('success', false, 'error', 'Ride cannot be locked (already ' || v_ride_status || ')');
  END IF;

  -- Lock the ride
  UPDATE rides
  SET status = 'locked', locked_at = NOW()
  WHERE id = p_ride_id;

  RETURN json_build_object('success', true, 'message', 'Ride locked successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to unlock ride (host only, before start)
CREATE OR REPLACE FUNCTION unlock_ride_by_host(
  p_ride_id UUID,
  p_user_id UUID
)
RETURNS json AS $$
DECLARE
  v_ride_status TEXT;
  v_host_id UUID;
  v_ride_date DATE;
BEGIN
  -- Get ride info
  SELECT status, host_id, date INTO v_ride_status, v_host_id, v_ride_date
  FROM rides
  WHERE id = p_ride_id;

  -- Check if ride exists
  IF v_host_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ride not found');
  END IF;

  -- Check if user is the host
  IF v_host_id != p_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Only host can unlock ride');
  END IF;

  -- Check if ride hasn't started yet
  IF v_ride_date < CURRENT_DATE THEN
    RETURN json_build_object('success', false, 'error', 'Cannot unlock past ride');
  END IF;

  -- Check if ride is locked
  IF v_ride_status != 'locked' THEN
    RETURN json_build_object('success', false, 'error', 'Ride is not locked');
  END IF;

  -- Unlock the ride
  UPDATE rides
  SET status = 'open', locked_at = NULL
  WHERE id = p_ride_id;

  RETURN json_build_object('success', true, 'message', 'Ride unlocked successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update RLS policy - prevent edits after lock
DROP POLICY IF EXISTS "Enable update for hosts" ON rides;

CREATE POLICY "Enable update for hosts"
ON rides FOR UPDATE
USING (auth.uid() = host_id AND status != 'locked' AND status != 'completed')
WITH CHECK (auth.uid() = host_id AND status != 'locked' AND status != 'completed');

-- 7. Create index for ride status queries
CREATE INDEX IF NOT EXISTS idx_rides_locked_status ON rides(status, locked_at)
WHERE status = 'locked';

-- 8. Create index for finding active rides
CREATE INDEX IF NOT EXISTS idx_rides_active ON rides(status)
WHERE status IN ('open', 'full');

-- 9. Add notifications for lock events (optional trigger)
CREATE OR REPLACE FUNCTION notify_ride_locked()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'locked' AND OLD.status != 'locked' THEN
    PERFORM pg_notify(
      'ride-locked',
      json_build_object(
        'ride_id', NEW.id,
        'locked_at', NEW.locked_at,
        'seats_taken', NEW.seats_taken,
        'seats_total', NEW.seats_total
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_ride_locked ON rides;

CREATE TRIGGER trigger_notify_ride_locked
AFTER UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION notify_ride_locked();

SELECT '✅ Ride lock logic implemented successfully' as status;
