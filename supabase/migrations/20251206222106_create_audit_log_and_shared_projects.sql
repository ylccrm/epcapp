/*
  # Create Audit Log and Shared Projects System

  ## Overview
  This migration creates systems for:
  1. Audit logging - Track all user actions
  2. Shared projects - Multiple users can collaborate on projects
  3. Enhanced notifications - Track installer updates
  
  ## Changes
  
  ### 1. New Tables
  
  #### `audit_logs`
  Tracks all user actions in the system:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, FK to user_profiles) - User who performed the action
  - `user_email` (text) - Email for quick reference
  - `action_type` (text) - Type of action: 'create', 'update', 'delete', 'view'
  - `entity_type` (text) - What was affected: 'project', 'milestone', 'contract', etc.
  - `entity_id` (uuid, nullable) - ID of the affected entity
  - `description` (text) - Human-readable description of the action
  - `metadata` (jsonb, nullable) - Additional context (old/new values, etc.)
  - `ip_address` (text, nullable) - IP address of user
  - `created_at` (timestamptz) - When the action occurred
  
  #### `project_collaborators`
  Allows multiple users to access the same project:
  - `id` (uuid, primary key) - Unique identifier
  - `project_id` (uuid, FK to projects) - The shared project
  - `user_id` (uuid, FK to user_profiles) - The collaborator
  - `role` (text) - Access level: 'owner', 'editor', 'viewer'
  - `added_by` (uuid, FK to user_profiles) - Who added this collaborator
  - `created_at` (timestamptz) - When they were added
  
  #### `system_settings`
  Stores global and user-specific settings:
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, nullable, FK to user_profiles) - Null for global settings
  - `setting_key` (text) - Setting name (e.g., 'language', 'theme')
  - `setting_value` (text) - Setting value
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. Security
  
  All tables have RLS enabled:
  - Audit logs: Only admins can view, system automatically creates entries
  - Project collaborators: Users can view their own collaborations, admins manage
  - System settings: Users can view/edit their own settings, admins manage global
  
  ### 3. Updates to Existing Tables
  
  - Enhanced notifications table to include audit trail references
  - Updated RLS policies to support shared project access
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  user_email text NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'view', 'upload', 'download')),
  entity_type text NOT NULL,
  entity_id uuid,
  description text NOT NULL,
  metadata jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  added_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, setting_key)
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for project_collaborators

CREATE POLICY "Users can view their collaborations"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all collaborations"
  ON project_collaborators FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Project owners can manage collaborators"
  ON project_collaborators FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );

CREATE POLICY "Admins can manage all collaborators"
  ON project_collaborators FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for system_settings

CREATE POLICY "Users can view own settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage own settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Add policies for shared project access

CREATE POLICY "Collaborators can view shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can update shared projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  )
  WITH CHECK (
    id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'editor')
    )
  );

-- Update notifications to reference audit logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'audit_log_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN audit_log_id uuid REFERENCES audit_logs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_user ON system_settings(user_id);

-- Create updated_at trigger for system_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Function to automatically create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id uuid,
  p_user_email text,
  p_action_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_description text,
  p_metadata jsonb DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (
    user_id,
    user_email,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  ) VALUES (
    p_user_id,
    p_user_email,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;