-- Add moderation fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Create an audit log for moderation actions
CREATE TABLE IF NOT EXISTS moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  action VARCHAR NOT NULL, -- 'flag', 'block', 'warn'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_flagged ON profiles(is_flagged);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(user_id);
