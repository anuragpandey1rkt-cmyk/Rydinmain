-- ==========================================================
-- EMERGENCY FIX: RPC FUNCTION FOR PROFILE UPDATES
-- ==========================================================

-- This function bypasses RLS and triggers, allowing a direct, safe update.
-- It is marked as SECURITY DEFINER to run with admin privileges.

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
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get the ID of the caller
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update the profile
    UPDATE public.profiles
    SET 
        name = p_name,
        department = p_department,
        year = p_year,
        phone = p_phone,
        gender = p_gender,
        emergency_contact_name = p_emergency_contact_name,
        emergency_contact_phone = p_emergency_contact_phone,
        profile_complete = TRUE,
        updated_at = NOW()
    WHERE id = v_user_id
    RETURNING to_jsonb(profiles.*) INTO v_result;

    -- If no row was updated, it means profile might be missing. Try inserting.
    IF v_result IS NULL THEN
        INSERT INTO public.profiles (
            id, email, name, department, year, phone, gender, 
            emergency_contact_name, emergency_contact_phone, 
            profile_complete, trust_score
        )
        VALUES (
            v_user_id,
            (SELECT email FROM auth.users WHERE id = v_user_id),
            p_name, p_department, p_year, p_phone, p_gender,
            p_emergency_contact_name, p_emergency_contact_phone,
            TRUE, 4.0
        )
        RETURNING to_jsonb(profiles.*) INTO v_result;
    END IF;

    RETURN v_result;
END;
$$;

-- Grant execute permission to everyone
GRANT EXECUTE ON FUNCTION update_profile_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_safe TO service_role;

SELECT '✅ RPC Function update_profile_safe created successfully.' as status;
