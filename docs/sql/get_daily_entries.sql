CREATE OR REPLACE FUNCTION get_daily_entries(days integer DEFAULT 7)
RETURNS TABLE (date text, total_entries bigint, crisis_entries bigint)
LANGUAGE sql STABLE AS $$
  WITH date_series AS (
    SELECT to_char(generate_series(CURRENT_DATE - (days - 1), CURRENT_DATE, '1 day'::interval), 'YYYY-MM-DD') AS day
  )
  SELECT
    ds.day,
    COUNT(e.id)::bigint AS total_entries,
    COUNT(e.id) FILTER (WHERE e.mood = 'Crisis')::bigint AS crisis_entries
  FROM date_series ds
  LEFT JOIN entries e ON to_char(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') = ds.day
  GROUP BY ds.day
  ORDER BY ds.day;
$$;
