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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = decodeJwtPayload(token);
    if (!payload?.sub || (payload.exp && payload.exp * 1000 < Date.now())) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: payload.sub,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const body = await req.json().catch(() => ({}));
    const period = body.period ?? '30d';
    const days = periodToDays(period);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      profilesAll,
      profilesNew,
      profilesPaid,
      progressActive,
      botMsgsActive,
      qaActive,
      botConvs,
      botMsgsCount,
      lessonsWatched,
      qaCount,
      signupsSeries,
    ] = await Promise.all([
      admin.from('profiles').select('id, plan, trial_start_date, plan_updated_at, created_at, email, display_name', { count: 'exact' }),
      admin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', since),
      admin.from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'paid'),
      admin.from('user_lesson_progress').select('user_id').gte('last_watched_at', since),
      admin.from('bot_messages').select('conversation_id').gte('created_at', since),
      admin.from('qa_threads').select('user_id').gte('updated_at', since),
      admin.from('bot_conversations').select('id, bot_key, created_at').gte('created_at', since),
      admin.from('bot_messages').select('id', { count: 'exact', head: true }).gte('created_at', since),
      admin.from('user_lesson_progress').select('lesson_id, watched, last_watched_at').eq('watched', true).gte('last_watched_at', since),
      admin.from('qa_threads').select('id', { count: 'exact', head: true }).gte('created_at', since),
      admin.from('profiles').select('created_at').gte('created_at', since).order('created_at', { ascending: true }),
    ]);

    const allProfiles = profilesAll.data ?? [];
    const totalUsers = profilesAll.count ?? allProfiles.length;
    const newUsers = profilesNew.count ?? 0;
    const paidUsers = profilesPaid.count ?? 0;

    // Trial funnel
    const now = Date.now();
    let trialActive = 0, trialExpired = 0;
    for (const p of allProfiles) {
      if (p.plan === 'paid') continue;
      if (!p.trial_start_date) continue;
      const ends = new Date(p.trial_start_date).getTime() + 8 * 24 * 60 * 60 * 1000;
      if (ends > now) trialActive++;
      else trialExpired++;
    }
    const conversionRate = totalUsers > 0 ? Math.round((paidUsers / totalUsers) * 1000) / 10 : 0;

    // Recent paid conversions in period
    const recentPaid = allProfiles
      .filter(p => p.plan === 'paid' && p.plan_updated_at && p.plan_updated_at >= since)
      .sort((a, b) => (b.plan_updated_at ?? '').localeCompare(a.plan_updated_at ?? ''))
      .slice(0, 20)
      .map(p => ({ email: p.email, display_name: p.display_name, plan_updated_at: p.plan_updated_at }));

    // Active users (distinct union)
    const activeSet = new Set<string>();
    (progressActive.data ?? []).forEach((r: any) => activeSet.add(r.user_id));
    (qaActive.data ?? []).forEach((r: any) => activeSet.add(r.user_id));
    // bot_messages don't have user_id directly; map via conversation later. For approximation, include unique conv ids count as a proxy.
    const activeUsers = activeSet.size;

    // Bot usage by bot_key
    const botUsage = new Map<string, number>();
    (botConvs.data ?? []).forEach((c: any) => {
      botUsage.set(c.bot_key, (botUsage.get(c.bot_key) ?? 0) + 1);
    });
    const topBots = [...botUsage.entries()]
      .map(([bot_key, count]) => ({ bot_key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top lessons
    const lessonCounts = new Map<string, number>();
    (lessonsWatched.data ?? []).forEach((r: any) => {
      lessonCounts.set(r.lesson_id, (lessonCounts.get(r.lesson_id) ?? 0) + 1);
    });
    const topLessonIds = [...lessonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    let topLessons: { id: string; title: string; count: number }[] = [];
    if (topLessonIds.length > 0) {
      const { data: lessonRows } = await admin
        .from('lessons')
        .select('id, title')
        .in('id', topLessonIds.map(([id]) => id));
      const titleMap = new Map((lessonRows ?? []).map((l: any) => [l.id, l.title]));
      topLessons = topLessonIds.map(([id, count]) => ({
        id,
        title: titleMap.get(id) ?? id,
        count,
      }));
    }

    // Signups per day
    const signupsByDay = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      signupsByDay.set(key, 0);
    }
    (signupsSeries.data ?? []).forEach((r: any) => {
      const key = (r.created_at as string).slice(0, 10);
      if (signupsByDay.has(key)) signupsByDay.set(key, signupsByDay.get(key)! + 1);
    });
    const signups = [...signupsByDay.entries()]
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return new Response(
      JSON.stringify({
        period,
        kpis: {
          totalUsers,
          newUsers,
          activeUsers,
          paidUsers,
        },
        funnel: {
          trialActive,
          trialExpired,
          paid: paidUsers,
          conversionRate,
        },
        payments: {
          recent: recentPaid,
        },
        ai: {
          conversationsStarted: (botConvs.data ?? []).length,
          messagesCount: botMsgsCount.count ?? 0,
          topBots,
        },
        course: {
          lessonsWatched: (lessonsWatched.data ?? []).length,
          topLessons,
          qaQuestions: qaCount.count ?? 0,
        },
        signups,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('admin-analytics error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
