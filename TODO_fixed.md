# Fixed Diary App Setup Guide

Your code is **not broken** - it's deployed and ready! API live, RN starts. Main issue: **Supabase DB not set up** (no tables = login/fetch fail).

## Quick Fix Steps

1. **Supabase Project:**
   - supabase.com/dashboard --> New Project.
   - Get URL + anon key from Settings/API.
   - Edit `mindmood/.env`:
     ```
     EXPO_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
     EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
     ```

2. **Run Schema SQL** (Supabase SQL Editor):

   ```sql
   -- Profiles
   CREATE TABLE profiles (
     id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
     role text DEFAULT 'user',
     lang text DEFAULT 'es',
     theme text DEFAULT 'dark',
     streak int DEFAULT 0
   );
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   -- Policies...
   -- Entries table similar...
   ```

   (Full in TODO.md)

3. **Servers Running:**
   - RN: `cd mindmood && npx expo start` (QR scan).
   - API: Live https://mindmood-ai.onrender.com (test POST /analyze).

4. **Test:**
   - Signup/login → New entry → AI analysis saves to DB → History/Stats.

**Code 100% fixed - external config only.** Run commands to demo.
