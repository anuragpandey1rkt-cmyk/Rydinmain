-- Unified Hopper Flow Migration

-- 1. Add scheduling URL to rides for transparency
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS scheduled_ride_url TEXT;

-- 2. Ensure ride_members has status for approval flow
ALTER TABLE public.ride_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));

-- 3. Create Messages table for Ride Chat
CREATE TABLE IF NOT EXISTS ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE ride_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the ride can view messages
DROP POLICY IF EXISTS "Ride members can view messages" ON ride_messages;
CREATE POLICY "Ride members can view messages"
  ON ride_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ride_members 
      WHERE ride_members.ride_id = ride_messages.ride_id 
      AND ride_members.user_id = auth.uid() 
      AND ride_members.status = 'accepted'
    )
    OR
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_messages.ride_id 
      AND rides.host_id = auth.uid()
    )
  );

-- Policy: Members can send messages
DROP POLICY IF EXISTS "Ride members can send messages" ON ride_messages;
CREATE POLICY "Ride members can send messages"
  ON ride_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ride_members 
      WHERE ride_members.ride_id = ride_messages.ride_id 
      AND ride_members.user_id = auth.uid() 
      AND ride_members.status = 'accepted'
    )
    OR
    EXISTS (
      SELECT 1 FROM rides 
      WHERE rides.id = ride_messages.ride_id 
      AND rides.host_id = auth.uid()
    )
  );

-- 4. Function to request joining a ride (Approval Flow)
CREATE OR REPLACE FUNCTION request_join_ride(p_ride_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_host_id UUID;
BEGIN
    -- Get host
    SELECT host_id INTO v_host_id FROM rides WHERE id = p_ride_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Ride not found');
    END IF;

    -- Host cannot request to join their own ride
    IF v_host_id = p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'You are the host');
    END IF;

    -- Check if already requested
    IF EXISTS (SELECT 1 FROM ride_members WHERE ride_id = p_ride_id AND user_id = p_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Request already exists');
    END IF;

    -- Insert pending request
    INSERT INTO ride_members (ride_id, user_id, status, joined_at)
    VALUES (p_ride_id, p_user_id, 'pending', NOW());

    -- Notify host (using the notification system defined in ADD_ENGAGEMENT_FEATURES)
    PERFORM send_notification(
        v_host_id,
        'split_invitation', -- Using an existing type or we can add 'ride_request'
        'New Ride Request',
        'Someone wants to join your ride!',
        jsonb_build_object('ride_id', p_ride_id, 'user_id', p_user_id)
    );

    RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to handle host decision (Approve/Reject)
CREATE OR REPLACE FUNCTION handle_ride_request(p_ride_id UUID, p_member_id UUID, p_action TEXT)
RETURNS JSON AS $$
DECLARE
    v_seats_taken INTEGER;
    v_seats_total INTEGER;
    v_host_id UUID;
BEGIN
    -- Verify host
    SELECT host_id, seats_taken, seats_total INTO v_host_id, v_seats_taken, v_seats_total 
    FROM rides WHERE id = p_ride_id;
    
    IF auth.uid() != v_host_id THEN
        RETURN json_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    IF p_action = 'accept' THEN
        -- Check availability
        IF v_seats_taken >= v_seats_total THEN
            RETURN json_build_object('success', false, 'error', 'Ride is full');
        END IF;

        -- Update status
        UPDATE ride_members SET status = 'accepted' 
        WHERE ride_id = p_ride_id AND user_id = p_member_id;

        -- Update ride counter
        UPDATE rides 
        SET seats_taken = v_seats_taken + 1,
            status = CASE WHEN v_seats_taken + 1 >= seats_total THEN 'full' ELSE 'open' END
        WHERE id = p_ride_id;

        RETURN json_build_object('success', true);
    ELSIF p_action = 'reject' THEN
        UPDATE ride_members SET status = 'rejected' 
        WHERE ride_id = p_ride_id AND user_id = p_member_id;
        RETURN json_build_object('success', true);
    ELSE
        RETURN json_build_object('success', false, 'error', 'Invalid action');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
