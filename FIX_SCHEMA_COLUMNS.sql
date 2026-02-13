-- ==========================================================
-- FINAL SCHEMA ALIGNMENT FOR PRODUCTION
-- Ensures database columns match the frontend code exactly
-- ==========================================================

-- 1. Align HOPPERS table
-- Rename 'date' to 'departure_date' if valid
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hoppers' AND column_name = 'date') THEN
    ALTER TABLE hoppers RENAME COLUMN "date" TO departure_date;
  END IF;
END $$;

-- Ensure seats columns exist with defaults
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hoppers' AND column_name = 'seats_total') THEN
    ALTER TABLE hoppers ADD COLUMN seats_total INTEGER DEFAULT 4;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hoppers' AND column_name = 'seats_taken') THEN
    ALTER TABLE hoppers ADD COLUMN seats_taken INTEGER DEFAULT 1;
  END IF;
END $$;

-- 2. Align HOPPER_REQUESTS table
-- Ensure we use sender_id/receiver_id (standardize naming)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hopper_requests' AND column_name = 'requesting_user_id') THEN
    ALTER TABLE hopper_requests RENAME COLUMN requesting_user_id TO sender_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hopper_requests' AND column_name = 'requested_user_id') THEN
    ALTER TABLE hopper_requests RENAME COLUMN requested_user_id TO receiver_id;
  END IF;
END $$;

-- 3. Verify Constraints
-- Ensure status defaults to 'active' or 'pending' where appropriate is good practice, 
-- but we won't alter constraints blindly to avoid breaking existing data.

SELECT '✅ Database Schema aligned with Frontend Code' as status;
