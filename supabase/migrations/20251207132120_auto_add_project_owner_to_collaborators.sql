/*
  # Auto-add Project Owner to Collaborators

  ## Overview
  This migration creates a trigger that automatically adds the project creator
  as an 'owner' in the project_collaborators table when a new project is created.

  ## Changes

  ### 1. Trigger Function
  - Automatically inserts a row in project_collaborators
  - Sets the creator as 'owner' role
  - Runs after project INSERT

  ### 2. Security
  - Ensures every project has at least one owner
  - Creator automatically has full access to their project
  - Enables proper sharing workflow
*/

-- Function to auto-add creator as owner in project_collaborators
CREATE OR REPLACE FUNCTION auto_add_project_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the creator as owner in project_collaborators
  INSERT INTO project_collaborators (project_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS add_project_owner_trigger ON projects;

-- Create trigger to run after INSERT
CREATE TRIGGER add_project_owner_trigger
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_project_owner();

COMMENT ON FUNCTION auto_add_project_owner() IS 'Automatically adds project creator as owner in project_collaborators';
