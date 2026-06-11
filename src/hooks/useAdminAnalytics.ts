import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AnalyticsPeriod = '1d' | '7d' | '30d' | '90d';

export interface AnalyticsData {
  period: AnalyticsPeriod;
  kpis: { totalUsers: number; newUsers: number; activeUsers: number; paidUsers: number };
  funnel: { trialActive: number; trialExpired: number; paid: number; conversionRate: number };
  payments: { recent: { email: string | null; display_name: string | null; plan_updated_at: string | null }[] };
  ai: {
    conversationsStarted: number;
    messagesCount: number;
    topBots: { bot_key: string; count: number }[];
  };
  course: {
    lessonsWatched: number;
    topLessons: { id: string; title: string; count: number }[];
    qaQuestions: number;
  };
  signups: { date: string; count: number }[];
}

export function useAdminAnalytics(period: AnalyticsPeriod) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: invErr } = await supabase.functions.invoke('admin-analytics', {
        body: { period },
      });
      if (invErr) throw invErr;
      setData(res as AnalyticsData);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
