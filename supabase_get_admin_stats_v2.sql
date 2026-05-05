-- get_admin_stats V2 (con crisis_count, avg_score - ejecuta SQL Editor)

DROP FUNCTION IF EXISTS public.get_admin_stats();

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users INTEGER,
  total_entries INTEGER,
  crisis_count INTEGER,
  avg_score FLOAT,
  active_users INTEGER
) AS $$
SELECT 
  COUNT(DISTINCT e.user_id)::int,
  COUNT(*)::int,
  COUNT(*) FILTER (WHERE e.mood = 'Crisis')::int,
  AVG(e.score)::float,
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days')::int
FROM public.entries e;
$$ LANGUAGE sql SECURITY DEFINER;

-- Ahora AdminDashboard muestra stats + alarms nuevas.
-- Test: supabase.rpc('get_admin_stats')
