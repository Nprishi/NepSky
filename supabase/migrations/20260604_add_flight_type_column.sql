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

-- Helper: Update flights to set flight_type based on whether both cities are in Nepal
-- Domestic flights: both from and to are Nepal cities
-- International flights: at least one city is outside Nepal

-- First, set all flights with both cities in Nepal as domestic
UPDATE flights
SET flight_type = 'domestic'
WHERE 
  (from_location ILIKE '%kathmandu%' OR from_location ILIKE '%pokhara%' OR from_location ILIKE '%biratnagar%' OR from_location ILIKE '%dhangadhi%' OR from_location ILIKE '%janakpur%' OR from_location ILIKE '%birgunj%' OR from_location ILIKE '%nepalgunj%')
  AND 
  (to_location ILIKE '%kathmandu%' OR to_location ILIKE '%pokhara%' OR to_location ILIKE '%biratnagar%' OR to_location ILIKE '%dhangadhi%' OR to_location ILIKE '%janakpur%' OR to_location ILIKE '%birgunj%' OR to_location ILIKE '%nepalgunj%');

-- All remaining flights are international
UPDATE flights
SET flight_type = 'international'
WHERE flight_type = 'domestic' AND NOT (
  (from_location ILIKE '%kathmandu%' OR from_location ILIKE '%pokhara%' OR from_location ILIKE '%biratnagar%' OR from_location ILIKE '%dhangadhi%' OR from_location ILIKE '%janakpur%' OR from_location ILIKE '%birgunj%' OR from_location ILIKE '%nepalgunj%')
  AND 
  (to_location ILIKE '%kathmandu%' OR to_location ILIKE '%pokhara%' OR to_location ILIKE '%biratnagar%' OR to_location ILIKE '%dhangadhi%' OR to_location ILIKE '%janakpur%' OR to_location ILIKE '%birgunj%' OR to_location ILIKE '%nepalgunj%')
);

-- Verify the results
SELECT flight_number, from_location, to_location, flight_type FROM flights ORDER BY flight_type;
