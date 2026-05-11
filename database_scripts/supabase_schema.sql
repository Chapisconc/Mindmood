-- Supabase Schema Completo para MindMood (ejecutar en SQL Editor)
-- Fixea "policy violation for table profiles"

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  lang TEXT DEFAULT 'es',
  theme TEXT DEFAULT 'dark',
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS + Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
CREATE POLICY "Users access own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Entries table
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  mood TEXT CHECK (mood IN ('Excelente', 'Feliz', 'Agradecido', 'Sorpresa', 'Neutral', 'Triste', 'Enojo', 'Ansiedad', 'Miedo', 'Crisis')),
  score FLOAT,
  distribution JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User owns entry" ON public.entries;
CREATE POLICY "User owns entry" ON public.entries
  FOR ALL USING (auth.uid() = user_id);

-- RPC Functions for Admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total_users', COUNT(DISTINCT user_id),
  'total_entries', COUNT(*)
) FROM public.entries;
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger for streak
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles 
  SET streak = COALESCE(streak, 0) + 1 
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entries_streak_trigger
AFTER INSERT ON public.entries
FOR EACH ROW EXECUTE FUNCTION public.update_user_streak();

-- Seed test user (after signup testuser@example.com / password123)
INSERT INTO public.profiles (id, role) VALUES 
  ( (SELECT id FROM auth.users WHERE email = 'testuser@example.com'), 'user' )
ON CONFLICT (id) DO NOTHING;

-- Enable email auth in Dashboard > Auth > Settings
-- Listo! Copia URL/key a .env, reinicia app.
-- Test: signup/login testuser@example.com / password123


