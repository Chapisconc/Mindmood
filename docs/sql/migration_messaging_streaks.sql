-- Migration: Messaging and Streaks
-- Adds support for admin-user contact requests and streak calculation

-- 1. Create Types for Messaging
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_status') THEN
        CREATE TYPE contact_status AS ENUM ('pending', 'accepted', 'rejected');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'initiator_type') THEN
        CREATE TYPE initiator_type AS ENUM ('user', 'admin');
    END IF;
END $$;

-- 2. Create Contact Requests Table
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES public.profiles(id),
  initiator initiator_type NOT NULL,
  status contact_status DEFAULT 'pending',
  message TEXT,
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Users can view own requests" ON public.contact_requests;
CREATE POLICY "Users can view own requests" ON public.contact_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own requests" ON public.contact_requests;
CREATE POLICY "Users can insert own requests" ON public.contact_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND initiator = 'user');

DROP POLICY IF EXISTS "Admins can view all requests" ON public.contact_requests;
CREATE POLICY "Admins can view all requests" ON public.contact_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Function for Current Streak
CREATE OR REPLACE FUNCTION get_user_streak(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    curr_date DATE := CURRENT_DATE;
    entry_date DATE;
BEGIN
    LOOP
        SELECT DISTINCT created_at::DATE INTO entry_date
        FROM public.entries
        WHERE user_id = target_user_id AND created_at::DATE = curr_date
        LIMIT 1;

        IF entry_date IS NOT NULL THEN
            streak := streak + 1;
            curr_date := curr_date - 1;
        ELSE
            -- Si no hay entrada hoy, comprobamos ayer para ver si la racha sigue viva
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
$$ LANGUAGE plpgsql;
