import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface AdminStatus {
  isAdmin: boolean;
  loading: boolean;
  refresh: () => void;
}

export function useAdmin(userId: string | undefined | null): AdminStatus {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAdmin = useCallback(async () => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  return { isAdmin, loading, refresh: fetchAdmin };
}

/**
 * Compute SHA-256 of a string using the Web Crypto API (browser-native, no deps).
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify the admin panel password against the stored hash.
 * Fetches the hash from Supabase and compares it to SHA-256(inputPassword).
 */
export async function verifyAdminPassword(userId: string, inputPassword: string): Promise<boolean> {
  try {
    const [inputHash, { data }] = await Promise.all([
      sha256(inputPassword),
      supabase
        .from('admins')
        .select('panel_password_hash')
        .eq('user_id', userId)
        .single(),
    ]);

    if (!data?.panel_password_hash) return false;
    return inputHash === data.panel_password_hash;
  } catch {
    return false;
  }
}
