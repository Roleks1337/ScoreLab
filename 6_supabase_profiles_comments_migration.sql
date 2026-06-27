-- ============================================================
-- ScoreLab — Profile Customization + Course Comments Migration
-- Run this in: Supabase Dashboard > SQL Editor
-- Run this AFTER 5_supabase_profiles_migration.sql
-- ============================================================

-- ============================================================
-- PART 1 — Extend the profiles table with customization fields
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name  TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT,
  ADD COLUMN IF NOT EXISTS banner_color  TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #0066ff 0%, #6aaee8 100%)',
  ADD COLUMN IF NOT EXISTS email_public  BOOLEAN NOT NULL DEFAULT false;

-- Seed display_name from the existing full_name where missing.
UPDATE public.profiles
SET display_name = COALESCE(display_name, full_name)
WHERE display_name IS NULL;

-- ============================================================
-- PART 2 — Public profile view
--   Exposes ONLY safe, public fields for every user so that
--   avatars / names / role badges can be shown next to comments.
--   Email is only revealed when the user opted in (email_public).
--   Role flags (is_admin / is_premium) are computed here so the
--   client never needs read access to the admins or subscriptions
--   tables. Views run with the definer's privileges, so this
--   bypasses RLS on the underlying tables in a controlled way.
-- ============================================================

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.id,
  COALESCE(p.display_name, p.full_name, split_part(p.email, '@', 1)) AS display_name,
  p.avatar_url,
  p.banner_color,
  p.created_at,
  CASE WHEN p.email_public THEN p.email ELSE NULL END AS email,
  EXISTS (
    SELECT 1 FROM public.admins a WHERE a.user_id = p.id
  ) AS is_admin,
  EXISTS (
    SELECT 1 FROM public.premium_subscriptions s
    WHERE s.user_id = p.id AND s.expires_at > now()
  ) AS is_premium
FROM public.profiles p;

-- Anyone (even logged-out visitors) may read public profile data.
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============================================================
-- PART 3 — Course comments
--   lesson_key uniquely identifies a single course episode,
--   e.g. 'matematyka/l2'. Each episode has its own thread.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_key  TEXT NOT NULL,
  course_id   TEXT NOT NULL,
  lesson_id   TEXT NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_comments_lesson_idx
  ON public.course_comments (lesson_key, created_at DESC);

ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 4 — Comment bans (GLOBAL: a banned user cannot comment anywhere)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comment_bans (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason     TEXT,
  banned_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.comment_bans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 5 — Comment reports (land in the admin panel)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comment_reports (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id  UUID NOT NULL REFERENCES public.course_comments(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'resolved'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS comment_reports_status_idx
  ON public.comment_reports (status, created_at DESC);

ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 6 — RLS policies
-- ============================================================

-- ---- course_comments ----------------------------------------------------

-- Everyone can read comments.
DROP POLICY IF EXISTS "Anyone can read comments" ON public.course_comments;
CREATE POLICY "Anyone can read comments"
  ON public.course_comments FOR SELECT
  USING (true);

-- Authenticated users may post as themselves, ONLY if not globally banned.
DROP POLICY IF EXISTS "Users can post comments" ON public.course_comments;
CREATE POLICY "Users can post comments"
  ON public.course_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM public.comment_bans b WHERE b.user_id = auth.uid()
    )
  );

-- Users can delete their own comments.
DROP POLICY IF EXISTS "Users can delete own comments" ON public.course_comments;
CREATE POLICY "Users can delete own comments"
  ON public.course_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can delete ANY comment.
DROP POLICY IF EXISTS "Admins can delete any comment" ON public.course_comments;
CREATE POLICY "Admins can delete any comment"
  ON public.course_comments FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
  );

-- ---- comment_bans -------------------------------------------------------

-- A user can see whether THEY are banned (so the UI can block posting).
DROP POLICY IF EXISTS "Users can read own ban" ON public.comment_bans;
CREATE POLICY "Users can read own ban"
  ON public.comment_bans FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all bans.
DROP POLICY IF EXISTS "Admins can read bans" ON public.comment_bans;
CREATE POLICY "Admins can read bans"
  ON public.comment_bans FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can ban (insert).
DROP POLICY IF EXISTS "Admins can ban users" ON public.comment_bans;
CREATE POLICY "Admins can ban users"
  ON public.comment_bans FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can unban (delete).
DROP POLICY IF EXISTS "Admins can unban users" ON public.comment_bans;
CREATE POLICY "Admins can unban users"
  ON public.comment_bans FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- ---- comment_reports ----------------------------------------------------

-- Authenticated users can file a report as themselves.
DROP POLICY IF EXISTS "Users can report comments" ON public.comment_reports;
CREATE POLICY "Users can report comments"
  ON public.comment_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Reporters can see their own reports (lets the UI confirm a report exists).
DROP POLICY IF EXISTS "Users can read own reports" ON public.comment_reports;
CREATE POLICY "Users can read own reports"
  ON public.comment_reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- Admins can read every report.
DROP POLICY IF EXISTS "Admins can read reports" ON public.comment_reports;
CREATE POLICY "Admins can read reports"
  ON public.comment_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can update a report's status (resolve/dismiss).
DROP POLICY IF EXISTS "Admins can update reports" ON public.comment_reports;
CREATE POLICY "Admins can update reports"
  ON public.comment_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- Admins can delete reports.
DROP POLICY IF EXISTS "Admins can delete reports" ON public.comment_reports;
CREATE POLICY "Admins can delete reports"
  ON public.comment_reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));

-- ============================================================
-- PART 7 — Avatars storage bucket + policies
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of avatar images.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- A user may upload only into a folder named after their own UID:
--   avatars/<auth.uid>/filename.png
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- DONE.  Tables: course_comments, comment_bans, comment_reports
--        View:   public_profiles
--        Bucket: avatars
-- ============================================================
