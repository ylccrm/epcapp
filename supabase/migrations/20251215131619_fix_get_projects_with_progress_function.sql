/*
  # Fix get_projects_with_progress Function

  This migration fixes the RPC function to use correct column names that exist in the projects table.

  ## Changes Made

  1. **Drop Old Function**
     - Remove the broken function that references non-existent columns

  2. **Create New Function**
     - Returns only columns that exist in projects table
     - Uses `created_by` instead of `owner_id`
     - Removes references to: capacity_kwp, contract_value_usd, estimated_start_date, estimated_end_date, actual_start_date, actual_end_date
     - Adds new columns: currency, currency_country, exchange_rate, shared_with

  3. **Security**
     - Uses SECURITY DEFINER but respects RLS by filtering based on user permissions
     - Admins/Supervisors see all projects
     - Regular users see only their own projects or projects shared with them

  ## Fixed Issues
  - Column name mismatch (owner_id -> created_by)
  - References to non-existent columns removed
  - Proper RLS filtering added
*/

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
  shared_with TEXT[],
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
  
  SELECT role INTO current_user_role
  FROM user_profiles
  WHERE id = current_user_id;

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
    COALESCE(AVG(cpm.progress_percentage), 0)::NUMERIC AS avg_progress
  FROM projects p
  LEFT JOIN contract_payment_milestones cpm ON p.id = cpm.project_id
  WHERE 
    (current_user_role IN ('admin', 'supervisor') 
     OR p.created_by = current_user_id
     OR current_user_id = ANY(p.shared_with)
     OR EXISTS (
       SELECT 1 FROM project_collaborators pc
       WHERE pc.project_id = p.id AND pc.user_id = current_user_id
     )
    )
    AND (search_term IS NULL OR p.name ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR p.status = status_filter)
  GROUP BY p.id
  ORDER BY p.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;