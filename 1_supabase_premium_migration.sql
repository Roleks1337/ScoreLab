-- ============================================================
-- ScoreLab Premium System - Database Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Premium subscriptions table
--    Tracks each user's active premium period.
--    Using UPSERT on user_id so each user has one row,
--    always reflecting the latest/furthest expiry.
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  code_used   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS premium_subscriptions_updated_at ON public.premium_subscriptions;
CREATE TRIGGER premium_subscriptions_updated_at
  BEFORE UPDATE ON public.premium_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Premium codes table
--    Admin generates codes that users can redeem once.
--    Each code gives a configurable number of premium days (default 30).
CREATE TABLE IF NOT EXISTS public.premium_codes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code       TEXT NOT NULL UNIQUE,
  days       INTEGER NOT NULL DEFAULT 30,
  used       BOOLEAN NOT NULL DEFAULT false,
  used_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note       TEXT  -- Optional admin note (e.g. "Given to user X for bug report")
);

-- 3. Row Level Security
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_codes ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (code redemption)
CREATE POLICY "Users can insert own subscription"
  ON public.premium_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (code redemption extends expiry)
CREATE POLICY "Users can update own subscription"
  ON public.premium_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can read unused codes (to validate their code)
CREATE POLICY "Users can read unused codes"
  ON public.premium_codes FOR SELECT
  USING (true);

-- Users can mark a code as used (update)
CREATE POLICY "Users can update code on redemption"
  ON public.premium_codes FOR UPDATE
  USING (true);

-- ============================================================
-- Example: Insert some test premium codes (optional)
-- ============================================================
-- INSERT INTO public.premium_codes (code, days, note) VALUES
--   ('SCORELAB-TEST-1234', 30, 'Test code - 30 days'),
--   ('SCORELAB-BETA-2024', 90, 'Beta tester gift - 90 days'),
--   ('SCORELAB-PROMO-1M',  30, 'Promo campaign code');
