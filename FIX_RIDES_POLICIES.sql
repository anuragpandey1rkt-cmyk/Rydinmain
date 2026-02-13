-- ==========================================================
-- FIX POLICIES FOR 'RIDES' and 'RIDE_MEMBERS' TABLES
-- ==========================================================

-- 1. Fix RIDES table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON rides;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rides;
DROP POLICY IF EXISTS "Enable update for users based on email" ON rides;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON rides;
DROP POLICY IF EXISTS "Users can create rides" ON rides;
DROP POLICY IF EXISTS "All users can view rides" ON rides;
DROP POLICY IF EXISTS "Users can update own rides" ON rides;

-- Allow anyone (even unauthenticated, if you want public view) or just auth users to see rides
CREATE POLICY "Enable read access for all users"
ON rides FOR SELECT
USING (true); -- Publicly visible

-- Allow authenticated users to create rides
CREATE POLICY "Enable insert for authenticated users only"
ON rides FOR INSERT
WITH CHECK (auth.uid() = host_id); 
-- Note: Assuming host_id links to auth.users.id

-- Allow hosts to update their own rides
CREATE POLICY "Enable update for hosts"
ON rides FOR UPDATE
USING (auth.uid() = host_id)
WITH CHECK (auth.uid() = host_id);


-- 2. Fix RIDE_MEMBERS table policies
DROP POLICY IF EXISTS "Enable read access for all users" ON ride_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON ride_members;
DROP POLICY IF EXISTS "Enable update for users based on email" ON ride_members;

-- Allow users to see who is in a ride
CREATE POLICY "Enable read access for all users"
ON ride_members FOR SELECT
USING (true);

-- Allow users to join rides (insert themselves)
CREATE POLICY "Enable insert for authenticated users"
ON ride_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave/update their own membership
CREATE POLICY "Enable update for own membership"
ON ride_members FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

SELECT '✅ Rides policies explicitly fixed' as status;
