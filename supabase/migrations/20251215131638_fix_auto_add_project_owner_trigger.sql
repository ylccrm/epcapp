/*
  # Fix Auto Add Project Owner Trigger

  This migration fixes the trigger that automatically adds the project owner to collaborators.

  ## Changes Made

  1. **Update Trigger Function**
     - Add NULL check for created_by before inserting
     - Only add to collaborators if created_by is not NULL
     - Prevents NOT NULL constraint violations

  ## Fixed Issues
  - Trigger fails when created_by is NULL
  - Prevents orphaned projects
*/

CREATE OR REPLACE FUNCTION auto_add_project_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO project_collaborators (project_id, user_id, role, added_by)
    VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;