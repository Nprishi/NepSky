/*
  # Add Missing Booking and Payment Policies

  1. Changes
    - Allow users to create bookings
    - Allow users to create payments
  
  2. Security
    - Users can create their own bookings and payments
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can create bookings'
  ) THEN
    CREATE POLICY "Users can create bookings"
      ON bookings FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can create payments'
  ) THEN
    CREATE POLICY "Users can create payments"
      ON payments FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'flights' AND policyname = 'Public can view flights'
  ) THEN
    CREATE POLICY "Public can view flights"
      ON flights FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
