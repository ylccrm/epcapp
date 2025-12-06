/*
  # Actualizar Sistema de Inicialización para Sincronizar con app_metadata
  
  ## Problema
  El trigger de inicialización automática de usuarios y el trigger de validación
  de roles tienen recursión infinita al consultar user_profiles para verificar
  si el usuario actual es admin.
  
  ## Solución
  1. Actualizar initialize_new_user_profile() para que también sincronice el rol
     a app_metadata cuando se crea un nuevo usuario
  2. Actualizar validate_user_role() para usar auth.jwt() en lugar de consultar
     user_profiles directamente
  3. Eliminar la recursión infinita en la validación de roles
  
  ## Cambios
  - Modificar función initialize_new_user_profile() para sincronizar rol
  - Modificar función validate_user_role() para usar JWT
  - Mantener la seguridad sin recursión
*/

-- ============================================================================
-- 1. ACTUALIZAR FUNCIÓN DE INICIALIZACIÓN PARA SINCRONIZAR ROL
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_role text;
BEGIN
  -- Obtener email del nuevo usuario
  v_email := NEW.email;

  -- Obtener nombre completo del metadata o usar valor por defecto
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Usuario Nuevo'
  );

  -- Determinar rol: usar el del metadata si existe, si no usar 'regular'
  v_role := COALESCE(
    NEW.raw_app_meta_data->>'role',
    'regular'
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
    v_role, -- usar rol determinado
    null,
    null,
    true,
    false,
    false,
    0,
    0,
    0,
    0,
    0,
    0,
    null,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Sincronizar rol a app_metadata si no existe
  IF NEW.raw_app_meta_data IS NULL OR NEW.raw_app_meta_data->>'role' IS NULL THEN
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', v_role)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. ACTUALIZAR FUNCIÓN DE VALIDACIÓN PARA USAR JWT (SIN RECURSIÓN)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_role text;
BEGIN
  -- Obtener el rol del usuario actual desde JWT (sin recursión)
  v_current_user_role := current_setting('request.jwt.claims', true)::json->>'app_metadata'->>'role';
  
  -- Si no se puede obtener del JWT, asumir que no es admin
  IF v_current_user_role IS NULL THEN
    v_current_user_role := 'regular';
  END IF;

  -- Si el rol no es válido, forzar a 'regular'
  IF NEW.role NOT IN ('admin', 'regular', 'installer', 'supervisor') THEN
    NEW.role := 'regular';
  END IF;

  -- En inserciones, solo permitir roles privilegiados si es admin
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IN ('admin', 'installer', 'supervisor') THEN
      -- Solo permitir si el usuario actual es admin
      IF v_current_user_role != 'admin' THEN
        NEW.role := 'regular';
      END IF;
    END IF;
  END IF;

  -- En actualizaciones, prevenir que usuarios regulares se autoasignen roles privilegiados
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'regular' AND NEW.role != 'regular' THEN
      -- Solo permitir si es un admin quien hace el cambio
      IF v_current_user_role != 'admin' THEN
        NEW.role := OLD.role;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. RECREAR TRIGGERS
-- ============================================================================

-- Recrear trigger de inicialización
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user_profile();

-- Recrear trigger de validación
DROP TRIGGER IF EXISTS validate_user_role_trigger ON user_profiles;
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role();

-- ============================================================================
-- 4. ASEGURAR QUE TRIGGER DE SINCRONIZACIÓN ESTÁ ACTIVO
-- ============================================================================

-- Recrear trigger de sincronización de roles
DROP TRIGGER IF EXISTS sync_user_role_trigger ON user_profiles;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_metadata();
