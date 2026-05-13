-- ============================================================================
-- MINDFUL DIARY (MindMood) — SCHEMA REPAIR SCRIPT
-- Ejecutar en el SQL Editor de Supabase para arreglar problemas detectados
-- ============================================================================

-- ============================================================================
-- 1. ARREGLAR entries: AÑADIR COLUMNA requires_help FALTANTE
-- ============================================================================

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'entries' AND column_name = 'requires_help') THEN
      ALTER TABLE public.entries ADD COLUMN requires_help BOOLEAN DEFAULT false;
      RAISE NOTICE 'Columna requires_help añadida a entries';
   ELSE
      RAISE NOTICE 'Columna requires_help ya existe en entries';
   END IF;
END $$;

-- ============================================================================
-- 2. REPARAR FUNCIÓN is_admin() (clave para evitar recursión)
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
   SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario actual es admin (bypassa RLS)';

-- ============================================================================
-- 3. REPARAR POLÍTICAS RLS QUE CAUSAN RECURSIÓN INFINITA
-- ============================================================================

-- Primero, eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can view admin contact for accepted requests" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all requests" ON public.contact_requests;

-- Recrear políticas con cuidado para evitar recursión
-- Nota: La política de profiles que consulta contact_requests es necesaria
-- pero debe diseñarse para evitar bucles infinitos.

-- POLÍTICA CORREGIDA para profiles
CREATE POLICY "Users can view admin contact for accepted requests" ON public.profiles
   FOR SELECT USING (
      EXISTS (
         SELECT 1 FROM public.contact_requests cr
         WHERE cr.status = 'accepted' 
           AND (
               (cr.user_id = auth.uid() AND cr.admin_id = profiles.id) OR
               (cr.admin_id = auth.uid() AND cr.user_id = profiles.id)
           )
      )
   );

-- POLÍTICA CORREGIDA para contact_requests
-- Usamos is_admin() que ya tiene SET row_security = off para evitar recursión
CREATE POLICY "Admins can manage all requests" ON public.contact_requests
   FOR ALL USING (public.is_admin());

-- ============================================================================
-- 4. VERIFICAR QUE EXISTEN LOS TIPOS ENUM
-- ============================================================================

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
      CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'rejected');
      RAISE NOTICE 'Tipo contact_status creado';
   ELSE
      RAISE NOTICE 'Tipo contact_status ya existe';
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'initiator_type') THEN
      CREATE TYPE initiator_type AS ENUM ('user', 'admin');
      RAISE NOTICE 'Tipo initiator_type creado';
   ELSE
      RAISE NOTICE 'Tipo initiator_type ya existe';
   END IF;
END $$;

-- ============================================================================
-- 5. VERIFICAR QUE EXISTE EL TRIGGER handle_new_user
-- ============================================================================

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM information_schema.routines 
                  WHERE routine_name = 'handle_new_user' AND routine_schema = 'public') THEN
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

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
         AFTER INSERT ON auth.users
         FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

      RAISE NOTICE 'Trigger handle_new_user creado';
   ELSE
      RAISE NOTICE 'Trigger handle_new_user ya existe';
   END IF;
END $$;

-- ============================================================================
-- 6. VERIFICAR QUE EXISTEN TODAS LAS RPC FUNCTIONS
-- ============================================================================

DO $$
DECLARE
   rpc_names text[] := ARRAY[
      'get_admin_stats',
      'get_admin_alarms', 
      'get_user_streak',
      'update_own_profile',
      'admin_update_entry_status',
      'admin_initiate_contact',
      'accept_cris_entry_and_show_contact',
      'reject_cris_entry',
      'admin_update_contact_info',
      'get_contact_info_for_user'
   ];
   rpc_name text;
BEGIN
   FOREACH rpc_name IN ARRAY rpc_names
   LOOP
      IF NOT EXISTS (SELECT 1 FROM information_schema.routines 
                     WHERE routine_name = rpc_name AND routine_schema = 'public') THEN
         RAISE EXCEPTION 'RPC function % no existe', rpc_name;
      ELSE
         RAISE NOTICE 'RPC function % existe', rpc_name;
      END IF;
   END LOOP;
END $$;

-- ============================================================================
-- 7. VERIFICAR ÍNDICES
-- ============================================================================

DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'entries' AND indexname = 'idx_entries_user') THEN
      CREATE INDEX IF NOT EXISTS idx_entries_user ON public.entries (user_id, created_at DESC);
      RAISE NOTICE 'Índice idx_entries_user creado';
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'entries' AND indexname = 'idx_entries_crisis') THEN
      CREATE INDEX IF NOT EXISTS idx_entries_crisis ON public.entries (mood, created_at DESC) WHERE mood = 'Crisis';
      RAISE NOTICE 'Índice idx_entries_crisis creado';
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_requests' AND indexname = 'idx_contact_requests_user') THEN
      CREATE INDEX IF NOT EXISTS idx_contact_requests_user ON public.contact_requests (user_id, created_at DESC);
      RAISE NOTICE 'Índice idx_contact_requests_user creado';
   END IF;
   
   IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'contact_requests' AND indexname = 'idx_contact_requests_admin') THEN
      CREATE INDEX IF NOT EXISTS idx_contact_requests_admin ON public.contact_requests (admin_id, created_at DESC);
      RAISE NOTICE 'Índice idx_contact_requests_admin creado';
   END IF;
END $$;

-- ============================================================================
-- 8. VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
   profiles_count integer;
   entries_count integer;
   contact_requests_count integer;
BEGIN
   -- Contar filas en cada tabla
   SELECT count(*) INTO profiles_count FROM public.profiles;
   SELECT count(*) INTO entries_count FROM public.entries;
   SELECT count(*) INTO contact_requests_count FROM public.contact_requests;
   
   RAISE NOTICE '=== VERIFICACIÓN FINAL ==='; 
   RAISE NOTICE 'Profiles: % filas', profiles_count;
   RAISE NOTICE 'Entries: % filas', entries_count;
   RAISE NOTICE 'Contact Requests: % filas', contact_requests_count;
   RAISE NOTICE 'Schema repair completado exitosamente';
EXCEPTION WHEN OTHERS THEN
   RAISE EXCEPTION 'Error durante verificación final: %', SQLERRM;
END $$;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================