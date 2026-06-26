-- ============================================================
-- ScoreLab Premium System - Multi-use Codes Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- Run this AFTER running the previous migrations.
-- ============================================================

-- 1. Add multi_use column to premium_codes if it doesn't exist
ALTER TABLE public.premium_codes 
ADD COLUMN IF NOT EXISTS multi_use BOOLEAN NOT NULL DEFAULT false;

-- 2. Create premium_redemptions table to track who used which code
--    This prevents the same user from using a multi-use code multiple times.
CREATE TABLE IF NOT EXISTS public.premium_redemptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id     UUID NOT NULL REFERENCES public.premium_codes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code_id, user_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.premium_redemptions ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for premium_redemptions
-- Users can check their own redemptions
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.premium_redemptions;
CREATE POLICY "Users can view own redemptions"
  ON public.premium_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own redemption row (during redemption)
DROP POLICY IF EXISTS "Users can insert own redemption" ON public.premium_redemptions;
CREATE POLICY "Users can insert own redemption"
  ON public.premium_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all redemption logs
DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.premium_redemptions;
CREATE POLICY "Admins can view all redemptions"
  ON public.premium_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );
