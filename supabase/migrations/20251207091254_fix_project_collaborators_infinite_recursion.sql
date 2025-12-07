/*
  # Fix Infinite Recursion in Project Collaborators RLS

  1. Problem
    - The policy "Project owners can manage collaborators" causes infinite recursion
    - It queries project_collaborators within a project_collaborators policy
    - This creates a loop when projects table tries to check collaborators

  2. Solution
    - Drop the problematic policy
    - Replace with simpler policies that don't cause recursion
    - Use projects table ownership instead of self-referencing collaborators

  3. Changes
    - Drop "Project owners can manage collaborators" policy
    - Add new policy based on projects.created_by (owner)
    - Keep admin and user view policies (they don't cause recursion)
*/

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Project owners can manage collaborators" ON project_collaborators;

-- Add simpler policy: Project creators can manage collaborators
CREATE POLICY "Project creators can manage collaborators"
  ON project_collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.created_by = auth.uid()
    )
  );
