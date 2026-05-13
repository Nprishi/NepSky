/*
  # Add Settings and Payments Tables

  1. New Tables
    - `site_settings`
      - `id` (uuid, primary key)
      - `usd_to_npr_rate` (numeric) - Exchange rate from USD to NPR
      - `site_name` (text) - Site name
      - `site_email` (text) - Site contact email
      - `site_phone` (text) - Site contact phone
      - `esewa_merchant_id` (text) - eSewa payment merchant ID
      - `esewa_secret_key` (text) - eSewa payment secret key
      - `updated_at` (timestamp)
      - `updated_by` (uuid, foreign key to users)
    
    - `payments`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, foreign key to bookings)
      - `user_id` (uuid, foreign key to users)
      - `amount_usd` (numeric) - Amount in USD
      - `amount_npr` (numeric) - Amount in NPR
      - `exchange_rate` (numeric) - Exchange rate used
      - `payment_method` (text) - Payment method used
      - `payment_gateway` (text) - Payment gateway (esewa, etc.)
      - `transaction_id` (text) - Transaction ID from gateway
      - `status` (text) - Payment status
      - `payment_date` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usd_to_npr_rate numeric NOT NULL DEFAULT 132.50,
  site_name text NOT NULL DEFAULT 'Nepal International Air Ticketing',
  site_email text NOT NULL DEFAULT 'info@nepalairlines.com',
  site_phone text NOT NULL DEFAULT '+977-1-1234567',
  esewa_merchant_id text DEFAULT '',
  esewa_secret_key text DEFAULT '',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON site_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM site_settings LIMIT 1) THEN
    INSERT INTO site_settings (id) VALUES (gen_random_uuid());
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  user_id uuid REFERENCES users(id),
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_npr numeric NOT NULL DEFAULT 0,
  exchange_rate numeric NOT NULL DEFAULT 132.50,
  payment_method text NOT NULL,
  payment_gateway text DEFAULT '',
  transaction_id text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
