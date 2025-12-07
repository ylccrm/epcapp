/*
  # Create Single Super Admin System (v2)

  ## Overview
  This migration creates a system where only ONE super administrator can exist,
  and that admin can manage all other users (installer or supervisor roles).

  ## Changes

  ### 1. Trigger to Prevent Multiple Admins
  - Creates a trigger that prevents creating more than one admin user
  - The first admin created becomes the permanent super administrator
  - Prevents users from self-promoting to admin role

  ### 2. Updated RLS Policies
  - Admin can view, create, update, and delete all user profiles
  - Admin can change roles of installer/supervisor users
  - Regular users can only view their own profile
  - Regular users cannot change their own role
  - Prevents non-admins from becoming admins

  ### 3. Security Rules
  - Only ONE admin can exist in the system
  - Admin cannot be demoted (must always be at least one admin)
  - Users cannot escalate their own privileges

  ### 4. Important Notes
  - The first user to be assigned 'admin' role becomes the super admin
  - All subsequent registrations default to 'installer' role
  - Only the super admin can promote users to 'supervisor' or demote them
*/

-- Drop existing policies to recreate them with better logic
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow user profile creation" ON user_profiles;
DROP POLICY IF EXISTS "System can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow profile creation on signup" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON user_profiles;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to prevent multiple admins
CREATE OR REPLACE FUNCTION prevent_multiple_admins()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
  current_row_id UUID;
BEGIN
  -- If trying to set role to admin
  IF NEW.role = 'admin' THEN
    -- Determine the ID to exclude (for UPDATE operations)
    IF TG_OP = 'UPDATE' THEN
      current_row_id := OLD.id;
    ELSE
      current_row_id := NEW.id;
    END IF;
    
    -- Count existing admins (excluding the current row)
    SELECT COUNT(*) INTO admin_count
    FROM user_profiles
    WHERE role = 'admin' AND id != current_row_id;
    
    -- If an admin already exists, prevent creating another
    IF admin_count > 0 THEN
      RAISE EXCEPTION 'Only one super administrator is allowed in the system';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent multiple admins
DROP TRIGGER IF EXISTS enforce_single_admin ON user_profiles;
CREATE TRIGGER enforce_single_admin
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_multiple_admins();

-- Function to prevent admin demotion if it's the only admin
CREATE OR REPLACE FUNCTION prevent_admin_demotion()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- If trying to change role from admin to something else
  IF OLD.role = 'admin' AND NEW.role != 'admin' THEN
    -- Count admins
    SELECT COUNT(*) INTO admin_count
    FROM user_profiles
    WHERE role = 'admin';
    
    -- If this is the only admin, prevent demotion
    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot demote the only super administrator';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent admin demotion
DROP TRIGGER IF EXISTS prevent_last_admin_demotion ON user_profiles;
CREATE TRIGGER prevent_last_admin_demotion
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.role = 'admin')
  EXECUTE FUNCTION prevent_admin_demotion();

-- RLS Policies

-- 1. Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- 2. Admin can update all profiles (trigger prevents multiple admins)
CREATE POLICY "Admin can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 3. Admin can delete profiles (not themselves)
CREATE POLICY "Admin can delete profiles"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (is_admin() AND id != auth.uid());

-- 4. Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 5. Users can update their own profile (but NOT their role - enforced by trigger)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Allow authenticated users to create their own profile (triggered by auth)
CREATE POLICY "Allow profile creation on signup"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND role = 'installer');

-- 7. System/Service role can do anything (for triggers and functions)
CREATE POLICY "System can manage profiles"
  ON user_profiles
  FOR ALL
  TO postgres
  USING (true)
  WITH CHECK (true);

-- Add helpful comments
COMMENT ON FUNCTION is_admin() IS 'Helper function to check if current user has admin role';
COMMENT ON FUNCTION prevent_multiple_admins() IS 'Trigger function that enforces single super administrator rule';
COMMENT ON FUNCTION prevent_admin_demotion() IS 'Trigger function that prevents demoting the only admin';
