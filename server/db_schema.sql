
-- Enable required extensions (run as a superuser / owner of DB)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (app-level metadata; authentication may still be handled by Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  role text NOT NULL DEFAULT 'user',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  blocked boolean DEFAULT false,
  suspended_until timestamptz,
  blocked_reason text,
  suspended_reason text
);

-- Flights table (columns used by the frontend)
CREATE TABLE IF NOT EXISTS flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number text UNIQUE NOT NULL,
  airline text NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  price numeric(10,2) NOT NULL DEFAULT 0,
  available_seats integer NOT NULL DEFAULT 0,
  total_seats integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled',
  aircraft_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  flight_id uuid REFERENCES flights(id) ON DELETE SET NULL,
  passenger_name text,
  passenger_email text,
  passenger_phone text,
  seat_number text,
  booking_reference text UNIQUE NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional seats table (if you want to track seat inventory per flight)
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id uuid REFERENCES flights(id) ON DELETE CASCADE,
  seat_number text NOT NULL,
  class text DEFAULT 'Economy',
  is_available boolean DEFAULT true,
  price numeric(10,2) DEFAULT 0,
  position text,
  UNIQUE(flight_id, seat_number)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_flights_departure_time ON flights(departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_reference ON bookings(booking_reference);

-- Example: add a sample admin user (change email as needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'adminself@gmail.com') THEN
    INSERT INTO users (email, name, role, status) VALUES ('adminself@gmail.com', 'Admin Self', 'admin', 'active');
  END IF;
END$$;

-- End of schema

-- Additional tables present in Supabase project UI
-- 1) user_details: extended profile information (one-to-one with users)
CREATE TABLE IF NOT EXISTS user_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date,
  nationality text,
  passport_number text,
  address text,
  city text,
  state text,
  country text,
  postal_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_details_user_id ON user_details(user_id);

-- 2) events: promo or system events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);

-- 3) notifications: messages for users (in-app / email / push)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  channel text DEFAULT 'in-app', -- e.g. 'in-app', 'email', 'push', 'sms'
  is_read boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 4) shortlist: user's saved flights / wishlist
CREATE TABLE IF NOT EXISTS shortlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  flight_id uuid REFERENCES flights(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_shortlist_user_flight ON shortlist(user_id, flight_id);

