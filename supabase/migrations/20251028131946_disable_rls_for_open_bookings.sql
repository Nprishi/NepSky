/*
  # Disable RLS for Open Booking Access

  1. Changes
    - Disable RLS on bookings table to allow unrestricted access
    - Disable RLS on payments table to allow payment records
    - Disable RLS on flights table for seat updates
    - This allows the app to create bookings without authentication barriers
    
  2. Security Note
    - This is for development/demo purposes
    - In production, you would implement proper authentication
*/

-- Disable RLS on bookings table
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Disable RLS on payments table
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on flights table
ALTER TABLE flights DISABLE ROW LEVEL SECURITY;
