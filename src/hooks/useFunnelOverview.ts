import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { periodToDays } from '@/lib/analyticsPeriod';
import type { AnalyticsPeriod } from '@/hooks/useAdminAnalytics';

// Shape returned by the admin_funnel_overview SQL function (see
// supabase/migrations/20261011190000_admin_funnel_overview.sql). All counts are distinct users
// unless the field says otherwise.
export interface FunnelOverview {
  signups: number;
  signups_with_consent: number;
  list_total: number;
  started: number;
  reached_stage: { s1: number; s2: number; s3: number; s4: number };
  conversations_by_stage: Record<string, number>;
  got_report: number;
  clicked: number;
  clicked_single: number;
  clicked_full: number;
  purchases: {
    single_grow: number;
    single_paypal: number;
    full_meshulam: number;
    full_other: number;
    buyers: number;
  };
  recent_purchases: Array<{
    kind: 'single_tool' | 'full_mentor';
    via: string;
    at: string | null;
    email: string | null;
    display_name: string | null;
    tool: string | null;
  }>;
  silent_signups: { count: number; rows: Array<{ email: string | null; created_at: string }> };
  scores: {
    count: number;
    avg_overall: number | null;
    bands: Record<string, number>;
    areas: Array<{ area: string; avg: number; n: number }>;
    central: Array<{ area: string; n: number }>;
    repeaters: number;
    repeaters_avg_change: number | null;
  };
}

// List prices used for the revenue estimate (same numbers as DiagnosisResultDialog).
export const PRICES = { singleIls: 290, singleUsd: 97, fullIls: 750, fullUsd: 250 } as const;

export function estimateRevenue(p: FunnelOverview['purchases']) {
  // Known currency only: a full-Mentor purchase without a Meshulam transaction id is either PayPal ($)
  // or a manual grant, and cannot be told apart from the data, so it is counted but not priced.
  return {
    ils: p.single_grow * PRICES.singleIls + p.full_meshulam * PRICES.fullIls,
    usd: p.single_paypal * PRICES.singleUsd,
    unpricedFull: p.full_other,
  };
}

async function fetchWindow(since: string | null, until: string | null): Promise<FunnelOverview> {
  const { data, error } = await supabase.rpc('admin_funnel_overview', {
    p_since: since ?? undefined,
    p_until: until ?? undefined,
  });
  if (error) throw error;
  return data as unknown as FunnelOverview;
}

export function useFunnelOverview(period: AnalyticsPeriod) {
  const [current, setCurrent] = useState<FunnelOverview | null>(null);
  const [previous, setPrevious] = useState<FunnelOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const days = periodToDays(period);
      const now = Date.now();
      const since = new Date(now - days * 86_400_000).toISOString();
      const prevSince = new Date(now - 2 * days * 86_400_000).toISOString();
      // The previous window ends where the current one starts, so the two never overlap.
      const [cur, prev] = await Promise.all([fetchWindow(since, null), fetchWindow(prevSince, since)]);
      setCurrent(cur);
      setPrevious(prev);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    void load();
  }, [load]);

  return { current, previous, loading, error, reload: load };
}
