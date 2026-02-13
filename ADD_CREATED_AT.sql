-- ==========================================================
-- FIX MISSING COLUMNS IN RIDES TABLE
-- ==========================================================

-- 1. Ensure 'created_at' exists (used for sorting)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'created_at') THEN
    ALTER TABLE rides ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- 2. Ensure 'status' exists (used for filtering)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rides' AND column_name = 'status') THEN
    ALTER TABLE rides ADD COLUMN status TEXT DEFAULT 'open';
  END IF;
END $$;

-- 3. Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'rides';

SELECT '✅ Columns fixed. Try refreshing the app.' as status;
