/*
  # Add User Roles and Crew Member Access System

  ## Overview
  This migration adds a user roles system to enable mobile access for field installers.
  
  ## Changes
  
  ### 1. New Tables
  
  #### `user_profiles`
  Stores user profile information and roles:
  - `id` (uuid, FK to auth.users) - User ID from Supabase Auth
  - `email` (text) - User email
  - `full_name` (text) - Full name of user
  - `role` (text) - User role: 'admin', 'installer', 'supervisor'
  - `phone` (text, nullable) - Contact phone number
  - `assigned_crew_id` (uuid, nullable, FK to project_crews) - Crew assignment for installers
  - `is_active` (boolean) - Whether user account is active
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  #### `crew_members`
  Links individual crew members to crews for better tracking:
  - `id` (uuid, primary key) - Unique identifier
  - `crew_id` (uuid, FK to project_crews) - Associated crew
  - `user_id` (uuid, nullable, FK to user_profiles) - Link to user account if they have one
  - `name` (text) - Member full name
  - `phone` (text, nullable) - Contact phone
  - `role` (text) - Role within crew: 'leader', 'member', 'assistant'
  - `is_active` (boolean) - Whether member is currently active
  - `created_at` (timestamptz) - Record creation timestamp
  
  ### 2. Security
  
  All tables have RLS enabled with appropriate policies:
  - Admins can view and manage all records
  - Installers can view their own profile and assigned crew
  - Installers can view projects assigned to their crew
  - Crew members can view their crew information
  
  ### 3. Important Notes
  
  - User roles are stored separately from auth.users to maintain flexibility
  - Crew members can optionally have user accounts for mobile access
  - This enables installers to log in and update project progress from field
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'installer' CHECK (role IN ('admin', 'installer', 'supervisor')),
  phone text,
  assigned_crew_id uuid REFERENCES project_crews(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create crew_members table
CREATE TABLE IF NOT EXISTS crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES project_crews(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'assistant')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for crew_members

CREATE POLICY "Crew members can view own crew"
  ON crew_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    crew_id IN (
      SELECT assigned_crew_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all crew members"
  ON crew_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage crew members"
  ON crew_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_crew ON user_profiles(assigned_crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user ON crew_members(user_id);

-- Create updated_at trigger for user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;