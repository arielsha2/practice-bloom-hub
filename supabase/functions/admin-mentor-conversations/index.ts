import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function periodToDays(p: string): number {
  switch (p) {
    case '1d': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJwtPayload(token);
    if (!payload?.sub || (payload.exp && payload.exp * 1000 < Date.now())) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401,
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: payload.sub, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const period = body.period ?? '30d';
    const days = periodToDays(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all conversations for stats (lightweight: no messages)
    const { data: allConvs } = await admin
      .from('mentor_conversations')
      .select('id, user_id, stage, insight_count, started_at, updated_at, messages');

    const all = allConvs ?? [];
    const totalConversations = all.length;
    const weekConversations = all.filter(c => (c.updated_at ?? c.started_at) >= weekAgo).length;

    const lengthOf = (c: any) => Array.isArray(c.messages) ? c.messages.length : 0;
    const totalMessages = all.reduce((s, c) => s + lengthOf(c), 0);
    const avgLength = totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;
    const deepConversations = all.filter(c => lengthOf(c) >= 15).length;
    const totalInsights = all.reduce((s, c) => s + (c.insight_count ?? 0), 0);

    // Length distribution
    const buckets = { '1-5': 0, '6-10': 0, '11-15': 0, '15+': 0 };
    for (const c of all) {
      const n = lengthOf(c);
      if (n >= 1 && n <= 5) buckets['1-5']++;
      else if (n <= 10) buckets['6-10']++;
      else if (n <= 15) buckets['11-15']++;
      else if (n > 15) buckets['15+']++;
    }
    const lengthDistribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    // Stage distribution
    const stageKeys = ['niche', 'pricing', 'contacts', 'practice', 'pitch'];
    const stageCounts = new Map<string, number>(stageKeys.map(k => [k, 0]));
    for (const c of all) {
      const s = (c.stage ?? '').toLowerCase();
      if (stageCounts.has(s)) stageCounts.set(s, (stageCounts.get(s) ?? 0) + 1);
    }
    const stageDistribution = stageKeys.map(stage => ({ stage, count: stageCounts.get(stage) ?? 0 }));

    // Table: filter by period
    const filtered = all.filter(c => (c.updated_at ?? c.started_at) >= since);
    const userIds = [...new Set(filtered.map(c => c.user_id).filter(Boolean))];
    let emailMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds);
      emailMap = new Map((profiles ?? []).map((p: any) => [p.id, p.email ?? p.display_name ?? '']));
    }

    const conversations = filtered
      .map(c => ({
        id: c.id,
        user_id: c.user_id,
        email: emailMap.get(c.user_id) ?? '',
        date: c.updated_at ?? c.started_at,
        stage: c.stage ?? '',
        message_count: lengthOf(c),
        insight_count: c.insight_count ?? 0,
        messages: c.messages ?? [],
      }))
      .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

    return new Response(JSON.stringify({
      summary: { totalConversations, weekConversations, avgLength, deepConversations, totalInsights },
      lengthDistribution,
      stageDistribution,
      conversations,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('admin-mentor-conversations error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
});
