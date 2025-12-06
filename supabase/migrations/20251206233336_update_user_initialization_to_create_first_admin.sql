/*
  # Update User Initialization to Create First Admin

  ## Problem
  The current user initialization function always assigns 'regular' role to new users.
  This means there's no way to create an admin user through normal signup.

  ## Solution
  Update the initialization function to:
  1. Check if this is the first user
  2. If yes, make them admin
  3. If no, make them regular user
  4. Properly sync role to JWT (app_metadata)

  ## Security Notes
  - Only the very first user becomes admin automatically
  - All subsequent users get 'regular' role (least privilege)
  - Role is properly synced to JWT for RLS policies to work
*/

-- ============================================================================
-- Update user initialization function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initialize_new_user_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_role text;
  v_user_count integer;
BEGIN
  -- Obtener email del nuevo usuario
  v_email := NEW.email;

  -- Obtener nombre completo del metadata o usar valor por defecto
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Contar usuarios EXISTENTES (no incluir el nuevo aún)
  SELECT COUNT(*) INTO v_user_count
  FROM auth.users
  WHERE id != NEW.id;

  -- Determinar rol: primer usuario es admin, resto son regular
  IF v_user_count = 0 THEN
    v_role := 'admin';
  ELSE
    -- Usar rol del metadata si existe, si no usar 'regular'
    v_role := COALESCE(
      NEW.raw_app_meta_data->>'role',
      'regular'
    );
  END IF;

  -- Crear perfil de usuario con valores inicializados
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    phone,
    assigned_crew_id,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_email,
    v_full_name,
    v_role,
    null,
    null,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- IMPORTANTE: Sincronizar rol a app_metadata para que JWT tenga el rol
  -- Esto es crítico para que las políticas RLS funcionen correctamente
  UPDATE auth.users
  SET raw_app_meta_data = 
    COALESCE(raw_app_meta_data, '{}'::jsonb) || 
    jsonb_build_object('role', v_role)
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error pero no fallar la creación del usuario
    RAISE WARNING 'Error creating user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- Ensure trigger is properly set up
-- ============================================================================

-- Drop and recreate trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_new_user_profile();

-- ============================================================================
-- Update existing users' JWT if needed
-- ============================================================================

-- Sync role to JWT for any existing users that don't have it
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, up.role
    FROM auth.users u
    INNER JOIN user_profiles up ON up.id = u.id
    WHERE u.raw_app_meta_data IS NULL 
       OR u.raw_app_meta_data->>'role' IS NULL
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', user_record.role)
    WHERE id = user_record.id;
  END LOOP;
END $$;
