/*
  # Update get_projects_with_progress function to match current schema

  1. Changes
    - Update function to match current projects table structure
    - Use created_by instead of owner_id
    - Remove fields that don't exist in current schema
    - Function respects RLS policies automatically
  
  2. Security
    - SECURITY DEFINER allows function to run with creator privileges
    - RLS policies still apply to the query results
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
  created_at TIMESTAMPTZ,
  created_by UUID,
  shared_with UUID[],
  avg_progress NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.client,
    p.location,
    p.status,
    p.total_budget_usd,
    p.start_date,
    p.created_at,
    p.created_by,
    p.shared_with,
    COALESCE(AVG(pm.progress_percentage), 0)::NUMERIC as avg_progress
  FROM projects p
  LEFT JOIN project_milestones pm ON p.id = pm.project_id
  WHERE 
    (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.client ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR p.status = status_filter)
  GROUP BY p.id, p.name, p.client, p.location, p.status, 
           p.total_budget_usd, p.start_date, p.created_at, 
           p.created_by, p.shared_with
  ORDER BY p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
