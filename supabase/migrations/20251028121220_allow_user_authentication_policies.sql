/*
  # Allow User Authentication

  1. Changes
    - Add policy to allow anyone to read user data for login verification
    - Add policy to allow anyone to insert new users for signup
  
  2. Security
    - Users can check credentials for login
    - Anyone can create new users (signup)
*/

CREATE POLICY "Public can check user credentials"
  ON users FOR SELECT
  TO anon, authenticated
  USING (role = 'user');

CREATE POLICY "Public can signup new users"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (role = 'user');
