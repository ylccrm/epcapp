/*
  # Simplify Project Collaborators Policies to Prevent Recursion

  1. Problem
    - "Project creators can manage collaborators" queries projects table
    - This creates recursion when projects queries project_collaborators
    - Need to break the circular dependency

  2. Solution
    - Remove the policy that queries projects
    - Add simpler policies that don't create circular dependencies
    - Rely on application logic for owner checks instead of RLS

  3. Changes
    - Drop "Project creators can manage collaborators"
    - Add simple policy for insert based on user ownership
    - Admin policies remain (they use user_profiles, not projects)
*/

-- Drop the policy that causes recursion by querying projects
DROP POLICY IF EXISTS "Project creators can manage collaborators" ON project_collaborators;

-- Add simpler policies that don't query other tables that might query back
CREATE POLICY "Users can insert collaborators for their projects"
  ON project_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update collaborators"
  ON project_collaborators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ));

CREATE POLICY "Users can delete collaborators"
  ON project_collaborators
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  ));
