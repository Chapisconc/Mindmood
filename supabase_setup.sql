-- ==========================================
-- 1. LIMPIAR SI EXISTE (Solo para correrlo varias veces sin error)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_admin_stats();
DROP TABLE IF EXISTS public.entries;
DROP TABLE IF EXISTS public.profiles;

-- ==========================================
-- 2. CREAR TABLA DE PERFILES Y ROLES
-- ==========================================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  email text,
  display_name text,
  role text DEFAULT 'user' NOT NULL,
  streak int DEFAULT 0 NOT NULL,
  last_entry_at timestamp with time zone,
  theme text DEFAULT 'dark' NOT NULL,
  lang text DEFAULT 'es' NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- ==========================================
-- 3. AUTOMATIZADOR DE REGISTRO (TRIGGER)
-- ==========================================
-- Esto asignará automáticamente el rol 'admin' si el correo es c@c.com
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email = 'c@c.com' THEN 'admin' ELSE 'user' END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 4. CREAR TABLA DE DIARIOS (ENTRIES)
-- ==========================================
CREATE TABLE public.entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  text text NOT NULL,
  mood text NOT NULL,
  score numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own entries" ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own entries" ON entries FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 5. FUNCIÓN PRIVADA DEL ADMINISTRADOR PARA ESTADÍSTICAS GLOBALES EXPANIDAS
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
  total_users INT, 
  total_entries INT, 
  excellent_entries INT,
  happy_entries INT, 
  sad_entries INT,
  neutral_entries INT,
  crisis_entries INT
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
    (SELECT count(*)::int FROM public.profiles),
    (SELECT count(*)::int FROM public.entries),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Excelente'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Feliz'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Triste'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Neutral'),
    (SELECT count(*)::int FROM public.entries WHERE mood = 'Crisis');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 6. PANEL DE CONTROL DE RIESGOS (CRISIS LOGS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  student_email text,
  diary_text text,
  recorded_at timestamp with time zone,
  crisis_score numeric
) AS $$
DECLARE
  caller_role text;
BEGIN
  -- Validar de forma segura que solo el admin pueda ejecutar esto
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  IF caller_role != 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: No eres administrador.';
  END IF;

  RETURN QUERY 
  SELECT 
    p.email,
    e.text,
    e.created_at,
    e.score
  FROM public.entries e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.mood = 'Crisis'
  ORDER BY e.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
