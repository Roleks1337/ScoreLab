import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

/** A user's editable profile row (own account). */
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  banner_color: string | null;
  email_public: boolean;
  phone: string | null;
}

/** A public, read-only profile (anyone can see) — used next to comments. */
export interface PublicProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  banner_color: string | null;
  email: string | null;
  is_admin: boolean;
  is_premium: boolean;
}

export const DEFAULT_BANNER = 'linear-gradient(135deg, #0066ff 0%, #6aaee8 100%)';

export type UserRole = 'admin' | 'premium' | 'user';

/** Default banner per role (used when the user hasn't picked a custom one). */
export const ROLE_BANNER: Record<UserRole, string> = {
  admin:   'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  premium: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  user:    'linear-gradient(135deg, #0066ff 0%, #6aaee8 100%)',
};

/** Resolve the banner to display: the custom one, else the role default. */
export function effectiveBanner(
  bannerColor: string | null | undefined,
  role: UserRole,
): string {
  return bannerColor || ROLE_BANNER[role];
}

export interface UseProfileResult {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
  update: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
}

/**
 * Loads (and lets you update) the CURRENT user's own profile row.
 * RLS allows a user to read & update only their own row.
 */
export function useProfile(userId: string | undefined | null): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, full_name, avatar_url, banner_color, email_public, phone')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      // Keep banner_color as-is (null means "use the role default").
      setProfile(data as Profile);
    } else {
      setProfile(null);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!userId) return { error: 'Brak użytkownika' };
      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', userId);
      if (error) return { error: error.message };
      setProfile(prev => (prev ? { ...prev, ...patch } : prev));
      return { error: null };
    },
    [userId],
  );

  return { profile, loading, refresh: fetchProfile, update };
}

/**
 * Fetch several public profiles at once (for a list of comment authors).
 * Returns a map keyed by user id.
 */
export async function fetchPublicProfiles(
  ids: string[],
): Promise<Record<string, PublicProfile>> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  if (unique.length === 0) return {};

  const { data } = await supabase
    .from('public_profiles')
    .select('id, display_name, avatar_url, banner_color, email, is_admin, is_premium')
    .in('id', unique);

  const map: Record<string, PublicProfile> = {};
  (data ?? []).forEach((p: any) => {
    map[p.id] = p as PublicProfile;
  });
  return map;
}

export function roleOf(p: { is_admin?: boolean; is_premium?: boolean } | null | undefined): UserRole {
  if (p?.is_admin) return 'admin';
  if (p?.is_premium) return 'premium';
  return 'user';
}
