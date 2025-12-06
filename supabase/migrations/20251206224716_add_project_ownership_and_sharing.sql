/*
  # Agregar Sistema de Propiedad y Compartir Proyectos

  1. Modificaciones a tabla projects
    - Agregar campo `created_by` (uuid, referencia a auth.users)
    - Agregar campo `shared_with` (uuid[], array de user_ids con acceso)

  2. Actualizar políticas RLS de projects
    - Solo owners y shared users pueden ver proyectos
    - Solo owners pueden actualizar/eliminar
    - Admins tienen acceso total

  3. Migración de datos existentes
    - Asignar proyectos existentes al primer admin disponible
*/

-- Agregar campo created_by a projects si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Agregar campo shared_with a projects si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE projects ADD COLUMN shared_with uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_shared_with ON projects USING GIN(shared_with);

-- Migrar datos existentes: asignar proyectos al primer admin o al primer usuario disponible
DO $$
DECLARE
  v_first_user_id uuid;
BEGIN
  -- Intentar obtener el primer admin
  SELECT id INTO v_first_user_id
  FROM user_profiles
  WHERE role = 'admin'
  LIMIT 1;

  -- Si no hay admin, obtener el primer usuario
  IF v_first_user_id IS NULL THEN
    SELECT id INTO v_first_user_id
    FROM auth.users
    LIMIT 1;
  END IF;

  -- Actualizar proyectos sin dueño
  IF v_first_user_id IS NOT NULL THEN
    UPDATE projects
    SET created_by = v_first_user_id
    WHERE created_by IS NULL;
  END IF;
END $$;

-- Drop políticas antiguas inseguras
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

-- Nuevas políticas RLS seguras

-- Admins pueden ver todos los proyectos
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Users pueden ver sus propios proyectos
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Users pueden ver proyectos compartidos con ellos
CREATE POLICY "Users can view shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(shared_with));

-- Users pueden crear proyectos
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Owners pueden actualizar sus proyectos
CREATE POLICY "Owners can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Shared users pueden actualizar proyectos compartidos
CREATE POLICY "Shared users can update shared projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = ANY(shared_with))
  WITH CHECK (auth.uid() = ANY(shared_with));

-- Admins pueden actualizar cualquier proyecto
CREATE POLICY "Admins can update any project"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Solo owners pueden eliminar sus proyectos
CREATE POLICY "Owners can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Admins pueden eliminar cualquier proyecto
CREATE POLICY "Admins can delete any project"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );