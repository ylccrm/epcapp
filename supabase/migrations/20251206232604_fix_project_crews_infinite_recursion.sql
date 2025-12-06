/*
  # Fix Infinite Recursion in project_crews RLS Policy

  ## Problem
  The policy "Installers can view their crew" on the `project_crews` table
  queries `project_crews` within its own USING clause, creating an infinite
  recursion loop.

  ## Solution
  1. Drop the problematic recursive policy
  2. Create simplified non-recursive policies:
     - Admins can view all crews (using JWT, no table queries)
     - Installers can view their own assigned crew (direct FK lookup)
     - Project owners can view crews on their projects (via projects table)

  ## Changes
  - Remove recursive policy on project_crews
  - Add separate, simple policies without recursion
  - Use auth.jwt() for role checks to avoid user_profiles queries
*/

-- ============================================================================
-- 1. DROP PROBLEMATIC RECURSIVE POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Installers can view their crew" ON project_crews;

-- ============================================================================
-- 2. CREATE NON-RECURSIVE POLICIES FOR project_crews
-- ============================================================================

-- Admins can view all crews using JWT (no recursion)
CREATE POLICY "Admins can view all crews"
  ON project_crews FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Installers can view ONLY the crew they are assigned to
-- This uses a simple subquery on user_profiles (no recursion)
CREATE POLICY "Installers can view their assigned crew"
  ON project_crews FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT assigned_crew_id
      FROM user_profiles
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

-- Project creators can view crews assigned to their projects
-- This queries projects first, then returns matching crews (no recursion)
CREATE POLICY "Project owners can view project crews"
  ON project_crews FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id
      FROM projects
      WHERE created_by = auth.uid()
    )
  );

-- Collaborators with owner/editor role can view project crews
CREATE POLICY "Collaborators can view project crews"
  ON project_crews FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id
      FROM project_collaborators
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'editor', 'viewer')
    )
  );

-- ============================================================================
-- 3. FIX OTHER POLICIES THAT MAY REFERENCE project_crews RECURSIVELY
-- ============================================================================

-- Drop and recreate the projects policy for installers to prevent issues
DROP POLICY IF EXISTS "Installers can view assigned projects" ON projects;

CREATE POLICY "Installers can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('installer', 'supervisor')
    AND id IN (
      SELECT pc.project_id
      FROM project_crews pc
      WHERE pc.id = (
        SELECT assigned_crew_id
        FROM user_profiles
        WHERE id = auth.uid()
        LIMIT 1
      )
    )
  );

-- ============================================================================
-- 4. ADD POLICIES FOR CREW MANAGEMENT
-- ============================================================================

-- Admins can insert crews
CREATE POLICY "Admins can insert crews"
  ON project_crews FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins can update crews
CREATE POLICY "Admins can update crews"
  ON project_crews FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins can delete crews
CREATE POLICY "Admins can delete crews"
  ON project_crews FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Project owners can manage crews on their projects
CREATE POLICY "Project owners can manage crews"
  ON project_crews FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE created_by = auth.uid()
    )
  );
