-- =============================================================
-- INSERT EVENTS FOR SRM KTR STUDENTS
-- Run this in Supabase SQL Editor
-- Events are set to upcoming dates (March-April 2026)
-- All locations are near/at SRM KTR or popular Chennai spots
-- =============================================================

-- First, ensure the events table exists with the right structure
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    location TEXT NOT NULL,
    distance_km FLOAT,
    event_date DATE NOT NULL,
    event_time TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('concert', 'fest', 'hackathon', 'sports', 'tech_talk')),
    description TEXT,
    organizer_id UUID,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure event_interested_users table exists
CREATE TABLE IF NOT EXISTS event_interested_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_interested_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (if not already created)
DO $$
BEGIN
    -- Events: anyone can read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_select_all') THEN
        CREATE POLICY events_select_all ON events FOR SELECT USING (true);
    END IF;

    -- Events: authenticated users can insert
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_insert_auth') THEN
        CREATE POLICY events_insert_auth ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    -- Events: organizer can update/delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_update_owner') THEN
        CREATE POLICY events_update_owner ON events FOR UPDATE USING (organizer_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_delete_owner') THEN
        CREATE POLICY events_delete_owner ON events FOR DELETE USING (organizer_id = auth.uid());
    END IF;

    -- event_interested_users: anyone can read
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_interested_users' AND policyname = 'eiu_select_all') THEN
        CREATE POLICY eiu_select_all ON event_interested_users FOR SELECT USING (true);
    END IF;

    -- event_interested_users: auth users can insert their own
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_interested_users' AND policyname = 'eiu_insert_auth') THEN
        CREATE POLICY eiu_insert_auth ON event_interested_users FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- event_interested_users: users can delete their own
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_interested_users' AND policyname = 'eiu_delete_own') THEN
        CREATE POLICY eiu_delete_own ON event_interested_users FOR DELETE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE event_interested_users;


-- =============================================================
-- INSERT SRM KTR EVENTS
-- Categories: concert, fest, hackathon, sports, tech_talk
-- =============================================================

-- ==================== HACKATHONS ====================

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'SRM Hackathon 5.0 – 36 Hour Coding Marathon',
    'SRM Tech Park, Main Campus, Kattankulathur',
    CURRENT_DATE + INTERVAL '5 days',
    '09:00 AM',
    'hackathon',
    'The flagship 36-hour hackathon by SRM''s coding club. Build solutions for real-world problems. Prizes worth ₹2,00,000. Open to all departments. Teams of 2-4. Food & refreshments provided. Register on the SRM student portal.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'HackWithInfy – Infosys Campus Hiring Hackathon',
    'N.P.Tel Auditorium, SRM KTR',
    CURRENT_DATE + INTERVAL '12 days',
    '10:00 AM',
    'hackathon',
    'Infosys on-campus hackathon for pre-final and final year students. Top performers get direct interview offers. Bring your laptop. Domains: AI/ML, Full Stack, Cloud, Cybersecurity. Register via Infosys HackWithInfy portal.',
    0.2
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Build for Bharat – Google Developer Challenge',
    'SRM University Auditorium, Kattankulathur',
    CURRENT_DATE + INTERVAL '18 days',
    '09:30 AM',
    'hackathon',
    'Google Developer Student Club presents Build for Bharat. Create solutions using Google technologies (Firebase, Flutter, Cloud). Mentors from Google India. Track prizes for best AI/ML, best mobile app, and best social impact project.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Web3 Buildathon – Blockchain Innovation Challenge',
    'SRM Tech Park Lab 304, Kattankulathur',
    CURRENT_DATE + INTERVAL '25 days',
    '10:00 AM',
    'hackathon',
    'Build decentralized applications (dApps) on Ethereum/Polygon. Intro workshop on Day 1 followed by 24-hour building sprint. Sponsored by Polygon. NFT certificates for all participants. ₹50,000 prize pool.',
    0.0
);

