/*
  # Sistema de Invitaciones de Proyectos

  1. Nueva Tabla: shared_project_requests
    - `id` (uuid, primary key)
    - `project_id` (uuid, referencia a projects)
    - `owner_id` (uuid, referencia a auth.users)
    - `email_invited` (text, email del usuario invitado)
    - `invited_user_id` (uuid, referencia a auth.users si existe)
    - `status` (text, valores: 'pending', 'accepted', 'rejected', 'cancelled')
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Security
    - Enable RLS en shared_project_requests
    - Políticas para owners, invited users, y admins

  3. Funciones SQL
    - create_project_invitation: Crear invitación por email
    - accept_project_invitation: Aceptar invitación
    - reject_project_invitation: Rechazar invitación
    - cancel_project_invitation: Cancelar invitación (solo owner)
*/

-- Crear tabla shared_project_requests
CREATE TABLE IF NOT EXISTS shared_project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email_invited text NOT NULL,
  invited_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_shared_requests_project ON shared_project_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_shared_requests_owner ON shared_project_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_requests_email ON shared_project_requests(email_invited);
CREATE INDEX IF NOT EXISTS idx_shared_requests_invited_user ON shared_project_requests(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_requests_status ON shared_project_requests(status);

-- Enable RLS
ALTER TABLE shared_project_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins pueden ver todas las invitaciones
CREATE POLICY "Admins can view all invitations"
  ON shared_project_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Owners pueden ver sus invitaciones enviadas
CREATE POLICY "Owners can view sent invitations"
  ON shared_project_requests FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Invited users pueden ver sus invitaciones recibidas
CREATE POLICY "Users can view received invitations"
  ON shared_project_requests FOR SELECT
  TO authenticated
  USING (invited_user_id = auth.uid());

-- Owners pueden crear invitaciones
CREATE POLICY "Owners can create invitations"
  ON shared_project_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.created_by = auth.uid()
    )
  );

-- Invited users pueden actualizar sus invitaciones
CREATE POLICY "Users can update received invitations"
  ON shared_project_requests FOR UPDATE
  TO authenticated
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Owners pueden actualizar sus invitaciones
CREATE POLICY "Owners can update sent invitations"
  ON shared_project_requests FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Admins pueden actualizar cualquier invitación
CREATE POLICY "Admins can update invitations"
  ON shared_project_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Función para crear invitación
CREATE OR REPLACE FUNCTION create_project_invitation(
  p_project_id uuid,
  p_email_invited text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id uuid;
  v_owner_email text;
  v_invited_user_id uuid;
  v_invitation_id uuid;
  v_project_name text;
  v_existing_status text;
BEGIN
  v_owner_id := auth.uid();

  IF v_owner_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Obtener email del owner
  SELECT email INTO v_owner_email
  FROM user_profiles
  WHERE id = v_owner_id;

  -- Verificar que el owner es dueño del proyecto
  IF NOT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id AND created_by = v_owner_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'No tienes permisos para compartir este proyecto');
  END IF;

  -- Obtener nombre del proyecto (usando client como nombre)
  SELECT client INTO v_project_name
  FROM projects
  WHERE id = p_project_id;

  -- Verificar que no intenta compartir consigo mismo
  IF v_owner_email = p_email_invited THEN
    RETURN json_build_object('success', false, 'error', 'No puedes compartir el proyecto contigo mismo');
  END IF;

  -- Buscar si el usuario invitado existe
  SELECT user_profiles.id INTO v_invited_user_id
  FROM user_profiles
  WHERE email = p_email_invited;

  IF v_invited_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'El usuario con ese correo no existe');
  END IF;

  -- Verificar si ya existe una invitación activa
  SELECT status INTO v_existing_status
  FROM shared_project_requests
  WHERE project_id = p_project_id
    AND email_invited = p_email_invited
    AND status IN ('pending', 'accepted');

  IF v_existing_status = 'accepted' THEN
    RETURN json_build_object('success', false, 'error', 'Este usuario ya tiene acceso al proyecto');
  END IF;

  IF v_existing_status = 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Ya existe una invitación pendiente para este usuario');
  END IF;

  -- Crear la invitación
  INSERT INTO shared_project_requests (
    project_id,
    owner_id,
    email_invited,
    invited_user_id,
    status
  ) VALUES (
    p_project_id,
    v_owner_id,
    p_email_invited,
    v_invited_user_id,
    'pending'
  ) RETURNING id INTO v_invitation_id;

  -- Crear notificación para el usuario invitado
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_project_id,
    metadata
  ) VALUES (
    v_invited_user_id,
    'invitation',
    'Nueva invitación de proyecto',
    'Te han invitado a colaborar en el proyecto: ' || v_project_name,
    p_project_id,
    json_build_object(
      'owner_email', v_owner_email,
      'invitation_id', v_invitation_id
    )::jsonb
  );

  -- Crear audit log
  PERFORM create_audit_log(
    p_user_id := v_owner_id,
    p_user_email := v_owner_email,
    p_action_type := 'create',
    p_entity_type := 'project_invitation',
    p_entity_id := v_invitation_id,
    p_description := 'Invitó a ' || p_email_invited || ' al proyecto "' || v_project_name || '"',
    p_metadata := json_build_object('email_invited', p_email_invited)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'message', 'Invitación enviada exitosamente'
  );
