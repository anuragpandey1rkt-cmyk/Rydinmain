-- ============================================================
-- RIDE AUTO-EXPIRY & AUTO-FULL SETUP
-- Run this entire script in Supabase SQL Editor (once)
-- ============================================================

-- ============================================================
-- STEP 1: Ensure 'expired' is a valid status in constraints
-- ============================================================

-- Update rides status constraint
ALTER TABLE public.rides
  DROP CONSTRAINT IF EXISTS rides_status_check;

ALTER TABLE public.rides
  ADD CONSTRAINT rides_status_check
  CHECK (status IN ('open', 'full', 'locked', 'completed', 'cancelled', 'expired'));

-- Update ride_members status constraint
ALTER TABLE public.ride_members
  DROP CONSTRAINT IF EXISTS ride_members_status_check;

ALTER TABLE public.ride_members
  ADD CONSTRAINT ride_members_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired'));


-- ============================================================
-- STEP 2: expire_past_rides() — called from the frontend
-- Marks rides as 'expired' if their departure time has passed
-- ============================================================

DROP FUNCTION IF EXISTS public.expire_past_rides();

CREATE OR REPLACE FUNCTION public.expire_past_rides()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Mark rides as expired if departure time has passed (with 2-hour grace period)
    -- Handles cases where "time" column may be stored as TEXT or TIME
    UPDATE public.rides
    SET status = 'expired'
    WHERE status IN ('open', 'full', 'locked')
    AND (
        CASE
            WHEN "time" IS NULL OR "time"::text = '' THEN "date"::timestamp + INTERVAL '23 hours 59 minutes'
            ELSE "date"::timestamp + "time"::time
        END
    ) < (NOW() - INTERVAL '2 hours');

    -- Also expire pending/accepted members of those rides
    UPDATE public.ride_members
    SET status = 'expired'
    WHERE status IN ('pending', 'accepted')
    AND ride_id IN (
        SELECT id FROM public.rides WHERE status = 'expired'
    );
END;
$$;

-- Grant execute to all relevant roles
GRANT EXECUTE ON FUNCTION public.expire_past_rides() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_past_rides() TO anon;
GRANT EXECUTE ON FUNCTION public.expire_past_rides() TO service_role;


-- ============================================================
-- STEP 3: Auto-update ride status to 'full' when seats fill up
-- and back to 'open' when a member leaves
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_update_ride_status_on_member_change()
RETURNS TRIGGER AS $$
DECLARE
    v_ride_id UUID;
    v_accepted_count INTEGER;
    v_total_seats INTEGER;
    v_ride_status TEXT;
BEGIN
    -- Determine which ride_id to check (NEW for INSERT/UPDATE, OLD for DELETE)
    IF TG_OP = 'DELETE' THEN
        v_ride_id := OLD.ride_id;
    ELSE
        v_ride_id := NEW.ride_id;
    END IF;

    -- Count currently accepted members
    SELECT COUNT(*) INTO v_accepted_count
    FROM public.ride_members
    WHERE ride_id = v_ride_id AND status = 'accepted';

    -- Get ride details
    SELECT seats_total, status INTO v_total_seats, v_ride_status
    FROM public.rides
    WHERE id = v_ride_id;

    -- Only act on rides that are still active (open or full)
    IF v_ride_status NOT IN ('open', 'full') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- Mark as 'full' when all seats are taken
    IF v_accepted_count >= v_total_seats AND v_ride_status = 'open' THEN
        UPDATE public.rides
        SET status = 'full'
        WHERE id = v_ride_id;

    -- Revert to 'open' if a member leaves and ride was full
    ELSIF v_accepted_count < v_total_seats AND v_ride_status = 'full' THEN
        UPDATE public.rides
        SET status = 'open'
        WHERE id = v_ride_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if it exists, then recreate
DROP TRIGGER IF EXISTS auto_update_ride_status_trigger ON public.ride_members;

CREATE TRIGGER auto_update_ride_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.ride_members
FOR EACH ROW
EXECUTE FUNCTION public.auto_update_ride_status_on_member_change();


-- ============================================================
-- STEP 4: Performance index for expiry queries
-- ============================================================

CREATE INDEX IF NOT EXISTS rides_date_time_status_idx
ON public.rides(date, time, status);


-- ============================================================
-- STEP 5: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! The following is now set up:
--
-- 1. 'expired' is a valid status for rides and ride_members
-- 2. expire_past_rides() RPC can be called from the frontend
--    to mark past rides as expired (called once per session
--    from Activity.tsx)
-- 3. Trigger auto-marks rides as 'full' when seats fill up,
--    and back to 'open' when a member leaves
-- 4. Index added for fast expiry queries
-- ============================================================
