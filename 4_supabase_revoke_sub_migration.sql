-- ============================================================
-- ScoreLab Premium System - Revoke Subscription Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Allow admins to delete/revoke subscriptions from premium_subscriptions
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Admins can delete subscriptions"
  ON public.premium_subscriptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    )
  );
