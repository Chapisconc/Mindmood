-- ============================================================================
-- MIGRATION 002: Add selected_moods column & fix get_admin_stats RPC
-- ============================================================================

-- 1. Add selected_moods column to entries (if not exists)
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS selected_moods JSONB DEFAULT '[]'::jsonb;

-- 2. Recreate get_admin_stats with disgust_entries for "Asco" mood
CREATE OR REPLACE FUNCTION public.get_admin_stats()
 RETURNS TABLE(
   total_users integer,
   total_entries integer,
   excellent_entries integer,
   happy_entries integer,
   sad_entries integer,
   neutral_entries integer,
   crisis_entries integer,
   anger_entries integer,
   anxiety_entries integer,
   fear_entries integer,
   gratitude_entries integer,
   surprise_entries integer,
   disgust_entries integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  caller_role text;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: No eres administrador.';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT count(*)::int FROM public.profiles),
    (SELECT count(*)::int FROM public.entries),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Excelente'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Feliz'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Triste'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Neutral'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Crisis'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Enojo'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Ansiedad'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Miedo'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Agradecido'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Sorpresa'),
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Asco');
END;
$function$;