-- ==================== TECH TALKS ====================

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'AI/ML Workshop – Hands-on with LLMs & RAG',
    'SRM Main Auditorium, Kattankulathur',
    CURRENT_DATE + INTERVAL '3 days',
    '02:00 PM',
    'tech_talk',
    'Learn to build AI applications using Large Language Models. Topics: Prompt Engineering, RAG Architecture, Fine-tuning, LangChain. Hands-on coding session. Bring your laptop. By SRM AI Club. Free for all SRM students.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'DSA Bootcamp – Crack Your Placement Interviews',
    'CS Block Seminar Hall, SRM KTR',
    CURRENT_DATE + INTERVAL '7 days',
    '10:00 AM',
    'tech_talk',
    'Intensive 3-day DSA bootcamp by SRM Placement Cell. Cover Arrays, Trees, Graphs, DP patterns asked by Amazon, Google, Microsoft. Mock interviews on Day 3. Free for pre-final and final year students.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Flutter Forward Chennai – Mobile Dev Meetup',
    'IIT Madras Research Park, Guindy',
    CURRENT_DATE + INTERVAL '10 days',
    '04:00 PM',
    'tech_talk',
    'Google Developer Group Chennai presents Flutter Forward extended event. Live demos of Flutter 3.x features, Firebase integration, and state management. Free pizza & networking. Open to all skill levels.',
    25.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Cloud Computing Masterclass – AWS & GCP',
    'SRM Tech Park Seminar Hall, KTR',
    CURRENT_DATE + INTERVAL '14 days',
    '11:00 AM',
    'tech_talk',
    'Hands-on workshop covering AWS Lambda, S3, EC2 and GCP equivalents. Deploy a full-stack app to the cloud by end of session. Free AWS credits for participants. Hosted by SRM Cloud Computing Club.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Cybersecurity CTF Challenge',
    'SRM Computer Lab Block 3, Kattankulathur',
    CURRENT_DATE + INTERVAL '20 days',
    '09:00 AM',
    'tech_talk',
    'Capture The Flag competition covering web exploitation, reverse engineering, cryptography, and forensics. Beginner and advanced tracks. Solo or team (max 3). Prizes for top 5 teams. Hosted by SRM InfoSec Club.',
    0.1
);

-- ==================== FESTS ====================

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Aaruush 2026 – SRM Techno-Management Fest',
    'SRM University Main Ground, Kattankulathur',
    CURRENT_DATE + INTERVAL '22 days',
    '09:00 AM',
    'fest',
    'SRM''s flagship national-level techno-management fest! Events across robotics, coding, management, design, and more. Celebrity night on Day 3. Open to students from all colleges. Entry: Free for SRM students.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Milan 2026 – SRM Cultural Fest',
    'SRM Open Air Theatre, Kattankulathur',
    CURRENT_DATE + INTERVAL '30 days',
    '10:00 AM',
    'fest',
    'India''s largest student-run cultural fest! Dance battles, band competitions, fashion show, stand-up comedy, art exhibition, and celebrity performances. 3-day extravaganza. Food stalls from 50+ vendors.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Cine Fest – Short Film & Photography Festival',
    'SRM Auditorium, Kattankulathur',
    CURRENT_DATE + INTERVAL '16 days',
    '11:00 AM',
    'fest',
    'Showcase your short films, reels, and photography. Categories: Drama, Documentary, Animation, Street Photography, Portrait. Guest judge from Chennai film industry. Best Film wins ₹25,000 + studio tour.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Foodie Fest – Campus Food Carnival',
    'SRM Food Court Area, Kattankulathur',
    CURRENT_DATE + INTERVAL '8 days',
    '12:00 PM',
    'fest',
    'Annual food carnival with 30+ stalls serving cuisines from across India. Live cooking competitions, eating challenges, and dessert workshops. Organized by SRM Culinary Club. Entry free, food at stall prices.',
    0.0
);

