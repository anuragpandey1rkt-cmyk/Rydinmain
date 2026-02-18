-- ==============================================
-- TRUST SCORE MIGRATION
-- Ensures all required columns exist on profiles
-- Run this in Supabase SQL Editor
-- ==============================================

-- Add missing columns (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS completed_rides INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_no_show_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS no_show_cleared_at TIMESTAMPTZ;

-- Sync identity_verified from user_verifications if available
UPDATE profiles p
SET identity_verified = true
FROM user_verifications v
WHERE p.id = v.user_id AND v.verified = true
AND p.identity_verified IS NOT TRUE;

SELECT 'SUCCESS: All trust score columns ready' as status;
