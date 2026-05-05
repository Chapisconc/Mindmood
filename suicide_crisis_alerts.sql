-- Crisis Alerts + Admin Alarms (ejecutar SQL Editor)

-- Alarms table
CREATE TABLE IF NOT EXISTS public.alarms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  diary_text TEXT NOT NULL,
  mood TEXT NOT NULL,
  score FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin see alarms" ON public.alarms FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger insert alarm on crisis entry
CREATE OR REPLACE FUNCTION public.handle_crisis_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mood = 'Crisis' THEN
    INSERT INTO public.alarms (entry_id, user_id, email, diary_text, mood, score)
    VALUES (NEW.id, NEW.user_id, (SELECT email FROM auth.users WHERE id = NEW.user_id), NEW.text, NEW.mood, NEW.score);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS crisis_alarm_trigger ON public.entries;
CREATE TRIGGER crisis_alarm_trigger
  AFTER INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_crisis_entry();

-- RPC get_admin_alarms
CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  id UUID,
  email TEXT,
  diary_text TEXT,
  mood TEXT,
  score FLOAT,
  recorded_at TIMESTAMPTZ
) AS $$
SELECT a.id, a.email, a.diary_text, a.mood, a.score, a.recorded_at
FROM public.alarms a
ORDER BY a.recorded_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;

-- Listo! Crisis texts ahora alert admin + user popup.
