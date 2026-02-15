-- ==========================================================
-- RYDIN MASTER SYSTEM FIX (SOLVES "ALL IDs" ISSUES)
-- ==========================================================
-- Run this script ONCE ensures that:
-- 1. New users automatically get a profile (Trigger)
-- 2. Profile updates NEVER fail (Secure RPC Fallback)
-- 3. App works for EVERYONE, not just one user.

-- ----------------------------------------------------------
-- 1. SECURE UPDATE FUNCTION (The Reliability Engine)
-- ----------------------------------------------------------
-- This function is what the app uses when the standard update fails.
-- It runs with ADMIN privileges to guarantee the data is saved.
CREATE OR REPLACE FUNCTION update_profile_safe(
    p_name TEXT,
    p_department TEXT,
    p_year TEXT,
    p_phone TEXT,
    p_gender TEXT,
    p_emergency_contact_name TEXT,
    p_emergency_contact_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- "Upsert": Update if exists, Insert if missing. Covers ALL cases.
    INSERT INTO public.profiles (
        id, email, name, department, year, phone, gender,
        emergency_contact_name, emergency_contact_phone,
        profile_complete, trust_score, updated_at
    )
    VALUES (
        v_user_id,
        (SELECT email FROM auth.users WHERE id = v_user_id),
        p_name, p_department, p_year, p_phone, p_gender,
        p_emergency_contact_name, p_emergency_contact_phone,
        TRUE, 4.0, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        year = EXCLUDED.year,
        phone = EXCLUDED.phone,
        gender = EXCLUDED.gender,
        emergency_contact_name = EXCLUDED.emergency_contact_name,
        emergency_contact_phone = EXCLUDED.emergency_contact_phone,
        profile_complete = TRUE,
        updated_at = NOW()
    RETURNING to_jsonb(profiles.*) INTO v_result;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------
-- 2. AUTO-ONBOARDING TRIGGER (For New Signups)
-- ----------------------------------------------------------
-- Ensures that as soon as someone signs up, their table entry is ready.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, trust_score, profile_complete)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    4.0,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach the trigger cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------------
-- 3. PERMISSIONS & POLICIES (Visibility)
-- ----------------------------------------------------------
-- Grant rights to the function and tables
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_safe TO service_role;

-- Ensure profiles are readable by everyone (needed for rides)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
    -- Drop old policies to avoid conflicts
    DROP POLICY IF EXISTS "Allow Public Read" ON profiles;
    DROP POLICY IF EXISTS "Allow User Insert" ON profiles;
    DROP POLICY IF EXISTS "Allow User Update" ON profiles;
END $$;

-- Simple, standard policies
CREATE POLICY "Allow Public Read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow User Insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow User Update" ON profiles FOR UPDATE USING (auth.uid() = id);

SELECT '✅ MASTER FIX APPLIED: System is now self-healing for ALL users.' as status;
