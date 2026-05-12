-- Migration: Add status management to entries v2
-- This version ensures backward compatibility with both 'id' and 'entry_id' column names
-- and handles the student_email field.

ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'working', 'resolved'));

-- Drop existing function to allow signature change
DROP FUNCTION IF EXISTS public.get_admin_alarms();

-- Optimized RPC to return a robust set of fields for the Admin Dashboard
CREATE OR REPLACE FUNCTION public.get_admin_alarms()
RETURNS TABLE (
  id UUID,
  entry_id UUID,
  email TEXT,
  student_email TEXT,
  diary_text TEXT,
  mood TEXT,
  score FLOAT,
  status TEXT,
  recorded_at TIMESTAMPTZ
) AS $$
  SELECT 
    e.id as id, 
    e.id as entry_id,
    p.email as email, 
    p.email as student_email,
    e.text as diary_text, 
    e.mood as mood, 
    e.score as score, 
    e.status as status, 
    e.created_at as recorded_at
  FROM public.entries e
  JOIN public.profiles p ON p.id = e.user_id
  WHERE e.mood = 'Crisis'
  ORDER BY e.created_at DESC;
$$ LANGUAGE sql SECURITY DEFINER;
