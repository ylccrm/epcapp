/*
  # Add DELETE Policy for Projects

  This migration adds RLS policy to allow users to delete their own projects.

  ## Changes Made

  1. **Add DELETE Policy**
     - Admins can delete any project
     - Supervisors can delete any project
     - Project owners can delete their own projects

  2. **Security**
     - Only authenticated users can delete
     - Regular users can only delete projects they created
     - Ensures proper data isolation

  ## Notes
  - Deletion will cascade to related tables if FK constraints are set
  - Consider soft deletes for production if audit trail is needed
*/

CREATE POLICY "Admins and supervisors can delete any project"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('admin', 'supervisor')
    )
  );

CREATE POLICY "Owners can delete their own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());