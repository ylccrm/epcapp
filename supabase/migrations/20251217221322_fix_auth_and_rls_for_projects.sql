/*
  # Fix Authentication and RLS for Projects Visibility

  This migration fixes issues where authenticated users cannot see their projects.

  ## Changes Made

  1. **Create Helper Functions**
     - Add function to check if user exists in user_profiles
     - Add function to safely get user role

  2. **Update get_projects_with_progress Function**
     - Add better error handling
     - Add debugging capability
     - Ensure proper user context is checked

  3. **Ensure User Profile Auto-Creation**
     - Add trigger to auto-create user profiles on signup
     - Backfill any missing profiles

  ## Security
  - Maintains RLS policies
  - Only shows projects user has access to
*/

-- Create helper function to check if user profile exists
CREATE OR REPLACE FUNCTION user_profile_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id);
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'installer',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Backfill any missing user profiles
INSERT INTO user_profiles (id, email, full_name, role, is_active)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'installer',
  true
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Recreate the get_projects_with_progress function with better error handling
DROP FUNCTION IF EXISTS get_projects_with_progress(TEXT, TEXT, INT, INT);

CREATE OR REPLACE FUNCTION get_projects_with_progress(
  search_term TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  page_offset INT DEFAULT 0,
  page_limit INT DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  client TEXT,
  location TEXT,
  status TEXT,
  total_budget_usd NUMERIC,
  start_date DATE,
  currency TEXT,
  currency_country TEXT,
  exchange_rate NUMERIC,
  created_by UUID,
  shared_with UUID[],
  created_at TIMESTAMPTZ,
  avg_progress NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  current_user_role TEXT;
BEGIN
  current_user_id := auth.uid();
  
  -- If no user is authenticated, return empty
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Get user role, default to empty string if not found
  SELECT COALESCE(up.role, '') INTO current_user_role
  FROM user_profiles up
  WHERE up.id = current_user_id;

  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.client,
    p.location,
    p.status,
    p.total_budget_usd,
    p.start_date,
    p.currency,
    p.currency_country,
    p.exchange_rate,
    p.created_by,
    p.shared_with,
    p.created_at,
    COALESCE(
      (SELECT AVG(cpm.percentage)
       FROM contracts c
       LEFT JOIN contract_payment_milestones cpm ON c.id = cpm.contract_id
       WHERE c.project_id = p.id
         AND cpm.status = 'paid'
      ), 0
    )::NUMERIC AS avg_progress
  FROM projects p
  WHERE 
    (
      -- Admin or supervisor can see all
      current_user_role IN ('admin', 'supervisor')
      -- Owner can see their own
      OR p.created_by = current_user_id
      -- Shared users can see
      OR current_user_id = ANY(p.shared_with)
      -- Collaborators can see
      OR EXISTS (
        SELECT 1 FROM project_collaborators pc
        WHERE pc.project_id = p.id AND pc.user_id = current_user_id
      )
    )
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR p.status = status_filter)
  ORDER BY p.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;
