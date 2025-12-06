/*
  # Sistema de Inicialización Automática de Usuarios

  ## Resumen
  Este sistema garantiza que cada usuario nuevo se registre automáticamente con:
  - Rol por defecto: "regular" (usuario normal)
  - Todos los campos inicializados en valores seguros (0, vacío, false, null)
  - Sin permisos administrativos
  - Sin datos residuales

  ## Cambios

  ### 1. Actualizar tabla user_profiles
  - Agregar rol "regular" a los valores permitidos
  - Cambiar default del rol a "regular"
  - Agregar campos de inicialización y estadísticas
  - Todos los campos empiezan en 0 o vacío

  ### 2. Crear función de inicialización automática
  - Se ejecuta automáticamente al crear un usuario en auth.users
  - Crea perfil con valores por defecto seguros
  - No permite manipulación del rol durante registro

  ### 3. Trigger automático
  - Detecta nuevo usuario en auth.users
  - Ejecuta función de inicialización
  - Garantiza consistencia de datos

  ## Seguridad
  - El rol "regular" es asignado automáticamente desde backend
  - No es posible autoasignarse otros roles durante registro
  - Validación en base de datos previene manipulación frontend

  ## Campos Inicializados
  Campos básicos:
  - email: del auth.users
  - full_name: del auth metadata o "Usuario Nuevo"
  - role: "regular"
  - is_active: true
  - is_verified: false
  - profile_completed: false
  
  Estadísticas (todas en 0):
  - projects_owned_count: 0
  - projects_shared_count: 0
  - projects_created_count: 0
  - projects_completed_count: 0
  - notifications_unread_count: 0
  - total_logins: 0
  
  Timestamps:
  - created_at: fecha actual
  - updated_at: fecha actual
  - last_login: null
*/

-- 1. Actualizar el CHECK constraint para incluir 'regular'
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('admin', 'regular', 'installer', 'supervisor'));

-- 2. Cambiar el default del rol a 'regular'
ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'regular';

-- 3. Agregar campos de inicialización si no existen

DO $$
BEGIN
  -- Campo is_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_verified boolean DEFAULT false;
  END IF;

  -- Campo profile_completed
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;

  -- Campo projects_owned_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'projects_owned_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN projects_owned_count integer DEFAULT 0;
  END IF;

  -- Campo projects_shared_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'projects_shared_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN projects_shared_count integer DEFAULT 0;
  END IF;

  -- Campo projects_created_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'projects_created_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN projects_created_count integer DEFAULT 0;
  END IF;

  -- Campo projects_completed_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'projects_completed_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN projects_completed_count integer DEFAULT 0;
  END IF;

  -- Campo notifications_unread_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'notifications_unread_count'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN notifications_unread_count integer DEFAULT 0;
  END IF;

  -- Campo total_logins
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'total_logins'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN total_logins integer DEFAULT 0;
  END IF;

  -- Campo last_login
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN last_login timestamptz;
  END IF;
END $$;

-- 4. Crear función de inicialización automática de perfil
CREATE OR REPLACE FUNCTION initialize_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_full_name text;
BEGIN
  -- Obtener email del nuevo usuario
  v_email := NEW.email;

  -- Obtener nombre completo del metadata o usar valor por defecto
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Usuario Nuevo'
  );

  -- Crear perfil de usuario con valores inicializados
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    phone,
    assigned_crew_id,
    is_active,
    is_verified,
    profile_completed,
    projects_owned_count,
    projects_shared_count,
    projects_created_count,
    projects_completed_count,
    notifications_unread_count,
    total_logins,
    last_login,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_email,
    v_full_name,
    'regular', -- ROL POR DEFECTO: USUARIO NORMAL
    null, -- phone vacío
    null, -- sin crew asignado
    true, -- activo por defecto
    false, -- no verificado
    false, -- perfil no completado
    0, -- 0 proyectos propios
    0, -- 0 proyectos compartidos
    0, -- 0 proyectos creados
    0, -- 0 proyectos completados
    0, -- 0 notificaciones sin leer
    0, -- 0 logins
    null, -- último login null
    now(), -- fecha de creación
    now() -- fecha de actualización
  )
  ON CONFLICT (id) DO NOTHING; -- Si ya existe, no hacer nada

  RETURN NEW;
