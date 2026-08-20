-- Create users table to replace Supabase Auth
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update profiles table to reference our users table
-- This will be handled in the main migration sequence by modifying the existing profiles table definition if needed,
-- or by creating it if it doesn't exist yet.
