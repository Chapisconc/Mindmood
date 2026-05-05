-- Fix RLS Policy Violation (solo policies - no recrea tablas)

-- Enable RLS + Policies para profiles (existente)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
CREATE POLICY "Users access own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Para entries
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User owns entry" ON public.entries;
CREATE POLICY "User owns entry" ON public.entries
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RPC admin (si admin check needed)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
SELECT json_build_object(
  'total_users', COUNT(DISTINCT e.user_id),
  'total_entries', COUNT(*)
) FROM public.entries e JOIN public.profiles p ON e.user_id = p.id WHERE p.role = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

-- Listo! Reinicia app, login funciona sin policy errors.

-- Nota: Email auth debe estar enabled en Dashboard > Auth.
