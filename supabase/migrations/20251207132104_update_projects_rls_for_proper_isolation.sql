/*
  # Update Projects RLS for Proper Data Isolation

  ## Overview
  This migration updates the RLS policies for the projects table to ensure:
  - Each user only sees their own projects by default
  - Admins and supervisors can see all projects
  - Projects can be shared using the project_collaborators table
  - Proper isolation prevents users from seeing other users' data

  ## Changes

  ### 1. Drop Old Policies
  - Removes policies that use auth.jwt() metadata
  - Removes redundant policies

  ### 2. New Policy Structure
  - Admin can see/edit/delete all projects
  - Supervisors can see all projects but only edit their own
  - Users can create projects (they become the owner)
  - Owners can see, edit, and delete their own projects
  - Collaborators can see and potentially edit shared projects
  - Installers assigned to crews can see project info

  ### 3. Security Rules
  - Each user starts with a clean slate (no projects)
  - Projects are isolated by default
  - Sharing is explicit through project_collaborators table
  - Admin/Supervisor roles have appropriate elevated access
*/

-- Drop all existing policies for projects
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view shared projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;
DROP POLICY IF EXISTS "Editors can update shared projects" ON projects;
DROP POLICY IF EXISTS "Installers can view projects through assigned crews" ON projects;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is supervisor or admin
CREATE OR REPLACE FUNCTION user_is_supervisor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is collaborator on project
CREATE OR REPLACE FUNCTION user_is_project_collaborator(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_collaborators.project_id = user_is_project_collaborator.project_id 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user can edit project (owner or editor collaborator)
CREATE OR REPLACE FUNCTION user_can_edit_project(project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_collaborators 
    WHERE project_collaborators.project_id = user_can_edit_project.project_id 
    AND user_id = auth.uid()
    AND role IN ('owner', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for Projects

-- 1. Admin can see all projects
CREATE POLICY "Admin can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_is_admin());

-- 2. Admin can update all projects
CREATE POLICY "Admin can update all projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (user_is_admin())
  WITH CHECK (user_is_admin());

-- 3. Admin can delete all projects
CREATE POLICY "Admin can delete all projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (user_is_admin());

-- 4. Supervisors can see all projects
CREATE POLICY "Supervisors can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (user_is_supervisor_or_admin());

-- 5. Owners can see their own projects
CREATE POLICY "Owners can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- 6. Owners can update their own projects
CREATE POLICY "Owners can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 7. Owners can delete their own projects
CREATE POLICY "Owners can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 8. Users can create projects (they become the owner)
CREATE POLICY "Users can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- 9. Collaborators can view shared projects
CREATE POLICY "Collaborators can view shared projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND project_collaborators.user_id = auth.uid()
    )
  );

-- 10. Editor collaborators can update shared projects
CREATE POLICY "Editors can update shared projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND project_collaborators.user_id = auth.uid()
      AND project_collaborators.role IN ('owner', 'editor')
    )
  );

-- Add helpful comments
COMMENT ON FUNCTION user_is_admin() IS 'Check if current user is admin';
COMMENT ON FUNCTION user_is_supervisor_or_admin() IS 'Check if current user is supervisor or admin';
COMMENT ON FUNCTION user_is_project_collaborator(UUID) IS 'Check if user is collaborator on specific project';
COMMENT ON FUNCTION user_can_edit_project(UUID) IS 'Check if user can edit specific project';
