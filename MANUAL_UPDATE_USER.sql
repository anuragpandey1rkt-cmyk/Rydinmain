-- ==========================================================
-- MANUAL FORCE UPDATE FOR ap1494@srmist.edu.in
-- ==========================================================
-- Since the UI update is timing out, run this manually to fix your account.

UPDATE profiles 
SET 
  name = 'Ramanuj',               -- Replace with your actual name if different
  department = 'Computer Science', -- Replace with your department
  year = '1st Year',              -- Replace with your year
  phone = '9876543210',           -- Replace with your phone
  gender = 'male',                -- Replace with your gender
  profile_complete = TRUE,
  trust_score = 4.0,
  updated_at = NOW()
WHERE email = 'ap1494@srmist.edu.in';  -- Targeted specifically at your email

SELECT * FROM profiles WHERE email = 'ap1494@srmist.edu.in';
