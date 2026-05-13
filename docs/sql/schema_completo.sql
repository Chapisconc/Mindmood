-- ============================================================================
-- MINDFUL DIARY (MindMood) — SCHEMA COMPLETO
-- Copia y pega TODO este archivo en el SQL Editor de Supabase.
-- ============================================================================

-- ============================================================================
-- 0. LIMPIEZA
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_admin_stats();
DROP FUNCTION IF EXISTS public.get_admin_alarms();
DROP FUNCTION IF EXISTS public.get_user_streak(uuid);
DROP FUNCTION IF EXISTS public.update_own_profile(text, text, text);
DROP FUNCTION IF EXISTS public.admin_update_entry_status(uuid, text);
DROP FUNCTION IF EXISTS public.admin_initiate_contact(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.accept_cris_entry_and_show_contact(uuid);
DROP FUNCTION IF EXISTS public.reject_cris_entry(uuid);
DROP FUNCTION IF EXISTS public.admin_update_contact_info(text, text, text, boolean);
DROP FUNCTION IF EXISTS public.get_contact_info_for_user(uuid);
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.has_accepted_contact(uuid, uuid) CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================================
-- 1. TIPOS ENUM
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
-- 2. FUNCIONES AUXILIARES (antes de las tablas para evitar dependencias circulares)
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
-- 3. TABLA: PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users,
  email           TEXT,
  display_name    TEXT,
  role            TEXT DEFAULT 'user' NOT NULL,
  streak          INT DEFAULT 0 NOT NULL,
  last_entry_at   TIMESTAMPTZ,
  theme           TEXT DEFAULT 'dark' NOT NULL,
  lang            TEXT DEFAULT 'es' NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  contact_email   TEXT,
  contact_phone   TEXT,
  contact_name    TEXT,
  contact_is_active BOOLEAN DEFAULT true
);

-- Add columns to existing profiles table (created before these columns were added)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_is_active BOOLEAN DEFAULT true;

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

DROP POLICY IF EXISTS "Users can view admin contact for accepted requests" ON public.profiles;
CREATE POLICY "Users can view admin contact for accepted requests" ON public.profiles
  FOR SELECT USING (public.has_accepted_contact(auth.uid(), id));

