/*
  # Fix Projects Infinite Recursion for Installers

  1. Problem
    - Projects policies query project_collaborators
    - Project_collaborators policies query projects
    - This creates infinite recursion: projects → project_collaborators → projects
    - Installers trying to view projects through crews get caught in this loop

  2. Solution
    - Add a dedicated policy for installers to view projects through crews
    - This bypasses the project_collaborators recursion entirely
    - Installers don't use project_collaborators, they use project_crews

  3. Changes
    - Add new policy: "Installers can view projects through assigned crews"
    - This policy checks user_profiles.assigned_crew_id and project_crews
    - Does not query project_collaborators, breaking the recursion cycle
*/

-- Add policy for installers to view projects through their assigned crews
CREATE POLICY "Installers can view projects through assigned crews"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM user_profiles up
      JOIN project_crews pc ON pc.id = up.assigned_crew_id
      WHERE up.id = auth.uid()
      AND pc.project_id = projects.id
    )
  );
