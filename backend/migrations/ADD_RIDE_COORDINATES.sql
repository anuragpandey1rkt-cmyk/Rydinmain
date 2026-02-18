-- Add coordinate columns to rides table
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_latitude DECIMAL(10, 8);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pickup_longitude DECIMAL(11, 8);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS drop_latitude DECIMAL(10, 8);
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS drop_longitude DECIMAL(11, 8);

-- Create a table for supported travel zones
CREATE TABLE IF NOT EXISTS travel_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_km DECIMAL(10, 2),
  is_hub BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed some default travel zones and hubs
INSERT INTO travel_zones (name, description, center_latitude, center_longitude, radius_km, is_hub)
VALUES
('SRM Kattankulathur', 'Main Campus area', 12.8231, 80.0442, 2.0, FALSE),
('SRM Main Gate', 'Main entrance hub', 12.8231, 80.0442, 0.5, TRUE),
('SRM Library Hub', 'Central library area', 12.8215, 80.0425, 0.3, TRUE),
('Chennai Airport', 'International and Domestic terminals', 12.9941, 80.1709, 1.5, TRUE),
('Central Metro', 'Chennai Central Railway Station & Metro', 13.0827, 80.2707, 1.0, TRUE),
('Tambaram Hub', 'Tambaram Railway Station & Bus Stand', 12.9229, 80.1275, 1.5, TRUE);

-- Function to check if a point is within any active travel zone
CREATE OR REPLACE FUNCTION is_within_travel_zone(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN AS $$
DECLARE
    zone_record RECORD;
    dist DECIMAL;
BEGIN
    FOR zone_record IN SELECT center_latitude, center_longitude, radius_km FROM travel_zones WHERE is_active = TRUE LOOP
        -- Simple Haversine-ish distance check (or just use point distance if accuracy is enough)
        -- For better accuracy we would use PostGIS, but let's stick to a simple distance formula if PostGIS is not enabled.
        -- dist = 6371 * acos(cos(radians(lat)) * cos(radians(zone_record.center_latitude)) * cos(radians(zone_record.center_longitude) - radians(lng)) + sin(radians(lat)) * sin(radians(zone_record.center_latitude)));
        
        -- Approximate distance using Pythagorean theorem for small distances (valid for campus/city scale)
        -- 1 degree lat ~ 111km, 1 degree lng ~ 111km * cos(lat)
        dist := sqrt(power((lat - zone_record.center_latitude) * 111, 2) + power((lng - zone_record.center_longitude) * 111 * cos(radians(lat)), 2));
        
        IF dist <= zone_record.radius_km THEN
            RETURN TRUE;
        END IF;
    END LOOP;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
