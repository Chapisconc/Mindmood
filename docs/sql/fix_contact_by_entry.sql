-- Fix: get_admin_alarms now matches contact_requests by entry_id, not user_id
-- Before: WHERE cr_sub.user_id = e.user_id (all entries of same user got same contact status)
-- After:  WHERE cr_sub.entry_id = e.id (each entry has independent contact status)

CREATE OR REPLACE FUNCTION public.get_admin_alarms()
 RETURNS TABLE(id uuid, entry_id uuid, user_id uuid, email text, student_email text, diary_text text, mood text, score double precision, status text, recorded_at timestamp with time zone, contact_request_id uuid, contact_status text)
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
    e.id                        AS id,
    e.id                        AS entry_id,
    e.user_id                   AS user_id,
    p.email                     AS email,
    p.email                     AS student_email,
    e.text                      AS diary_text,
    e.mood                      AS mood,
    e.score::float              AS score,
    e.status                    AS status,
    e.created_at                AS recorded_at,
    cr.id                       AS contact_request_id,
    cr.status::text             AS contact_status
  FROM public.entries e
  JOIN public.profiles p ON p.id = e.user_id
  LEFT JOIN LATERAL (
    SELECT cr_sub.id, cr_sub.status FROM public.contact_requests cr_sub
    WHERE cr_sub.entry_id = e.id
    ORDER BY cr_sub.created_at DESC
    LIMIT 1
  ) cr ON true
  WHERE e.mood = 'Crisis' AND (e.status IS NULL OR e.status != 'resolved')
  ORDER BY e.created_at DESC
  LIMIT 50;
END;
$function$;
