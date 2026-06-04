/*
  # Add flight_type column to flights table

  1. New column
    - Add flight_type text column to flights table
    - Set default to 'domestic'
    - Populate based on from_location and to_location
*/

-- Add flight_type column if it doesn't exist
ALTER TABLE flights
ADD COLUMN IF NOT EXISTS flight_type text NOT NULL DEFAULT 'domestic';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_flights_flight_type ON flights(flight_type);

-- Update flight_type based on routes
-- Domestic: both cities in Nepal
-- International: at least one city outside Nepal
UPDATE flights
SET flight_type = CASE
  WHEN (from_location LIKE '%Kathmandu%' OR from_location LIKE '%Pokhara%' OR from_location LIKE '%Biratnagar%' OR from_location LIKE '%Dhangadhi%' OR from_location LIKE '%Janakpur%' OR from_location LIKE '%Birgunj%')
   AND (to_location LIKE '%Kathmandu%' OR to_location LIKE '%Pokhara%' OR to_location LIKE '%Biratnagar%' OR to_location LIKE '%Dhangadhi%' OR to_location LIKE '%Janakpur%' OR to_location LIKE '%Birgunj%')
  THEN 'domestic'
  ELSE 'international'
END
WHERE flight_type = 'domestic';
