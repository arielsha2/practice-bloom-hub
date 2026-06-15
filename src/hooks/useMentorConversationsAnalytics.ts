import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsPeriod } from './useAdminAnalytics';

export interface MentorConvMessage {
  role: string;
  content: string;
  [key: string]: any;
}

export interface MentorConvRow {
  id: string;
  user_id: string;
  email: string;
  date: string;
  stage: string;
  message_count: number;
  insight_count: number;
  messages: MentorConvMessage[];
}

export interface MentorConversationsData {
  summary: {
    totalConversations: number;
    weekConversations: number;
    avgLength: number;
    deepConversations: number;
    totalInsights: number;
  };
  lengthDistribution: { range: string; count: number }[];
  stageDistribution: { stage: string; count: number }[];
  conversations: MentorConvRow[];
}

export function useMentorConversationsAnalytics(period: AnalyticsPeriod) {
  const [data, setData] = useState<MentorConversationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: invErr } = await supabase.functions.invoke('admin-mentor-conversations', {
        body: { period },
      });
      if (invErr) throw invErr;
      setData(res as MentorConversationsData);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load mentor conversations');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
