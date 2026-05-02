-- Migration to add resolution capability to entries
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS is_resolved boolean DEFAULT false;

-- Update get_admin_alarms to only show unresolved entries
CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  entry_id uuid,
  student_email text,
  diary_text text,
  recorded_at timestamp with time zone,
  crisis_score numeric
) AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: No eres administrador.';
  END IF;

  RETURN QUERY 
  SELECT 
    e.id,
    p.email,
    e.text,
    e.created_at,
    e.score
  FROM public.entries e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.mood = 'Crisis' AND e.is_resolved = false
  ORDER BY e.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New function to mark an entry as resolved
CREATE OR REPLACE FUNCTION public.resolve_entry(target_id uuid)
RETURNS void AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado.';
  END IF;

  UPDATE public.entries 
  SET is_resolved = true 
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
