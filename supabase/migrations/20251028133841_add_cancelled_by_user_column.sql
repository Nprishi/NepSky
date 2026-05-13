/*
  # Add Cancelled By User Column

  1. Changes
    - Add `cancelled_by_user` boolean column to bookings table
    - Defaults to false
    - This tracks if user requested cancellation (not admin-initiated)
    
  2. Purpose
    - Only allows admin to cancel bookings if user requests it
    - Prevents admin from arbitrarily cancelling bookings
    - Tracks revenue deduction properly on user-requested cancellations
*/

-- Add cancelled_by_user column to bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'cancelled_by_user'
  ) THEN
    ALTER TABLE bookings ADD COLUMN cancelled_by_user BOOLEAN DEFAULT false;
  END IF;
END $$;
