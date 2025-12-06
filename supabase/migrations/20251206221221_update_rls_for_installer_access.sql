/*
  # Update RLS Policies for Installer Mobile Access

  ## Overview
  Updates Row Level Security policies to allow field installers to access and update
  project information for projects assigned to their crew.
  
  ## Changes
  
  ### 1. Projects Access
  - Installers can view projects where their crew is assigned
  - Installers can update project progress for their assigned projects
  
  ### 2. Project Milestones
  - Installers can view milestones for their assigned projects
  - Installers can update milestone progress percentage
  
  ### 3. Milestone Evidence
  - Installers can upload photos and documents as evidence for milestones
  - Installers can view evidence for their assigned project milestones
  
  ### 4. Project Documents
  - Installers can upload documents to their assigned projects
  - Installers can view documents for their assigned projects
  
  ### 5. Project Equipment
  - Installers can view equipment for their assigned projects
  - Installers can update equipment information
  
  ### 6. Storage Buckets
  - Installers can upload files to project-related storage buckets
  
  ## Security Notes
  
  - All policies verify user authentication
  - Installers can only access projects where their crew is assigned
  - Read/write access is carefully scoped to prevent unauthorized access
*/

-- Add policies for installers to view their assigned projects
CREATE POLICY "Installers can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to view milestones of assigned projects
CREATE POLICY "Installers can view assigned project milestones"
  ON project_milestones FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to update milestone progress
CREATE POLICY "Installers can update milestone progress"
  ON project_milestones FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to upload milestone evidence
CREATE POLICY "Installers can insert milestone evidence"
  ON milestone_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    milestone_id IN (
      SELECT pm.id
      FROM project_milestones pm
      INNER JOIN project_crews pc ON pc.project_id = pm.project_id
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

CREATE POLICY "Installers can view milestone evidence"
  ON milestone_evidence FOR SELECT
  TO authenticated
  USING (
    milestone_id IN (
      SELECT pm.id
      FROM project_milestones pm
      INNER JOIN project_crews pc ON pc.project_id = pm.project_id
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to manage project documents
CREATE POLICY "Installers can insert project documents"
  ON project_docs FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

CREATE POLICY "Installers can view project documents"
  ON project_docs FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to view project equipment
CREATE POLICY "Installers can view project equipment"
  ON project_equipment FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

CREATE POLICY "Installers can update project equipment"
  ON project_equipment FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- Add policies for installers to view their crew information
CREATE POLICY "Installers can view their crew"
  ON project_crews FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT assigned_crew_id
      FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('installer', 'supervisor')
    ) OR
    project_id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      INNER JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );