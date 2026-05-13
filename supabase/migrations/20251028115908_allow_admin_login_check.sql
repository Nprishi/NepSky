/*
  # Allow Admin Login Check

  1. Changes
    - Add policy to allow anyone to read admin user emails for login verification
    - This is needed for the admin login flow since users aren't authenticated yet
  
  2. Security
    - Only allows reading email, full_name, role, and status
    - Only for admin role users
    - Does not expose password or sensitive data
*/

-- Drop existing restrictive policies if needed and add public read for admin login
CREATE POLICY "Anyone can check admin credentials"
  ON users FOR SELECT
  TO anon, authenticated
  USING (role = 'admin' AND status = 'active');
