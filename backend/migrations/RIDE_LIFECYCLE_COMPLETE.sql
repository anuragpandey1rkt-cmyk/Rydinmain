-- Comprehensive Ride Lifecycle Management
-- Auto-updates ride status based on capacity and time

-- 1. Ensure rides table has all necessary status values
ALTER TABLE public.rides 
DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE public.rides 
ADD CONSTRAINT rides_status_check 
CHECK (status IN ('open', 'full', 'locked', 'completed', 'cancelled', 'expired'));

-- 2. Auto-update ride status to 'full' when all seats are taken
CREATE OR REPLACE FUNCTION auto_update_ride_status_on_member_change()
RETURNS TRIGGER AS $$
DECLARE
    v_accepted_count INTEGER;
    v_total_seats INTEGER;
    v_ride_status TEXT;
BEGIN
    -- Count accepted members in the ride
    SELECT COUNT(*) INTO v_accepted_count 
    FROM ride_members 
    WHERE ride_id = NEW.ride_id AND status = 'accepted';
    
    -- Get ride details
    SELECT seats_total, status INTO v_total_seats, v_ride_status 
    FROM rides 
    WHERE id = NEW.ride_id;
    
    -- Update ride status to 'full' if all seats are taken
    IF v_accepted_count >= v_total_seats AND v_ride_status = 'open' THEN
        UPDATE rides 
        SET status = 'full' 
        WHERE id = NEW.ride_id;
    END IF;
    
    -- Revert to 'open' if a member is removed and ride was full
    IF v_accepted_count < v_total_seats AND v_ride_status = 'full' THEN
        UPDATE rides 
        SET status = 'open' 
        WHERE id = NEW.ride_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger for auto-status updates
DROP TRIGGER IF EXISTS auto_update_ride_status_trigger ON ride_members;
CREATE TRIGGER auto_update_ride_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON ride_members
FOR EACH ROW
EXECUTE FUNCTION auto_update_ride_status_on_member_change();

-- 4. Function to expire rides that have passed
CREATE OR REPLACE FUNCTION expire_past_rides()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
    v_updated_count INTEGER;
BEGIN
    -- Mark rides as expired if departure time has passed
    -- Rides are considered expired if their datetime is more than 2 hours ago
    UPDATE rides
    SET status = 'expired'
    WHERE status IN ('open', 'full', 'locked')
    AND (date + time)::timestamp < (NOW() - INTERVAL '2 hours');
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- Mark pending ride_members as expired for those rides
    UPDATE ride_members
    SET status = 'expired'
    WHERE status IN ('pending', 'accepted')
    AND ride_id IN (SELECT id FROM rides WHERE status = 'expired');
    
    RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Function to manually expire a ride (for cleanup)
CREATE OR REPLACE FUNCTION expire_ride(p_ride_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE rides 
    SET status = 'expired'
    WHERE id = p_ride_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a scheduled job placeholder (Note: Supabase doesn't have cron, so this must be called from a backend)
-- In production, call expire_past_rides() every minute from your backend worker
CREATE OR REPLACE FUNCTION check_and_expire_rides_if_needed()
RETURNS INTEGER AS $$
BEGIN
    -- This is a utility function to be called by your backend worker/cron
    -- Call this function periodically (every 1-5 minutes) to keep rides clean
    RETURN (SELECT expired_count FROM expire_past_rides());
END;
$$ LANGUAGE plpgsql;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION expire_past_rides() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_ride(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_expire_rides_if_needed() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_update_ride_status_on_member_change() TO authenticated;

-- 8. Create index for faster expiry filtering
CREATE INDEX IF NOT EXISTS rides_date_time_status_idx ON rides(date, time, status);
