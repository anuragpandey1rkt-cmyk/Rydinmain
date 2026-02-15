-- ==========================================================
-- DEFINITIVE RLS FIX FOR PROFILES (FIXES UPDATE ISSUE)
-- ==========================================================

-- 1. Reset RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop any and all existing policies on profiles
DO $$ 
DECLARE 
    pol record;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname); 
    END LOOP; 
END $$;

-- 3. Create SIMPLE, PERMISSIVE policies
-- Allow everyone (even anon, if needed for checking existence) to Read
CREATE POLICY "Allow Public Read" 
ON profiles FOR SELECT 
USING (true);

-- Allow Users to Insert their own profile
CREATE POLICY "Allow User Insert" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow Users to Update their own profile - CRITICAL FIX
-- We use USING (auth.uid() = id) to verify ownership
CREATE POLICY "Allow User Update" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT SELECT ON profiles TO anon; -- Allow reading profiles

-- 5. Force update the specific user (if possible) to reset their state for testing
-- This sets 'profile_complete' to FALSE for the user so they can try the form again.
UPDATE profiles 
SET profile_complete = FALSE 
WHERE email = 'ap1494@srmist.edu.in';

SELECT '✅ RLS Policies Reset. User ap1494 can now retry profile setup.' as status;
