/*
  # Fix Ambiguous Column Reference in RPC Function

  This migration fixes the ambiguous column reference error in get_projects_with_progress function.

  ## Changes Made

  1. **Fix SQL Query**
     - Add table alias to disambiguate column reference
     - Change `WHERE id = current_user_id` to `WHERE user_profiles.id = current_user_id`

  ## Fixed Issues
  - Ambiguous column reference error
  - RPC function now works correctly
*/

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
  
  SELECT user_profiles.role INTO current_user_role
  FROM user_profiles
  WHERE user_profiles.id = current_user_id;

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