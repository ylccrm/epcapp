/*
  # Fix User Roles - Ensure Only 3 Roles Exist

  ## Overview
  This migration ensures the user_profiles table has exactly 3 roles as specified:
  - admin: Full system access
  - installer: Limited access to assigned projects
  - supervisor: Can view all projects with intermediate permissions

  ## Changes

  ### 1. Update Role Constraint
  - Remove 'regular' role from CHECK constraint
  - Allow only: admin, installer, supervisor

  ### 2. Update Default Value
  - Change default role from 'regular' to 'installer'

  ### 3. Data Migration
  - Update any existing 'regular' users to 'installer' role

  ### 4. Important Notes
  - This ensures a clean 3-role system
  - All new users default to 'installer' role
  - Admins must explicitly assign admin or supervisor roles
*/

-- First, update any existing 'regular' role users to 'installer'
UPDATE user_profiles 
SET role = 'installer' 
WHERE role = 'regular';

-- Drop the old constraint
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add new constraint with only 3 roles
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'installer', 'supervisor'));

-- Update default value to 'installer'
ALTER TABLE user_profiles 
ALTER COLUMN role SET DEFAULT 'installer';

-- Update column comment
COMMENT ON COLUMN user_profiles.role IS 'User role: admin (full system access), installer (limited to assigned projects), supervisor (view all projects with intermediate permissions)';