-- ==================== SPORTS ====================

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'SRM Premier League – Cricket Tournament',
    'SRM Cricket Ground, Kattankulathur',
    CURRENT_DATE + INTERVAL '6 days',
    '07:00 AM',
    'sports',
    'Inter-department T20 cricket tournament. 16 teams battle for the SRM Premier League trophy. ₹50,000 prize pool. Register your team (11+4 players) at the Sports Office. Last date for registration: 3 days from now.',
    0.3
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Midnight Football League – 5v5 Turf Tournament',
    'SRM Football Turf, Kattankulathur',
    CURRENT_DATE + INTERVAL '9 days',
    '08:00 PM',
    'sports',
    'Night football tournament under floodlights! 5v5 format, 15-minute matches. Entry: ₹500/team. Cash prizes for top 3. Jerseys mandatory. Register at SRM Sports Complex. Limited to 32 teams.',
    0.2
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'SRM Badminton Open Championship',
    'SRM Indoor Stadium, Kattankulathur',
    CURRENT_DATE + INTERVAL '11 days',
    '08:00 AM',
    'sports',
    'Singles and doubles badminton championship open to all SRM students and staff. Categories: Men''s, Women''s, Mixed Doubles. Shuttlecocks provided. Register at Sports Office. Entry: ₹100/person.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Campus Run 5K – Morning Marathon',
    'SRM Main Gate (Start Point), Kattankulathur',
    CURRENT_DATE + INTERVAL '15 days',
    '05:30 AM',
    'sports',
    'Annual 5K campus run organized by SRM Fitness Club. Route: Main Gate → Tech Park → Hostel Zone → Medical Block → Main Gate. Free T-shirt and medal for all finishers. Water stations every 1km.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Inter-College Basketball Championship',
    'SRM Basketball Court, Kattankulathur',
    CURRENT_DATE + INTERVAL '19 days',
    '09:00 AM',
    'sports',
    '3-day inter-college basketball tournament. Teams from VIT, Anna Univ, IIT Madras, BITS, and more. Support Team SRM! Entry free for spectators. Finals on Day 3 with live DJ.',
    0.1
);

-- ==================== CONCERTS ====================

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Indie Night – Live Band Performance',
    'SRM Open Air Theatre, Kattankulathur',
    CURRENT_DATE + INTERVAL '4 days',
    '06:30 PM',
    'concert',
    'Featuring Chennai indie bands: The F16s, Skrat, and Jatayu. Organized by SRM Music Club. Free entry for SRM students with ID. Food stalls available. Gates open at 5:30 PM.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'EDM Night – Campus DJ Festival',
    'SRM Ground Zero, Kattankulathur',
    CURRENT_DATE + INTERVAL '13 days',
    '07:00 PM',
    'concert',
    'Chennai''s top DJs spin at SRM! Lineup: DJ Ravish, DJ Nikhil Chinapa (guest), and SRM''s own DJ society. Light show, laser effects, and foam party zone. Free entry. Dress code: Neon/White.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Carnatic Fusion Night – Classical Meets Modern',
    'SRM Auditorium, Kattankulathur',
    CURRENT_DATE + INTERVAL '17 days',
    '06:00 PM',
    'concert',
    'A unique fusion concert blending Carnatic music with contemporary genres. Featuring artists from Chennai music scene. Organized by SRM Fine Arts Club. Free for all students.',
    0.1
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Open Mic Night – Stand-up & Music',
    'SRM Hostel Common Room (Boys Hostel Block 3)',
    CURRENT_DATE + INTERVAL '2 days',
    '08:00 PM',
    'concert',
    'Weekly open mic! Sign up to perform stand-up comedy, poetry, acoustic covers, or rap. 5 min per slot. Free snacks. Organized by SRM Entertainment Committee. Sign up by 6 PM same day.',
    0.0
);

INSERT INTO events (title, location, event_date, event_time, category, description, distance_km)
VALUES (
    'Bollywood Retro Night – Karaoke & Dance',
    'SRM Recreation Hall, Kattankulathur',
    CURRENT_DATE + INTERVAL '21 days',
    '07:30 PM',
    'concert',
    'Sing your favorite Bollywood classics! Karaoke setup with professional sound system. Dance floor open after 9 PM. Best singer and best dancer prizes. Organized by SRM Hindi Literary Club.',
    0.1
);
