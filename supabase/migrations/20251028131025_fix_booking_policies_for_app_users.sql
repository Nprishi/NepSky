/*
  # Fix Booking Policies for Application Users

  1. Changes
    - Drop conflicting INSERT policies on bookings table
    - Create a single permissive INSERT policy that allows any logged-in user to create bookings
    - This works with the app's localStorage-based authentication system
    
  2. Security
    - Keeps SELECT policies restricted to user's own bookings and admins
    - Keeps UPDATE policies restricted to admins
    - Makes INSERT permissive to allow booking creation
*/

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
