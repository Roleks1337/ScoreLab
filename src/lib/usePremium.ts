import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface PremiumStatus {
  isPremium: boolean;
  expiresAt: Date | null;
  daysLeft: number | null;
  loading: boolean;
  refresh: () => void;
}

export function usePremium(userId: string | undefined | null): PremiumStatus {
  const [isPremium, setIsPremium] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPremium = useCallback(async () => {
    if (!userId) {
      setIsPremium(false);
      setExpiresAt(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('expires_at')
      .eq('user_id', userId)
      .gt('expires_at', now)
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching premium status:', error);
      setIsPremium(false);
      setExpiresAt(null);
    } else if (data) {
      setIsPremium(true);
      setExpiresAt(new Date(data.expires_at));
    } else {
      setIsPremium(false);
      setExpiresAt(null);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPremium();
  }, [fetchPremium]);

  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return { isPremium, expiresAt, daysLeft, loading, refresh: fetchPremium };
}
