-- ============================================================
-- ScoreLab — Phone, role-default banner, comment likes Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- Run AFTER 7_supabase_hide_users_migration.sql
-- ============================================================

-- 1. Phone number (optional, not verified).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Banner color now defaults to the user's ROLE colour when unset.
--    Make the column nullable, drop the hard-coded default, and clear
--    rows that still hold the old blue default so they fall back to the
--    role colour (resolved on the client).
ALTER TABLE public.profiles ALTER COLUMN banner_color DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN banner_color DROP NOT NULL;
UPDATE public.profiles
  SET banner_color = NULL
  WHERE banner_color = 'linear-gradient(135deg, #0066ff 0%, #6aaee8 100%)';

-- 3. Comment votes (👍 / 👎). One row per (comment, user).
CREATE TABLE IF NOT EXISTS public.comment_votes (
  comment_id UUID NOT NULL REFERENCES public.course_comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value      SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS comment_votes_comment_idx
  ON public.comment_votes (comment_id);

ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;

-- Anyone may read votes (needed to display counts).
DROP POLICY IF EXISTS "Anyone can read votes" ON public.comment_votes;
CREATE POLICY "Anyone can read votes"
  ON public.comment_votes FOR SELECT
  USING (true);

-- A user manages only their own vote.
DROP POLICY IF EXISTS "Users can insert own vote" ON public.comment_votes;
CREATE POLICY "Users can insert own vote"
  ON public.comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vote" ON public.comment_votes;
CREATE POLICY "Users can update own vote"
  ON public.comment_votes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vote" ON public.comment_votes;
CREATE POLICY "Users can delete own vote"
  ON public.comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- DONE. profiles.phone added; banner_color falls back to role
-- colour when NULL; comment_votes drives 👍/👎.
-- ============================================================
