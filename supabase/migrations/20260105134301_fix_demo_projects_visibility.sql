/*
  # Fix Demo Projects Visibility

  1. Changes
    - Add policy to allow all authenticated users to view demo projects (projects with NULL created_by)
    - This enables demo data to be visible immediately after login
  
  2. Security
    - Only applies to SELECT operations
    - Only affects projects without an owner (created_by IS NULL)
    - Users still need to be authenticated
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Demo projects visible to all authenticated users" ON projects;

-- Create policy to allow viewing demo projects
CREATE POLICY "Demo projects visible to all authenticated users"
  ON projects
  FOR SELECT
  TO authenticated
  USING (created_by IS NULL);
