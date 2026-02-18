-- ============================================================
-- EXPAND TRAVEL ZONES TO COVER ALL OF CHENNAI & SURROUNDINGS
-- Run this in Supabase SQL Editor
-- ============================================================

-- First, update existing SRM zones to have proper radius
UPDATE public.travel_zones SET radius_km = 2.0 WHERE name = 'SRM Kattankulathur';
UPDATE public.travel_zones SET radius_km = 1.5 WHERE name = 'Chennai Airport';
UPDATE public.travel_zones SET radius_km = 1.5 WHERE name = 'Tambaram Hub';
UPDATE public.travel_zones SET radius_km = 1.0 WHERE name = 'Central Metro';
UPDATE public.travel_zones SET radius_km = 0.5 WHERE name = 'Potheri Station';

-- Add all major Chennai zones (skip if already exists by name)
INSERT INTO public.travel_zones (name, description, center_latitude, center_longitude, radius_km, is_hub, is_active)
SELECT name, description, center_latitude, center_longitude, radius_km, is_hub, true
FROM (VALUES
  -- South Chennai / SRM Belt
  ('Guduvancheri',        'Railway station near SRM',             12.8450, 80.0560, 1.0,  true),
  ('Perungalathur',       'Suburb south of Tambaram',             12.8780, 80.0800, 0.8,  false),
  ('Vandalur',            'Near Arignar Anna Zoo',                12.8900, 80.0820, 0.8,  false),
  ('Urapakkam',           'Between SRM and Tambaram',             12.8650, 80.0650, 0.8,  false),
  ('Chromepet',           'South Chennai suburb',                 12.9516, 80.1462, 1.0,  false),
  ('Pallavaram',          'Near airport, south Chennai',          12.9675, 80.1491, 1.0,  false),
  ('Chengalpattu',        'Major town south of Chennai',          12.6921, 79.9764, 2.5,  true),
  ('Mahabalipuram',       'Coastal town south of Chennai',        12.6269, 80.1927, 2.5,  false),
  ('Sriperumbudur',       'Industrial town west of Chennai',      12.9677, 79.9477, 2.0,  false),
  ('Kancheepuram',        'Historic city west of Chennai',        12.8342, 79.7036, 2.5,  false),

  -- Central Chennai
  ('Chennai Egmore',      'Major railway terminus',               13.0780, 80.2620, 1.0,  true),
  ('Koyambedu CMBT',      'Largest bus terminus in Chennai',      13.0694, 80.1948, 1.5,  true),
  ('T Nagar',             'Major commercial hub',                 13.0418, 80.2341, 1.0,  false),
  ('Guindy',              'Industrial & railway hub',             13.0067, 80.2206, 1.0,  true),
  ('Vadapalani',          'Metro station & commercial area',      13.0524, 80.2120, 0.8,  false),
  ('Anna Nagar',          'Residential & commercial area',        13.0850, 80.2101, 1.0,  false),
  ('Ashok Nagar',         'Residential area central Chennai',     13.0350, 80.2100, 0.8,  false),
  ('Alandur',             'Metro junction near airport',          13.0020, 80.2000, 0.8,  false),
  ('St Thomas Mount',     'Metro station near airport',           13.0010, 80.1960, 0.8,  false),
  ('Velachery',           'Metro terminus, south central',        12.9815, 80.2180, 1.0,  true),

  -- East Chennai / OMR IT Corridor
  ('Sholinganallur',      'IT hub on OMR',                        12.9010, 80.2279, 1.0,  false),
  ('Perungudi',           'IT park on OMR',                       12.9600, 80.2450, 1.0,  false),
  ('Thoraipakkam',        'IT corridor OMR',                      12.9290, 80.2360, 1.0,  false),
  ('Medavakkam',          'Residential area south Chennai',       12.9220, 80.1930, 0.8,  false),
  ('Adyar',               'Residential area east Chennai',        13.0063, 80.2574, 1.0,  false),
  ('Besant Nagar',        'Coastal residential area',             13.0002, 80.2707, 0.8,  false),
  ('Thiruvanmiyur',       'South coastal Chennai',                12.9827, 80.2707, 0.8,  false),

  -- West Chennai
  ('Porur',               'West Chennai junction',                13.0350, 80.1570, 1.0,  false),
  ('Ambattur',            'Industrial area west Chennai',         13.1143, 80.1548, 1.0,  false),
  ('Avadi',               'North-west Chennai railway',           13.1143, 80.0965, 1.0,  false),

  -- North Chennai
  ('Tiruvottiyur',        'North Chennai industrial area',        13.1627, 80.3000, 1.0,  false),
  ('Tiruvallur',          'North-west satellite town',            13.1427, 79.9143, 2.0,  false),
  ('Chennai Airport (T2)','International Terminal',               12.9900, 80.1650, 1.5,  true)
) AS new_zones(name, description, center_latitude, center_longitude, radius_km, is_hub)
WHERE NOT EXISTS (
  SELECT 1 FROM public.travel_zones tz WHERE tz.name = new_zones.name
);

-- Verify count
SELECT COUNT(*) as total_zones FROM public.travel_zones WHERE is_active = true;
