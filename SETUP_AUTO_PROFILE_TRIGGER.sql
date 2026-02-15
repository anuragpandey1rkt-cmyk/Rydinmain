-- ==========================================================
-- AUTOMATIC PROFILE CREATION TRIGGER & FIX
-- ==========================================================

-- 1. Create the Trigger Function
-- This function runs automatically whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.profiles
  INSERT INTO public.profiles (id, email, name, trust_score, profile_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    4.0,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into public.users (legacy table support)
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), ' ', 1),
    SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), ' ', 2)
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the Trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FIX MISSING PROFILES (For users who already signed up but have no profile)
-- This will fix ap1494@srmist.edu.in immediately
INSERT INTO public.profiles (id, email, name, trust_score, profile_complete)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  4.0,
  FALSE
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 4. FIX MISSING USERS (Legacy table)
INSERT INTO public.users (id, email, first_name, last_name)
SELECT 
  id, 
  email, 
  SPLIT_PART(COALESCE(raw_user_meta_data->>'full_name', 'User'), ' ', 1),
  SPLIT_PART(COALESCE(raw_user_meta_data->>'full_name', ''), ' ', 2)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

SELECT '✅ Auto-creation trigger set up and missing profiles fixed.' as status;
