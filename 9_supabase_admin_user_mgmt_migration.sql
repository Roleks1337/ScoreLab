-- ============================================================
-- ScoreLab — Admin user management + code limits Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- Run AFTER 8_supabase_phone_votes_banner_migration.sql
--
-- Adds:
--   * premium_codes.valid_until — deadline by which a code must be
--     redeemed (NULL = no deadline).
--   * premium_codes.max_uses    — how many times a multi-use code may
--     be redeemed in total (NULL = unlimited).
--   * premium_codes.uses        — running counter of redemptions, used
--     to enforce max_uses on the client (regular users cannot read
--     other users' redemption rows).
--   * RLS policies so admins can grant / extend premium for ANY user
--     directly from the admin panel.
-- ============================================================

-- 1. New columns on premium_codes (idempotent).
ALTER TABLE public.premium_codes
  ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;

ALTER TABLE public.premium_codes
  ADD COLUMN IF NOT EXISTS max_uses INTEGER;

ALTER TABLE public.premium_codes
  ADD COLUMN IF NOT EXISTS uses INTEGER NOT NULL DEFAULT 0;

-- Backfill the counter for existing multi-use codes so the limit logic
-- starts from an accurate number.
UPDATE public.premium_codes c
SET uses = COALESCE((
  SELECT COUNT(*) FROM public.premium_redemptions r WHERE r.code_id = c.id
), 0)
WHERE c.uses = 0;

-- 2. Allow admins to grant / extend premium for ANY user.
--    (Existing policies only let a user write their OWN subscription.)
DROP POLICY IF EXISTS "Admins can insert any subscription" ON public.premium_subscriptions;
CREATE POLICY "Admins can insert any subscription"
  ON public.premium_subscriptions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update any subscription" ON public.premium_subscriptions;
CREATE POLICY "Admins can update any subscription"
  ON public.premium_subscriptions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- ============================================================
-- DONE.
-- ============================================================
