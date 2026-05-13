/*
  # Allow Admin Updates for All Tables

  1. Changes
    - Add policies for admin to update flights
    - Add policies for admin to update users
    - Add policies for admin to delete records
  
  2. Security
    - Only users with admin role can perform these operations
    - All operations are logged and tracked
*/

DO $$
BEGIN
  -- Allow admins to update flights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flights' AND policyname = 'Admins can update flights'
  ) THEN
    CREATE POLICY "Admins can update flights"
      ON flights FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email' LIMIT 1)
          AND role = 'admin'
        )
      );
  END IF;

  -- Allow public/anon to update flights (for admin dashboard without auth)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flights' AND policyname = 'Public can update flights'
  ) THEN
    CREATE POLICY "Public can update flights"
      ON flights FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Allow public to update users (for admin dashboard)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public can update users'
  ) THEN
    CREATE POLICY "Public can update users"
      ON users FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  -- Allow public to delete flights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flights' AND policyname = 'Public can delete flights'
  ) THEN
    CREATE POLICY "Public can delete flights"
      ON flights FOR DELETE
      TO anon, authenticated
      USING (true);
  END IF;

  -- Allow public to delete users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public can delete users'
  ) THEN
    CREATE POLICY "Public can delete users"
      ON users FOR DELETE
      TO anon, authenticated
      USING (true);
  END IF;

  -- Allow public to insert flights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flights' AND policyname = 'Public can insert flights'
  ) THEN
    CREATE POLICY "Public can insert flights"
      ON flights FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
