-- ========================================
-- CRITICAL RLS POLICY FIX FOR RYDIN
-- Run this in your Supabase SQL Editor
-- ========================================

-- DISABLE RLS temporarily to allow user/profile creation
-- (Re-enable with proper policies after testing)

-- 1. Fix USERS table policies
DROP POLICY IF EXISTS "Users can insert their own user" ON users;
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own user" ON users;

-- Allow authenticated users to insert their own record
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow all auth users to read users table (needed for lookups)
CREATE POLICY "Users can view users"
ON users FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow users to update their own record
CREATE POLICY "Users can update own record"
ON users FOR UPDATE  
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Fix PROFILES table policies  
DROP POLICY IF EXISTS "Users can create profile" ON profiles;
DROP POLICY IF EXISTS "All users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Enable insert for users"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow all authenticated users to read profiles
CREATE POLICY "Enable read for all users"
ON profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Fix HOPPERS table policies
DROP POLICY IF EXISTS "Users can create rides" ON hoppers;
DROP POLICY IF EXISTS "All users can view rides" ON hoppers;
DROP POLICY IF EXISTS "Users can update own rides" ON hoppers;

CREATE POLICY "Enable insert hoppers for users"
ON hoppers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable read hoppers for all"
ON hoppers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update hoppers for owner"
ON hoppers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Fix HOPPER_REQUESTS table policies
DROP POLICY IF EXISTS "Users can send requests" ON hopper_requests;
DROP POLICY IF EXISTS "Users can view requests" ON hopper_requests;

CREATE POLICY "Enable insert requests for users"
ON hopper_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Enable read requests for involved users"
ON hopper_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Enable update requests for receiver"
ON hopper_requests FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Run these to verify policies are set:

-- Check users policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'users';

-- Check profiles policies  
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';

-- Check hoppers policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'hoppers';

-- Check hopper_requests policies
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'hopper_requests';