END;
$$;

-- 5. Crear trigger para ejecutar automáticamente la función
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user_profile();

-- 6. Agregar política RLS para permitir la inserción automática
-- Esta política permite que el sistema cree perfiles automáticamente
DROP POLICY IF EXISTS "System can create user profiles" ON user_profiles;

CREATE POLICY "System can create user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (true);

-- 7. Función auxiliar para validar y corregir roles incorrectos
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si el rol no es válido o alguien intenta asignarse admin/installer/supervisor
  -- durante la creación, forzar a 'regular'
  IF NEW.role NOT IN ('admin', 'regular', 'installer', 'supervisor') THEN
    NEW.role := 'regular';
  END IF;

  -- Si es una inserción nueva (no admin existente) y alguien intenta
  -- asignarse un rol privilegiado, forzar a 'regular'
  IF TG_OP = 'INSERT' THEN
    -- Solo permitir roles privilegiados si ya existe un admin que lo está creando
    IF NEW.role IN ('admin', 'installer', 'supervisor') THEN
      -- Verificar si el usuario actual es admin
      IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      ) THEN
        -- Si no es admin, forzar a regular
        NEW.role := 'regular';
      END IF;
    END IF;
  END IF;

  -- En actualizaciones, prevenir que usuarios regulares se autoasignen roles privilegiados
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'regular' AND NEW.role != 'regular' THEN
      -- Solo permitir si es un admin quien hace el cambio
      IF NOT EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'admin'
      ) THEN
        -- Si no es admin, mantener el rol anterior
        NEW.role := OLD.role;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 8. Crear trigger de validación de roles
DROP TRIGGER IF EXISTS validate_user_role_trigger ON user_profiles;

CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role();

-- 9. Actualizar perfiles existentes sin rol válido a 'regular'
UPDATE user_profiles
SET role = 'regular'
WHERE role NOT IN ('admin', 'regular', 'installer', 'supervisor')
   OR role IS NULL;

-- 10. Actualizar perfiles existentes para inicializar campos faltantes
UPDATE user_profiles
SET 
  is_verified = COALESCE(is_verified, false),
  profile_completed = COALESCE(profile_completed, false),
  projects_owned_count = COALESCE(projects_owned_count, 0),
  projects_shared_count = COALESCE(projects_shared_count, 0),
  projects_created_count = COALESCE(projects_created_count, 0),
  projects_completed_count = COALESCE(projects_completed_count, 0),
  notifications_unread_count = COALESCE(notifications_unread_count, 0),
  total_logins = COALESCE(total_logins, 0)
WHERE 
  is_verified IS NULL OR
  profile_completed IS NULL OR
  projects_owned_count IS NULL OR
  projects_shared_count IS NULL OR
  projects_created_count IS NULL OR
  projects_completed_count IS NULL OR
  notifications_unread_count IS NULL OR
  total_logins IS NULL;

-- 11. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_verified ON user_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON user_profiles(last_login);

-- 12. Comentarios en la tabla para documentación
COMMENT ON COLUMN user_profiles.role IS 'Rol del usuario: admin (super administrador), regular (usuario normal), installer (instalador), supervisor';
COMMENT ON COLUMN user_profiles.is_active IS 'Indica si la cuenta está activa';
COMMENT ON COLUMN user_profiles.is_verified IS 'Indica si el email ha sido verificado';
COMMENT ON COLUMN user_profiles.profile_completed IS 'Indica si el usuario completó su perfil';
COMMENT ON COLUMN user_profiles.projects_owned_count IS 'Contador de proyectos creados por el usuario';
COMMENT ON COLUMN user_profiles.projects_shared_count IS 'Contador de proyectos compartidos con el usuario';
COMMENT ON COLUMN user_profiles.total_logins IS 'Contador total de inicios de sesión';
COMMENT ON COLUMN user_profiles.last_login IS 'Fecha y hora del último inicio de sesión';