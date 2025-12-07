/*
  # Simplify User Roles - Remove Crew Member Role System

  ## Overview
  This migration simplifies the role system by removing the crew_members table
  and its associated role system (leader, member, assistant).

  ## Changes

  ### 1. Removed Tables
  - `crew_members` - No longer needed; crew information is managed through project_crews table

  ### 2. User Roles (Maintained)
  The system now uses only 3 user roles in the `user_profiles` table:
  - **admin** - Full system access, can manage all projects, users, and settings
  - **installer** - Limited access to assigned projects only
  - **supervisor** - Intermediate permissions, can view all projects but with limited editing rights

  ### 3. Cleanup
  - Drop crew_members table and all its policies
  - Remove foreign key constraint from user_profiles.assigned_crew_id if it references crew_members

  ### 4. Important Notes
  - User roles are exclusively managed through the user_profiles table
  - Crew composition is managed through the project_crews table (leader_name, members array)
  - This simplification reduces complexity while maintaining all necessary functionality
*/

-- Drop crew_members table and all its dependencies
DROP TABLE IF EXISTS crew_members CASCADE;

-- Remove any orphaned policies (cleanup)
DO $$
BEGIN
  -- Additional cleanup if needed
  NULL;
END $$;

-- Add comment to user_profiles table explaining the role system
COMMENT ON COLUMN user_profiles.role IS 'User role: admin (full access), installer (limited to assigned projects), supervisor (view all projects with limited editing)';
