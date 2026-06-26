-- ============================================================
-- ScoreLab Admin System - Database Migration
-- Run this AFTER supabase_premium_migration.sql
-- Run in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Admins table
--    CRITICAL: No INSERT/UPDATE/DELETE RLS policies intentionally.
--    Only the Supabase service_role (Dashboard) can write to this table.
--    Regular users can only read their OWN row (to verify if they are admin).
CREATE TABLE IF NOT EXISTS public.admins (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  panel_password_hash  TEXT NOT NULL,  -- SHA-256 hex of the panel password (computed below)
  display_name         TEXT,           -- Optional label for this admin (for display purposes)
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can only SELECT their own row.
-- Without an INSERT/UPDATE/DELETE policy, only the service_role can write.
CREATE POLICY "Admins can read own row"
  ON public.admins FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Allow admins to read all premium_codes (for the admin panel code list).
--    The existing "Users can read unused codes" policy already allows this.
--    We add a separate policy for admins to read ALL codes (including used ones).
DROP POLICY IF EXISTS "Admins can read all codes" ON public.premium_codes;
CREATE POLICY "Admins can read all codes"
  ON public.premium_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );

-- 3. Allow admins to INSERT new premium codes via the app.
DROP POLICY IF EXISTS "Admins can insert codes" ON public.premium_codes;
CREATE POLICY "Admins can insert codes"
  ON public.premium_codes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );

-- 4. Allow admins to DELETE codes (e.g. to revoke a code).
DROP POLICY IF EXISTS "Admins can delete codes" ON public.premium_codes;
CREATE POLICY "Admins can delete codes"
  ON public.premium_codes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );

-- 5. Allow admins to read all premium subscriptions.
DROP POLICY IF EXISTS "Admins can read all subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Admins can read all subscriptions"
  ON public.premium_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- HOW TO CREATE AN ADMIN ACCOUNT
-- ============================================================
-- Step 1: Have the user create a normal account on ScoreLab.
-- Step 2: Find their UUID in Supabase Dashboard > Authentication > Users.
-- Step 3: Compute SHA-256 of your chosen panel password.
--         You can use this in your browser console:
--
--   async function sha256(msg) {
--     const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
--     return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
--   }
--   sha256('YourSecretPanelPassword').then(console.log);
--
-- Step 4: Run this INSERT in the SQL Editor (only you can do this):
--
--   INSERT INTO public.admins (user_id, panel_password_hash, display_name)
--   VALUES (
--     'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- user UUID from Step 2
--     'sha256hashhere',                          -- hash from Step 3
--     'Admin Name'
--   );
--
-- ============================================================
-- EXAMPLE (replace with real values before running):
-- ============================================================
-- INSERT INTO public.admins (user_id, panel_password_hash, display_name)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
--   'Wiktor (Główny Admin)'
-- );
