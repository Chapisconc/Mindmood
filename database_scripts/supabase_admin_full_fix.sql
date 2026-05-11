-- Fix AdminDashboard completo (stats + panorama + alerts)

-- 1. get_admin_stats RETURNS TABLE
DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users int,
  total_entries int,
  crisis_count int,
  avg_score float,
  active_users int,
  excellent_entries int, happy_entries int, gratitude_entries int, surprise_entries int,
  neutral_entries int, anger_entries int, anxiety_entries int, fear_entries int,
  sad_entries int, crisis_entries int
) AS $$
SELECT 
  COUNT(DISTINCT e.user_id),
  COUNT(*),
  COUNT(*) FILTER (WHERE e.mood = 'Crisis'),
  AVG(e.score),
  COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days'),
  COUNT(*) FILTER (WHERE e.mood = 'Excelente'),
  COUNT(*) FILTER (WHERE e.mood = 'Feliz'),
  COUNT(*) FILTER (WHERE e.mood = 'Agradecido'),
  COUNT(*) FILTER (WHERE e.mood = 'Sorpresa'),
  COUNT(*) FILTER (WHERE e.mood = 'Neutral'),
  COUNT(*) FILTER (WHERE e.mood = 'Enojo'),
  COUNT(*) FILTER (WHERE e.mood = 'Ansiedad'),
  COUNT(*) FILTER (WHERE e.mood = 'Miedo'),
  COUNT(*) FILTER (WHERE e.mood = 'Triste'),
  COUNT(*) FILTER (WHERE e.mood = 'Crisis')
FROM public.entries e;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Confirm alarms table + RPC
-- (de suicide_crisis_alerts.sql)

-- 3. Test queries:
-- SELECT * FROM get_admin_stats();
-- SELECT * FROM get_admin_alarms();

-- Ejecuta y reinicia app. Todo panel visible.
