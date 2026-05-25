

-- Drop all existing INSERT policies on bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

-- Create a single permissive INSERT policy
-- This allows any user (authenticated via the app) to create bookings
CREATE POLICY "Allow booking creation"
  ON bookings
  FOR INSERT
  TO public
  WITH CHECK (true);