END;
$$;

-- Función para aceptar invitación
CREATE OR REPLACE FUNCTION accept_project_invitation(
  p_invitation_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_project_id uuid;
  v_owner_id uuid;
  v_project_name text;
  v_invitation_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM user_profiles
  WHERE id = v_user_id;

  -- Obtener información de la invitación
  SELECT project_id, owner_id, status
  INTO v_project_id, v_owner_id, v_invitation_status
  FROM shared_project_requests
  WHERE id = p_invitation_id AND invited_user_id = v_user_id;

  IF v_project_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitación no encontrada');
  END IF;

  IF v_invitation_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Esta invitación ya fue procesada');
  END IF;

  -- Obtener nombre del proyecto
  SELECT client INTO v_project_name FROM projects WHERE id = v_project_id;

  -- Actualizar estado de la invitación
  UPDATE shared_project_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = p_invitation_id;

  -- Agregar usuario al array shared_with del proyecto
  UPDATE projects
  SET shared_with = array_append(shared_with, v_user_id)
  WHERE id = v_project_id
  AND NOT (v_user_id = ANY(shared_with));

  -- Crear notificación para el owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_project_id,
    metadata
  ) VALUES (
    v_owner_id,
    'invitation_accepted',
    'Invitación aceptada',
    v_user_email || ' ha aceptado tu invitación al proyecto: ' || v_project_name,
    v_project_id,
    json_build_object('accepted_by', v_user_email)::jsonb
  );

  -- Crear audit log
  PERFORM create_audit_log(
    p_user_id := v_user_id,
    p_user_email := v_user_email,
    p_action_type := 'update',
    p_entity_type := 'project_invitation',
    p_entity_id := p_invitation_id,
    p_description := 'Aceptó la invitación al proyecto "' || v_project_name || '"',
    p_metadata := json_build_object('project_id', v_project_id)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Has aceptado la invitación exitosamente'
  );
END;
$$;

-- Función para rechazar invitación
CREATE OR REPLACE FUNCTION reject_project_invitation(
  p_invitation_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_project_id uuid;
  v_owner_id uuid;
  v_project_name text;
  v_invitation_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM user_profiles
  WHERE id = v_user_id;

  -- Obtener información de la invitación
  SELECT project_id, owner_id, status
  INTO v_project_id, v_owner_id, v_invitation_status
  FROM shared_project_requests
  WHERE id = p_invitation_id AND invited_user_id = v_user_id;

  IF v_project_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitación no encontrada');
  END IF;

  IF v_invitation_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Esta invitación ya fue procesada');
  END IF;

  -- Obtener nombre del proyecto
  SELECT client INTO v_project_name FROM projects WHERE id = v_project_id;

  -- Actualizar estado
  UPDATE shared_project_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = p_invitation_id;

  -- Notificar al owner
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_project_id,
    metadata
  ) VALUES (
    v_owner_id,
    'invitation_rejected',
    'Invitación rechazada',
    v_user_email || ' ha rechazado tu invitación al proyecto: ' || v_project_name,
    v_project_id,
    json_build_object('rejected_by', v_user_email)::jsonb
  );

  -- Audit log
  PERFORM create_audit_log(
    p_user_id := v_user_id,
    p_user_email := v_user_email,
    p_action_type := 'update',
    p_entity_type := 'project_invitation',
    p_entity_id := p_invitation_id,
    p_description := 'Rechazó la invitación al proyecto "' || v_project_name || '"',
    p_metadata := json_build_object('project_id', v_project_id)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Has rechazado la invitación'
  );
END;
$$;

-- Función para cancelar invitación
CREATE OR REPLACE FUNCTION cancel_project_invitation(
  p_invitation_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_project_id uuid;
  v_email_invited text;
  v_project_name text;
  v_invitation_status text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  -- Obtener email
  SELECT email INTO v_user_email
  FROM user_profiles
  WHERE id = v_user_id;

  -- Obtener invitación
  SELECT project_id, email_invited, status
  INTO v_project_id, v_email_invited, v_invitation_status
  FROM shared_project_requests
  WHERE id = p_invitation_id AND owner_id = v_user_id;

  IF v_project_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invitación no encontrada o no tienes permisos');
  END IF;

  IF v_invitation_status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Solo se pueden cancelar invitaciones pendientes');
  END IF;

  -- Obtener nombre del proyecto
  SELECT client INTO v_project_name FROM projects WHERE id = v_project_id;

  -- Cancelar
  UPDATE shared_project_requests
  SET status = 'cancelled', updated_at = now()
  WHERE id = p_invitation_id;

  -- Audit log
  PERFORM create_audit_log(
    p_user_id := v_user_id,
    p_user_email := v_user_email,
    p_action_type := 'update',
    p_entity_type := 'project_invitation',
    p_entity_id := p_invitation_id,
    p_description := 'Canceló la invitación a ' || v_email_invited || ' del proyecto "' || v_project_name || '"',
    p_metadata := json_build_object('email_invited', v_email_invited)::jsonb
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Invitación cancelada exitosamente'
  );
END;
$$;