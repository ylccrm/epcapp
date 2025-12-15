/*
  # Create function to get projects with progress in a single query

  1. New Functions
    - `get_projects_with_progress` - Returns projects with average milestone progress
      - Eliminates N+1 query problem by joining projects with milestones
      - Calculates average progress in database instead of application
      - Supports server-side search and filtering
      - Implements pagination with offset and limit

  2. Performance Impact
    - Reduces 51+ queries to 1 query for 50 projects
    - Expected 80% performance improvement on projects page
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
  capacity_kwp NUMERIC,
  total_budget_usd NUMERIC,
  contract_value_usd NUMERIC,
  estimated_start_date DATE,
  estimated_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  owner_id UUID,
  created_at TIMESTAMPTZ,
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
    p.capacity_kwp,
    p.total_budget_usd,
    p.contract_value_usd,
    p.estimated_start_date,
    p.estimated_end_date,
    p.actual_start_date,
    p.actual_end_date,
    p.owner_id,
    p.created_at,
    COALESCE(AVG(pm.progress_percentage), 0)::NUMERIC as avg_progress
  FROM projects p
  LEFT JOIN project_milestones pm ON p.id = pm.project_id
  WHERE 
    (search_term IS NULL OR p.name ILIKE '%' || search_term || '%' OR p.client ILIKE '%' || search_term || '%')
    AND (status_filter IS NULL OR p.status = status_filter)
  GROUP BY p.id, p.name, p.client, p.location, p.status, p.capacity_kwp, 
           p.total_budget_usd, p.contract_value_usd, p.estimated_start_date, 
           p.estimated_end_date, p.actual_start_date, p.actual_end_date, 
           p.owner_id, p.created_at
  ORDER BY p.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
