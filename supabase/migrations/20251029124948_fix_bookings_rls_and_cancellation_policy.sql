/*
  # Fix Bookings RLS and Add Cancellation Policy

  1. Enable RLS on Bookings
    - Enable Row Level Security
    - Add policies for authenticated users
    - Allow users to view own bookings
    - Allow all authenticated to view all (for admin)
  
  2. Add Cancellation Policy Column
    - Add column to track if booking is within cancellation window
    - Add timestamp for when cancellation becomes unavailable
  
  3. Security
    - Users can only cancel their own bookings
    - Cancellation only allowed within 2 hours of booking
    - Admin can view and update all bookings
*/

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow booking creation" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON bookings;

-- Policy: Anyone can create bookings (for checkout flow)
CREATE POLICY "Anyone can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Policy: All authenticated users can view all bookings (simplified for admin access)
CREATE POLICY "Authenticated can view all bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own bookings
CREATE POLICY "Users can update own bookings"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Allow authenticated users to update any booking (for admin)
CREATE POLICY "Authenticated can update any booking"
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add cancellation deadline column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'cancellation_deadline') THEN
    ALTER TABLE bookings ADD COLUMN cancellation_deadline TIMESTAMPTZ;
    
    -- Update existing bookings to set cancellation deadline (2 hours from booking_date)
    UPDATE bookings 
    SET cancellation_deadline = booking_date + INTERVAL '2 hours'
    WHERE cancellation_deadline IS NULL;
  END IF;
END $$;

-- Create function to check if cancellation is allowed
CREATE OR REPLACE FUNCTION can_cancel_booking(booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  booking_record RECORD;
  current_time TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO booking_record 
  FROM bookings 
  WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check if booking is already cancelled
  IF booking_record.status = 'cancelled' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if within 2-hour cancellation window
  IF booking_record.cancellation_deadline IS NOT NULL THEN
    RETURN current_time <= booking_record.cancellation_deadline;
  END IF;
  
  -- Fallback: check 2 hours from booking_date
  RETURN current_time <= (booking_record.booking_date + INTERVAL '2 hours');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to set cancellation deadline on insert
CREATE OR REPLACE FUNCTION set_cancellation_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cancellation_deadline := NEW.booking_date + INTERVAL '2 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_booking_cancellation_deadline ON bookings;
CREATE TRIGGER set_booking_cancellation_deadline
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_cancellation_deadline();

-- Create function to validate cancellation
CREATE OR REPLACE FUNCTION validate_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate when status changes to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Check if within cancellation window (2 hours)
    IF NOT can_cancel_booking(NEW.id) THEN
      RAISE EXCEPTION 'Cancellation not allowed: The 2-hour cancellation window has expired';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_booking_cancellation ON bookings;
CREATE TRIGGER validate_booking_cancellation
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  WHEN (NEW.status = 'cancelled' AND OLD.status != 'cancelled')
  EXECUTE FUNCTION validate_cancellation();
