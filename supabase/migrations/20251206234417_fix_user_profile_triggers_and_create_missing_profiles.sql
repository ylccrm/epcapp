/*
  # Fix User Profile Triggers and Create Missing Profiles

  ## Problem
  The validate_user_role() trigger function has a bug that prevents user profiles from being created.
  Multiple users exist in auth.users but have no profiles.

  ## Solution
  1. Drop problematic trigger temporarily
  2. Create missing user profiles
  3. Fix the trigger function
  4. Re-enable trigger
  5. Implement data isolation

  ## Security
  - Maintains all security policies
  - Ensures data isolation per user
  - Admins can see everything
*/

-- ============================================================================
-- STEP 1: Drop problematic trigger temporarily
-- ============================================================================

DROP TRIGGER IF EXISTS validate_user_role_trigger ON user_profiles;

-- ============================================================================
-- STEP 2: Create missing user profiles
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  v_role text;
  v_full_name text;
  existing_admin_count integer;
BEGIN
  -- Count existing admins
  SELECT COUNT(*) INTO existing_admin_count
  FROM user_profiles
  WHERE role = 'admin';

  -- Create profiles for users without one
  FOR user_record IN 
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN user_profiles up ON up.id = au.id
    WHERE up.id IS NULL
    ORDER BY au.created_at ASC
  LOOP
    -- First user without profile becomes admin if no admins exist
    IF existing_admin_count = 0 THEN
      v_role := 'admin';
      existing_admin_count := 1;
    ELSE
      v_role := 'regular';
    END IF;

    v_full_name := split_part(user_record.email, '@', 1);

    -- Insert profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      user_record.id,
      user_record.email,
      v_full_name,
      v_role,
      true,
      user_record.created_at,
      now()
    );

    -- Sync to JWT
    UPDATE auth.users
    SET raw_app_meta_data = 
      COALESCE(raw_app_meta_data, '{}'::jsonb) || 
      jsonb_build_object('role', v_role)
    WHERE id = user_record.id;

  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: Fix and recreate validate_user_role function
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
DECLARE
  v_current_user_role text;
BEGIN
  -- Get current user's role from user_profiles table
  SELECT role INTO v_current_user_role
  FROM user_profiles
  WHERE id = auth.uid();

  -- If current user is admin, allow any role assignment
  IF v_current_user_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- If not admin and trying to set role to admin, block it
  IF NEW.role = 'admin' AND v_current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can create admin users';
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- During user creation, if we can't check (no current user), allow it
    -- This handles the initial user creation case
    IF auth.uid() IS NULL THEN
      RETURN NEW;
    END IF;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER validate_user_role_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_role();

-- ============================================================================
-- STEP 4: Add created_by to inventory_items for data isolation
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- Assign existing items to first admin
    UPDATE inventory_items 
    SET created_by = (
      SELECT id FROM user_profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1
    )
    WHERE created_by IS NULL;
    
    CREATE INDEX IF NOT EXISTS idx_inventory_items_created_by ON inventory_items(created_by);
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Update inventory RLS policies for data isolation
-- ============================================================================

DROP POLICY IF EXISTS "Users can view inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete inventory" ON inventory_items;
DROP POLICY IF EXISTS "Admins can view all inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Admins can manage all inventory" ON inventory_items;

-- New isolated policies
CREATE POLICY "Users view own inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users insert own inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users update own inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (created_by = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Users delete own inventory"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ============================================================================
-- STEP 6: Add trigger to auto-set created_by on inventory
-- ============================================================================

CREATE OR REPLACE FUNCTION set_inventory_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_inventory_created_by_trigger ON inventory_items;
CREATE TRIGGER set_inventory_created_by_trigger
  BEFORE INSERT ON inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION set_inventory_created_by();

-- ============================================================================
-- STEP 7: Add trigger to auto-set created_by on projects
-- ============================================================================

CREATE OR REPLACE FUNCTION set_project_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_project_created_by_trigger ON projects;
CREATE TRIGGER set_project_created_by_trigger
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_created_by();
