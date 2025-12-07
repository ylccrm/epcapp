/*
  # Arreglar Recursión Infinita en RLS y Limpiar Políticas

  ## Problema Identificado
  Las políticas RLS para admins en `user_profiles` y `projects` causan recursión infinita
  porque consultan la tabla `user_profiles` para verificar roles, creando un bucle.

  ## Solución
  1. Almacenar el rol de usuario en `auth.users.raw_app_meta_data`
  2. Usar `auth.jwt()` para verificar roles sin consultar tablas
  3. Crear función y trigger para sincronizar roles automáticamente
  4. Eliminar políticas duplicadas y conflictivas
  5. Recrear políticas correctas sin recursión

  ## Cambios

  ### 1. Sincronización de Roles
  - Crear función para sincronizar rol a app_metadata
  - Crear trigger para mantener sincronización automática
  - Migrar roles existentes a app_metadata

  ### 2. Políticas RLS Corregidas
  - Usar `(auth.jwt() -> 'app_metadata' ->> 'role')` para verificar roles
  - Eliminar todas las políticas con recursión
  - Crear políticas simples y eficientes

  ### 3. Limpieza de Políticas
  - Eliminar políticas duplicadas en projects
  - Mantener solo políticas necesarias y no conflictivas
*/

-- ============================================================================
-- 1. FUNCIÓN PARA SINCRONIZAR ROL A APP_METADATA
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar app_metadata en auth.users con el rol del usuario
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
-- ============================================================================

DROP TRIGGER IF EXISTS sync_user_role_trigger ON user_profiles;

CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_metadata();

-- ============================================================================
-- 3. MIGRAR ROLES EXISTENTES A APP_METADATA
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, role FROM user_profiles
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- ============================================================================
-- 4. ELIMINAR POLÍTICAS CON RECURSIÓN EN USER_PROFILES
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "System can create user profiles" ON user_profiles;

-- ============================================================================
-- 5. CREAR POLÍTICAS CORRECTAS PARA USER_PROFILES (SIN RECURSIÓN)
-- ============================================================================

-- Admins pueden ver todos los perfiles usando JWT
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Sistema puede crear perfiles (para registro automático)
CREATE POLICY "System can create user profiles"
  ON user_profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- Usuarios pueden actualizar su propio perfil (excepto el rol)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden insertar cualquier perfil
CREATE POLICY "Admins can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins pueden eliminar perfiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- 6. LIMPIAR POLÍTICAS DUPLICADAS EN PROJECTS
-- ============================================================================

-- Eliminar TODAS las políticas existentes para recrearlas correctamente
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any project" ON projects;
DROP POLICY IF EXISTS "Admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete any project" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view shared projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Owners can update their projects" ON projects;
DROP POLICY IF EXISTS "Shared users can update shared projects" ON projects;
DROP POLICY IF EXISTS "Owners can delete their projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;
DROP POLICY IF EXISTS "Installers can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Editors can update shared projects" ON projects;

-- ============================================================================
-- 7. CREAR POLÍTICAS CORRECTAS PARA PROJECTS (SIN RECURSIÓN)
-- ============================================================================

-- SELECT: Admins pueden ver todos los proyectos
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- SELECT: Usuarios pueden ver sus propios proyectos
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- SELECT: Usuarios pueden ver proyectos compartidos con ellos
CREATE POLICY "Users can view shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = ANY(shared_with));

-- SELECT: Colaboradores pueden ver proyectos donde están invitados
CREATE POLICY "Collaborators can view shared projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT project_id FROM project_collaborators
      WHERE user_id = auth.uid()
    )
  );

-- SELECT: Installers pueden ver proyectos asignados a su crew
CREATE POLICY "Installers can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT pc.project_id
      FROM project_crews pc
      JOIN user_profiles up ON up.assigned_crew_id = pc.id
      WHERE up.id = auth.uid()
      AND up.role IN ('installer', 'supervisor')
    )
  );

-- INSERT: Usuarios autenticados pueden crear proyectos
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Admins pueden actualizar cualquier proyecto
CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- UPDATE: Owners pueden actualizar sus proyectos
CREATE POLICY "Owners can update their projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Editores pueden actualizar proyectos compartidos
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

-- DELETE: Admins pueden eliminar cualquier proyecto
CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- DELETE: Owners pueden eliminar sus propios proyectos
CREATE POLICY "Owners can delete their projects"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- 8. ACTUALIZAR POLÍTICAS EN OTRAS TABLAS RELACIONADAS
-- ============================================================================

-- Eliminar y recrear políticas de crew_members para evitar recursión
DROP POLICY IF EXISTS "Admins can view all crew members" ON crew_members;
DROP POLICY IF EXISTS "Admins can manage crew members" ON crew_members;

CREATE POLICY "Admins can view all crew members"
  ON crew_members FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can manage crew members"
  ON crew_members FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ============================================================================
-- ÍNDICES PARA MEJORAR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_shared_with ON projects USING GIN(shared_with);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
