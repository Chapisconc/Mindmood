-- ============================================================================
-- FIX: RLS policies + functions (sin borrar tablas)
-- Copia y pega todo en Supabase Dashboard → SQL Editor
-- ============================================================================

-- ============================================================================
-- 0. DROP problematic RLS policies
-- ============================================================================
DROP POLICY IF EXISTS "Users can view admin contact for accepted requests" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all" ON public.contact_requests;
DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;

-- ============================================================================
-- 1. DROP ALL functions (CASCADE elimina triggers dependientes)
-- ============================================================================
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.has_accepted_contact(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_alarms() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_streak(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_own_profile(text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_entry_status(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.admin_initiate_contact(uuid, uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.accept_cris_entry_and_show_contact(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.reject_cris_entry(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.admin_update_contact_info(text, text, text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_contact_info_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_entries(integer) CASCADE;

-- ============================================================================
-- 2. ENUM types (IF NOT EXISTS)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
    CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'initiator_type') THEN
    CREATE TYPE initiator_type AS ENUM ('user', 'admin');
  END IF;
END $$;

-- ============================================================================
-- 3. CORE functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

CREATE OR REPLACE FUNCTION public.has_accepted_contact(
  check_user_id UUID, check_admin_id UUID
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contact_requests
    WHERE (user_id = check_user_id AND admin_id = check_admin_id AND status = 'accepted')
       OR (admin_id = check_user_id AND user_id = check_admin_id AND status = 'accepted')
  );
$$;

-- ============================================================================
-- 4. TRIGGER: crear perfil al registrarse
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails text[];
BEGIN
  BEGIN
    admin_emails := string_to_array(current_setting('app.admin_emails', true), ',');
  EXCEPTION WHEN OTHERS THEN
    admin_emails := ARRAY[]::text[];
  END;
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email,
    CASE WHEN new.email = ANY(admin_emails) THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. ADMIN functions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users INT, total_entries INT,
  excellent_entries INT, happy_entries INT, sad_entries INT,
  neutral_entries INT, crisis_entries INT, anger_entries INT,
  anxiety_entries INT, fear_entries INT, gratitude_entries INT,
  surprise_entries INT, disgust_entries INT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    (SELECT count(*)::int FROM public.profiles),
    (SELECT count(*)::int FROM public.entries),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Excelente'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Feliz'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Triste'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Neutral'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Crisis'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Enojo'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Ansiedad'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Miedo'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Agradecido'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Sorpresa'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Asco');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  id UUID, entry_id UUID, user_id UUID,
  email TEXT, student_email TEXT,
  diary_text TEXT, mood TEXT, score FLOAT,
  status TEXT, recorded_at TIMESTAMPTZ,
  contact_request_id UUID, contact_status TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    e.id, e.id, e.user_id,
    p.email, p.email,
    e.text, e.mood, e.score::float,
    COALESCE(e.status, 'active'),
    e.created_at,
    cr.id, cr.status::text
  FROM public.entries e
  JOIN public.profiles p ON p.id = e.user_id
  LEFT JOIN LATERAL (
    SELECT cr_sub.id, cr_sub.status FROM public.contact_requests cr_sub
    WHERE cr_sub.entry_id = e.id
    ORDER BY cr_sub.created_at DESC LIMIT 1
  ) cr ON true
  WHERE e.mood = 'Crisis' AND COALESCE(e.status, 'active') != 'resolved'
  ORDER BY e.created_at DESC
  LIMIT 200;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_entry_status(
  target_entry_id UUID, new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF new_status NOT IN ('active', 'working', 'resolved') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;
  UPDATE public.entries SET status = new_status, updated_at = now() WHERE id = target_entry_id;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_initiate_contact(
  target_user_id UUID, entry_id UUID DEFAULT NULL, message TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  new_request_id uuid;
BEGIN
  caller_id := auth.uid();
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  INSERT INTO public.contact_requests (user_id, admin_id, entry_id, initiator, message, status, admin_response)
  VALUES (target_user_id, caller_id, entry_id, 'admin', message, 'pending',
    'Un administrador ha revisado tu caso y esta al pendiente de ti.')
  RETURNING id INTO new_request_id;
  IF entry_id IS NOT NULL THEN
    UPDATE public.entries SET status = 'working', updated_at = now() WHERE id = entry_id AND user_id = target_user_id;
  END IF;
  RETURN json_build_object('success', true, 'request_id', new_request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_cris_entry_and_show_contact(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
  v_contact_email TEXT;
  v_contact_phone TEXT;
  v_contact_name TEXT;
BEGIN
  SELECT user_id, admin_id INTO v_user_id, v_admin_id
  FROM public.contact_requests WHERE id = request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF auth.uid() != v_user_id THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.contact_requests SET status = 'accepted', updated_at = now() WHERE id = request_id;
  SELECT contact_email, contact_phone, contact_name
  INTO v_contact_email, v_contact_phone, v_contact_name
  FROM public.profiles WHERE id = v_admin_id;
  RETURN json_build_object(
    'success', true,
    'admin_email', COALESCE(v_contact_email, ''),
    'admin_phone', COALESCE(v_contact_phone, ''),
    'admin_name', COALESCE(v_contact_name, 'Contacto Profesional')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_cris_entry(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_entry_id UUID;
BEGIN
  SELECT user_id, entry_id INTO v_user_id, v_entry_id
  FROM public.contact_requests WHERE id = request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF auth.uid() != v_user_id THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.contact_requests SET status = 'rejected', updated_at = now() WHERE id = request_id;
  IF v_entry_id IS NOT NULL THEN
    UPDATE public.entries SET status = 'resolved', updated_at = now() WHERE id = v_entry_id;
  END IF;
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_info_for_user(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_admin_id UUID;
  v_status TEXT;
  v_contact_email TEXT;
  v_contact_phone TEXT;
  v_contact_name TEXT;
BEGIN
  SELECT user_id, admin_id, status::text INTO v_user_id, v_admin_id, v_status
  FROM public.contact_requests WHERE id = request_id;
  IF NOT FOUND OR auth.uid() != v_user_id OR v_status != 'accepted' THEN
    RAISE EXCEPTION 'Invalid or not accepted';
  END IF;
  SELECT contact_email, contact_phone, contact_name
  INTO v_contact_email, v_contact_phone, v_contact_name
  FROM public.profiles WHERE id = v_admin_id;
  RETURN json_build_object(
    'admin_email', COALESCE(v_contact_email, ''),
    'admin_phone', COALESCE(v_contact_phone, ''),
    'admin_name', COALESCE(v_contact_name, 'Contacto Profesional')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_contact_info(
  new_email TEXT DEFAULT NULL, new_phone TEXT DEFAULT NULL,
  new_name TEXT DEFAULT NULL, is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.profiles SET
    contact_email = COALESCE(new_email, contact_email),
    contact_phone = COALESCE(new_phone, contact_phone),
    contact_name = COALESCE(new_name, contact_name),
    contact_is_active = COALESCE(is_active, contact_is_active)
  WHERE id = auth.uid();
  RETURN json_build_object('success', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_streak(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  streak INTEGER := 0;
  curr_date DATE := CURRENT_DATE;
  entry_date DATE;
BEGIN
  IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  LOOP
    SELECT DISTINCT created_at::DATE INTO entry_date
    FROM public.entries
    WHERE user_id = target_user_id AND created_at::DATE = curr_date
    LIMIT 1;
    IF entry_date IS NOT NULL THEN
      streak := streak + 1;
      curr_date := curr_date - 1;
    ELSE
      IF curr_date = CURRENT_DATE THEN
        curr_date := curr_date - 1;
        CONTINUE;
      ELSE
        EXIT;
      END IF;
    END IF;
  END LOOP;
  RETURN streak;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_entries(days integer DEFAULT 7)
RETURNS TABLE (date TEXT, total_entries BIGINT, crisis_entries BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
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

-- ============================================================================
-- 6. RLS POLICIES (simples, sin subqueries a otras tablas)
-- ============================================================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ENTRIES
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own entries" ON public.entries;
CREATE POLICY "Users can insert their own entries" ON public.entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own entries" ON public.entries;
CREATE POLICY "Users can view their own entries" ON public.entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON public.entries;
CREATE POLICY "Users can update their own entries" ON public.entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User owns entry" ON public.entries;
CREATE POLICY "User owns entry" ON public.entries
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all entries" ON public.entries;
CREATE POLICY "Admins can view all entries" ON public.entries
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update entries" ON public.entries;
CREATE POLICY "Admins can update entries" ON public.entries
  FOR UPDATE USING (public.is_admin());

-- CONTACT REQUESTS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requests" ON public.contact_requests;
CREATE POLICY "Users can view own requests" ON public.contact_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own requests" ON public.contact_requests;
CREATE POLICY "Users can insert own requests" ON public.contact_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND initiator = 'user');

DROP POLICY IF EXISTS "Users can update own pending requests" ON public.contact_requests;
CREATE POLICY "Users can update own pending requests" ON public.contact_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all requests" ON public.contact_requests;
CREATE POLICY "Admins can manage all requests" ON public.contact_requests
  FOR ALL USING (public.is_admin());

-- ============================================================================
-- 7. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_entries_user ON public.entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_crisis ON public.entries (mood, created_at DESC) WHERE mood = 'Crisis';
CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON public.contact_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_admin ON public.contact_requests (admin_id, created_at DESC);
