-- Migration to add Direct Messaging (1-on-1 Chat)
-- Using 'direct_messages' to avoid conflicts with any existing 'messages' table

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE, -- Optional: can be null for direct chat
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages they sent or received
DROP POLICY IF EXISTS "Users can view their own direct messages" ON direct_messages;
CREATE POLICY "Users can view their own direct messages"
  ON direct_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy: Users can send messages
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
CREATE POLICY "Users can send direct messages"
  ON direct_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Add to real-time publication
-- Use a safer way to add the table to avoid publication errors
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'direct_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  END IF;
END $$;