-- ============================================================================
-- 4. TABLA: ENTRIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.entries (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users NOT NULL,
  text            TEXT NOT NULL,
  mood            TEXT NOT NULL,
  score           NUMERIC NOT NULL,
  distribution    JSONB DEFAULT NULL,
  requires_help   BOOLEAN DEFAULT false,
  status          TEXT DEFAULT 'active'
                    CHECK (status IN ('active', 'working', 'resolved')),
  created_at      TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Add requires_help column to existing entries table
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS requires_help BOOLEAN DEFAULT false;

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

DROP POLICY IF EXISTS "Admins can view all entries" ON public.entries;
CREATE POLICY "Admins can view all entries" ON public.entries
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update entries" ON public.entries;
CREATE POLICY "Admins can update entries" ON public.entries
  FOR UPDATE USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_entries_user ON public.entries (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entries_crisis ON public.entries (mood, created_at DESC) WHERE mood = 'Crisis';

-- ============================================================================
-- 5. TABLA: CONTACT_REQUESTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id        UUID REFERENCES public.profiles(id),
  entry_id        UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  initiator       initiator_type NOT NULL,
  status          contact_status DEFAULT 'pending',
  message         TEXT,
  admin_response  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Add entry_id column to existing contact_requests table
ALTER TABLE public.contact_requests ADD COLUMN IF NOT EXISTS entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL;

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

CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON public.contact_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_admin ON public.contact_requests (admin_id, created_at DESC);

-- ============================================================================
-- 6. TRIGGER: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 7. FUNCIÓN: ESTADÍSTICAS GLOBALES (admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users       INT,
  total_entries     INT,
  excellent_entries INT,
  happy_entries     INT,
  sad_entries       INT,
  neutral_entries   INT,
  crisis_entries    INT,
  anger_entries     INT,
  anxiety_entries   INT,
  fear_entries      INT,
  gratitude_entries INT,
  surprise_entries  INT
) AS $$
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
    (SELECT count(*)::int FROM public.entries en WHERE en.mood = 'Sorpresa');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. FUNCIÓN: ALARMAS DE CRISIS (admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  id                  UUID,
  entry_id            UUID,
  user_id             UUID,
  email               TEXT,
  student_email       TEXT,
  diary_text          TEXT,
  mood                TEXT,
  score               FLOAT,
  status              TEXT,
  recorded_at         TIMESTAMPTZ,
  contact_request_id  UUID,
  contact_status      TEXT
) AS $$
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
    WHERE cr_sub.user_id = e.user_id
    ORDER BY cr_sub.created_at DESC
    LIMIT 1
  ) cr ON true
  WHERE e.mood = 'Crisis' AND (e.status IS NULL OR e.status != 'resolved')
  ORDER BY e.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. FUNCIÓN: ACTUALIZAR ESTADO DE ENTRY (admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_entry_status(
  target_entry_id UUID,
  new_status TEXT
)
RETURNS JSON AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores.';
  END IF;
  IF new_status NOT IN ('active', 'working', 'resolved') THEN
    RAISE EXCEPTION 'Estado inválido: %', new_status;
  END IF;

  UPDATE public.entries
  SET status = new_status, updated_at = now()
  WHERE id = target_entry_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. FUNCIÓN: CALCULAR RACHA DE UN USUARIO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_streak(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak      INTEGER := 0;
  curr_date   DATE := CURRENT_DATE;
  entry_date  DATE;
  caller_role text;
BEGIN
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF auth.uid() != target_user_id AND (caller_role IS NULL OR caller_role != 'admin') THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes consultar la racha de otro usuario.';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. FUNCIÓN: ACTUALIZAR PROPIO PERFIL
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_own_profile(
  display_name TEXT DEFAULT NULL,
  theme TEXT DEFAULT NULL,
  lang TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  caller_id uuid;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  UPDATE public.profiles SET
    display_name = COALESCE(update_own_profile.display_name, profiles.display_name),
    theme        = COALESCE(update_own_profile.theme, profiles.theme),
    lang         = COALESCE(update_own_profile.lang, profiles.lang)
  WHERE id = caller_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. FUNCIÓN: ADMIN INICIA CONTACTO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_initiate_contact(
  target_user_id UUID,
  entry_id UUID DEFAULT NULL,
  message TEXT DEFAULT ''
)
RETURNS JSON AS $$
DECLARE
  caller_role text;
  caller_id uuid;
  new_request_id uuid;
BEGIN
  caller_id := auth.uid();
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = caller_id;

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores pueden iniciar contacto.';
  END IF;

  INSERT INTO public.contact_requests (user_id, admin_id, entry_id, initiator, message, status, admin_response)
  VALUES (target_user_id, caller_id, entry_id, 'admin', message, 'pending',
    'Un administrador ha revisado tu caso y está al pendiente de ti.')
  RETURNING id INTO new_request_id;

  IF entry_id IS NOT NULL THEN
    UPDATE public.entries
    SET status = 'working', updated_at = now()
    WHERE id = entry_id AND user_id = target_user_id;
  END IF;

  RETURN json_build_object('success', true, 'request_id', new_request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 13. FUNCIÓN: USUARIO ACEPTA CONTACTO (retorna info del admin)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.accept_cris_entry_and_show_contact(request_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id uuid;
  v_admin_id uuid;
  v_contact_email text;
  v_contact_phone text;
  v_contact_name text;
BEGIN
  SELECT user_id, admin_id INTO v_user_id, v_admin_id
  FROM public.contact_requests WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada.';
  END IF;

  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Acceso denegado: esta solicitud no te pertenece.';
  END IF;

  UPDATE public.contact_requests
  SET status = 'accepted', updated_at = now()
  WHERE id = request_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 14. FUNCIÓN: USUARIO RECHAZA CONTACTO (cierra la crisis)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reject_cris_entry(request_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id uuid;
  v_entry_id uuid;
BEGIN
  SELECT user_id, entry_id INTO v_user_id, v_entry_id
  FROM public.contact_requests WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada.';
  END IF;

  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Acceso denegado: esta solicitud no te pertenece.';
  END IF;

  UPDATE public.contact_requests
  SET status = 'rejected', updated_at = now()
  WHERE id = request_id;

  IF v_entry_id IS NOT NULL THEN
    UPDATE public.entries
    SET status = 'resolved', updated_at = now()
    WHERE id = v_entry_id;
  ELSE
    UPDATE public.entries
    SET status = 'resolved', updated_at = now()
    WHERE user_id = v_user_id AND mood = 'Crisis' AND status IN ('active', 'working');
  END IF;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 15. FUNCIÓN: ADMIN ACTUALIZA SU INFORMACIÓN DE CONTACTO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_contact_info(
  new_email TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_name TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  caller_id uuid;
  caller_role text;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado.';
  END IF;

  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = caller_id;
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: solo administradores.';
  END IF;

  UPDATE public.profiles SET
    contact_email    = COALESCE(admin_update_contact_info.new_email, profiles.contact_email),
    contact_phone    = COALESCE(admin_update_contact_info.new_phone, profiles.contact_phone),
    contact_name     = COALESCE(admin_update_contact_info.new_name, profiles.contact_name),
    contact_is_active = COALESCE(admin_update_contact_info.is_active, profiles.contact_is_active)
  WHERE id = caller_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 16. FUNCIÓN: OBTENER INFO DE CONTACTO PARA USUARIO
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_contact_info_for_user(request_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id uuid;
  v_admin_id uuid;
  v_status text;
  v_contact_email text;
  v_contact_phone text;
  v_contact_name text;
BEGIN
  SELECT user_id, admin_id, status::text
  INTO v_user_id, v_admin_id, v_status
  FROM public.contact_requests WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada.';
  END IF;

  IF auth.uid() != v_user_id THEN
    RAISE EXCEPTION 'Acceso denegado.';
  END IF;

  IF v_status != 'accepted' THEN
    RAISE EXCEPTION 'La solicitud no ha sido aceptada aún.';
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
$$ LANGUAGE plpgsql SECURITY DEFINER;