-- Admin Panel Final (stats globales como StatsScreen + alerts count)

-- get_admin_stats full (incluye alerts_activas = alarms count)
DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total_users', COUNT(DISTINCT e.user_id)::int,
  'total_entries', COUNT(*)::int,
  'alertas_activas', (SELECT COUNT(*) FROM public.alarms)::int,
  'crisis_count', COUNT(*) FILTER (WHERE e.mood = 'Crisis')::int,
  'avg_score', AVG(e.score)::float,
  'active_users', COUNT(DISTINCT e.user_id) FILTER (WHERE e.created_at > NOW() - INTERVAL '30 days')::int,
  'excellent_entries', COUNT(*) FILTER (WHERE e.mood = 'Excelente')::int,
  'happy_entries', COUNT(*) FILTER (WHERE e.mood = 'Feliz')::int,
  'gratitude_entries', COUNT(*) FILTER (WHERE e.mood = 'Agradecido')::int,
  'surprise_entries', COUNT(*) FILTER (WHERE e.mood = 'Sorpresa')::int,
  'neutral_entries', COUNT(*) FILTER (WHERE e.mood = 'Neutral')::int,
  'anger_entries', COUNT(*) FILTER (WHERE e.mood = 'Enojo')::int,
  'anxiety_entries', COUNT(*) FILTER (WHERE e.mood = 'Ansiedad')::int,
  'fear_entries', COUNT(*) FILTER (WHERE e.mood = 'Miedo')::int,
  'sad_entries', COUNT(*) FILTER (WHERE e.mood = 'Triste')::int,
  'crisis_entries', COUNT(*) FILTER (WHERE e.mood = 'Crisis')::int
) FROM public.entries e;
$$ LANGUAGE sql SECURITY DEFINER;

-- Ejecuta. AdminDashboard: stats con alertas_activas visible, PieChart completo, alarms list.
