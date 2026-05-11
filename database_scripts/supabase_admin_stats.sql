-- Recrear get_admin_stats() (eliminado accidentalmente)

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total_users', COUNT(DISTINCT e.user_id)::int,
  'total_entries', COUNT(*)::int,
  'crisis_count', COUNT(*) FILTER (WHERE e.mood = 'Crisis')::int,
  'avg_score', AVG(e.score)::float,
  'active_users', COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days')::int
) FROM public.entries e;
$$ LANGUAGE sql SECURITY DEFINER;

-- Ejecuta en Supabase SQL Editor. AdminDashboard ahora funciona.
