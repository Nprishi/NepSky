/*
  # Add Admin User

  1. Changes
    - Insert admin user with email adminself@gmail.com
    - Set role as admin
    - Set status as active
  
  2. Security
    - Admin user will have full access to admin dashboard
*/

-- Insert admin user if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'adminself@gmail.com'
  ) THEN
    INSERT INTO users (email, full_name, phone, role, status)
    VALUES (
      'adminself@gmail.com',
      'Admin Self',
      '+977-1-1234567',
      'admin',
      'active'
    );
  END IF;
END $$;
