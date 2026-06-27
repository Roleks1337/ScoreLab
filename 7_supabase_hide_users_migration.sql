-- ============================================================
-- ScoreLab — Rename "ban" to "hide" (shadow-hide) Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- Run AFTER 6_supabase_profiles_comments_migration.sql
--
-- New behaviour:
--   * A "hidden" user can STILL post comments.
--   * Their comments are visible ONLY to admins and to the
--     author themselves (a shadow-hide). Everyone else does
--     not see them.
--   * Admins see hidden users (id + nickname) in the panel and
--     can restore (un-hide) them.
-- ============================================================

-- 1. Rename the table comment_bans -> hidden_users (idempotent).
ALTER TABLE IF EXISTS public.comment_bans RENAME TO hidden_users;

-- If the table never existed (fresh DB), create it.
CREATE TABLE IF NOT EXISTS public.hidden_users (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason     TEXT,
  hidden_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rename the old column banned_by -> hidden_by if it is still around.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hidden_users' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE public.hidden_users RENAME COLUMN banned_by TO hidden_by;
  END IF;
END $$;

ALTER TABLE public.hidden_users ENABLE ROW LEVEL SECURITY;

-- 2. Replace old ban policies with hide policies.
DROP POLICY IF EXISTS "Users can read own ban"   ON public.hidden_users;
DROP POLICY IF EXISTS "Admins can read bans"      ON public.hidden_users;
DROP POLICY IF EXISTS "Admins can ban users"      ON public.hidden_users;
DROP POLICY IF EXISTS "Admins can unban users"    ON public.hidden_users;

-- A user can see whether THEY are hidden (used so the author still sees own comments).
DROP POLICY IF EXISTS "Users can read own hidden status" ON public.hidden_users;
CREATE POLICY "Users can read own hidden status"
  ON public.hidden_users FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all hidden users.
DROP POLICY IF EXISTS "Admins can read hidden users" ON public.hidden_users;
CREATE POLICY "Admins can read hidden users"
  ON public.hidden_users FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can hide a user (insert).
DROP POLICY IF EXISTS "Admins can hide users" ON public.hidden_users;
CREATE POLICY "Admins can hide users"
  ON public.hidden_users FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can restore (delete).
DROP POLICY IF EXISTS "Admins can unhide users" ON public.hidden_users;
CREATE POLICY "Admins can unhide users"
  ON public.hidden_users FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- 3. Posting: hidden users may STILL comment.
--    Remove the old "not banned" restriction on INSERT.
DROP POLICY IF EXISTS "Users can post comments" ON public.course_comments;
CREATE POLICY "Users can post comments"
  ON public.course_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Reading: a comment from a hidden author is visible only to
--    admins and to the author themselves. Everyone else is filtered out.
DROP POLICY IF EXISTS "Anyone can read comments" ON public.course_comments;
DROP POLICY IF EXISTS "Read visible comments"     ON public.course_comments;
CREATE POLICY "Read visible comments"
  ON public.course_comments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
    OR NOT EXISTS (
      SELECT 1 FROM public.hidden_users h WHERE h.user_id = course_comments.user_id
    )
  );

-- ============================================================
-- DONE. Table comment_bans is now hidden_users.
-- Shadow-hide is enforced at the database level via RLS.
-- ============================================================
