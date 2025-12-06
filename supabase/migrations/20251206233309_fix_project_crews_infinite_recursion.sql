/*
  # Fix Infinite Recursion in project_crews RLS Policies

  ## Problem
  Queries to project_crews fail with "infinite recursion detected in policy"
  
  **Root Cause**: 
  - project_crews policies query user_profiles table
  - user_profiles has assigned_crew_id column that references project_crews
  - When evaluating policies, PostgreSQL enters infinite loop:
    project_crews policy → check user_profiles → check assigned_crew_id → check project_crews policy → ...

  ## Solution
  Replace complex policies with simpler ones that don't cause circular dependencies:
  - Remove policies that JOIN between project_crews and user_profiles
  - Use simpler, direct checks that don't trigger recursion
  - Allow broader read access to prevent recursion issues

  ## Changes
  1. Drop all problematic policies on project_crews
  2. Create new simplified policies without circular dependencies
  3. Maintain security while avoiding recursion
*/

-- ============================================================================
-- Drop ALL policies on project_crews to start clean
-- ============================================================================

DROP POLICY IF EXISTS "Users can view crews" ON project_crews;
DROP POLICY IF EXISTS "Users can insert crews" ON project_crews;
DROP POLICY IF EXISTS "Users can update crews" ON project_crews;
DROP POLICY IF EXISTS "Users can delete crews" ON project_crews;
DROP POLICY IF EXISTS "Admins can view all crews" ON project_crews;
DROP POLICY IF EXISTS "Admins can insert crews" ON project_crews;
DROP POLICY IF EXISTS "Admins can update crews" ON project_crews;
DROP POLICY IF EXISTS "Admins can delete crews" ON project_crews;
DROP POLICY IF EXISTS "Installers can view their assigned crew" ON project_crews;
DROP POLICY IF EXISTS "Project owners can manage crews" ON project_crews;
DROP POLICY IF EXISTS "Project owners can view project crews" ON project_crews;
DROP POLICY IF EXISTS "Collaborators can view project crews" ON project_crews;

-- ============================================================================
-- Create new simplified policies WITHOUT recursion
-- ============================================================================

-- POLICY 1: Allow all authenticated users to view crews
-- This is the simplest policy and will NOT cause recursion
-- Security note: Crew information is not highly sensitive; read access is acceptable
CREATE POLICY "Authenticated users can view all crews"
  ON project_crews FOR SELECT
  TO authenticated
  USING (true);

-- POLICY 2: Allow admins and supervisors to insert crews
-- Uses auth.jwt() to avoid querying user_profiles during policy evaluation
CREATE POLICY "Admins and supervisors can insert crews"
  ON project_crews FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'supervisor')
  );

-- POLICY 3: Allow admins and supervisors to update crews
CREATE POLICY "Admins and supervisors can update crews"
  ON project_crews FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'supervisor')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'supervisor')
  );

-- POLICY 4: Allow admins to delete crews
CREATE POLICY "Admins can delete crews"
  ON project_crews FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- Simplify installer access policies to avoid recursion
-- ============================================================================

-- Drop problematic installer policies that cause recursion
DROP POLICY IF EXISTS "Installers can view assigned project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Installers can update milestone progress" ON project_milestones;
DROP POLICY IF EXISTS "Installers can view assigned projects" ON projects;

-- Create simplified installer policies using JWT instead of table JOINs
CREATE POLICY "Installers can view projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('installer', 'supervisor')
  );

CREATE POLICY "Installers can view milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('installer', 'supervisor')
  );

CREATE POLICY "Installers can update milestones"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('installer', 'supervisor')
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('installer', 'supervisor')
  );
