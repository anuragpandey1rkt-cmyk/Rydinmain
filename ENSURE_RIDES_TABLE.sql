-- ==========================================================
-- ENSURE RIDES TABLE EXISTS AND IS CORRECT
-- ==========================================================

-- 1. Create RIDES table if it doesn't exist
CREATE TABLE IF NOT EXISTS rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES auth.users(id) NOT NULL,
  source TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  seats_total INTEGER DEFAULT 4,
  seats_taken INTEGER DEFAULT 0,
  estimated_fare DECIMAL DEFAULT 0,
  girls_only BOOLEAN DEFAULT false,
  flight_train TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create RIDE_MEMBERS table if it doesn't exist
CREATE TABLE IF NOT EXISTS ride_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'joined'
);

-- 3. Ensure columns exist (if table already existed but was incomplete)
DO $$ 
BEGIN 
  -- Check RIDES columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'host_id') THEN
    ALTER TABLE rides ADD COLUMN host_id UUID REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'status') THEN
    ALTER TABLE rides ADD COLUMN status TEXT DEFAULT 'open';
  END IF;

  -- Check RIDE_MEMBERS columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ride_members' AND column_name = 'user_id') THEN
    ALTER TABLE ride_members ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 4. RE-APPLY POLICIES (Just in case table creation reset them)
DROP POLICY IF EXISTS "Enable read access for all users" ON rides;
CREATE POLICY "Enable read access for all users" ON rides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON rides;
CREATE POLICY "Enable insert for authenticated users only" ON rides FOR INSERT WITH CHECK (auth.uid() = host_id);


SELECT '✅ Rides table verified and policies applied' as status;
