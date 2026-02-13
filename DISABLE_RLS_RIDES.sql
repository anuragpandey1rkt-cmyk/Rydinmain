-- ==========================================================
-- NUCLEAR OPTION: DISABLE RLS ON RIDES TABLE
-- ==========================================================
-- This will temporarily allow FULL ACCESS to the rides table
-- to confirm if RLS policies were the cause of the timeouts.

-- 1. Disable RLS on rides table
ALTER TABLE rides DISABLE ROW LEVEL SECURITY;

-- 2. Disable RLS on ride_members table
ALTER TABLE ride_members DISABLE ROW LEVEL SECURITY;

-- 3. Verify status
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename IN ('rides', 'ride_members');

-- You should see 'false' in the rowsecurity column for both tables.
-- If you see 'true', run the ALTER TABLE command again.

SELECT '✅ RLS Disabled for Rides - Try refreshing your app now' as status;
