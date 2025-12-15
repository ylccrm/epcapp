/*
  # Fix shared_with Type in RPC Function (v2)

  This migration fixes the type mismatch for shared_with column.

  ## Changes Made

  1. **Drop Old Function**
     - Remove function with incorrect return type

  2. **Create New Function**
     - Change shared_with from TEXT[] to UUID[]
     - Matches actual column type in projects table

  ## Fixed Issues
  - Type mismatch error: "Returned type uuid[] does not match expected type text[]"
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
  ORDER BY p.created_at DESC
  OFFSET page_offset
  LIMIT page_limit;
END;
$$;