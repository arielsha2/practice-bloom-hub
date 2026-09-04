import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Stethoscope } from "lucide-react";
import type { AnalyticsPeriod } from "@/hooks/useAdminAnalytics";
import { periodToSince } from "@/lib/analyticsPeriod";

interface DiagnosisFunnelCardProps {
  /** Omit for all-time totals (e.g. on /admin/mentor); pass to scope both
   * numbers to the same rolling window as the rest of /admin/analytics. */
  period?: AnalyticsPeriod;
}

export function DiagnosisFunnelCard({ period }: DiagnosisFunnelCardProps = {}) {
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    void load();
  }, [period]);

  async function load() {
    setLoading(true);
    const since = period ? periodToSince(period) : null;

    // "started" counts distinct therapists, not raw conversation rows — a
    // therapist who retried the diagnosis a few times is one person, not
    // three. head:true row-counts don't dedupe, so this fetches the column
    // and dedupes client-side (fine at this scale, same approach StuckPointMap
    // already uses for its own tally).
    let convQuery = supabase.from("bot_conversations").select("user_id").eq("bot_key", "practice-diagnosis");
    if (since) convQuery = convQuery.gte("created_at", since);

    // "completed" needs the diagnosis's own completion timestamp, not the
    // journey row's updated_at (which moves whenever ANY tool on that
    // journey is touched, not just the diagnosis) — that timestamp lives in
    // reflection.tool_summaries["practice-diagnosis"].updated_at, written by
    // bot-extract-output. Fetched unfiltered and scoped client-side since
    // it's a JSONB path, not a column Postgres can .gte() directly.
    const journeyQuery = supabase
      .from("therapist_journeys")
      .select("reflection")
      .not("diagnosis_output", "is", null);

    const [{ data: conversations }, { data: journeys }] = await Promise.all([convQuery, journeyQuery]);

    const distinctStarters = new Set((conversations ?? []).map((c: any) => c.user_id)).size;
    const completedCount = (journeys ?? []).filter((j: any) => {
      if (!since) return true;
      const completedAt = j.reflection?.tool_summaries?.["practice-diagnosis"]?.updated_at;
      return typeof completedAt === "string" && completedAt >= since;
    }).length;

    setStarted(distinctStarters);
    setCompleted(completedCount);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const rate = started > 0 ? Math.round((completed / started) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-primary" />
          האבחון — כניסות והשלמות
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-semibold text-foreground">{started}</div>
            <div className="text-xs text-muted-foreground mt-1">התחילו שיחת אבחון</div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-foreground">{completed}</div>
            <div className="text-xs text-muted-foreground mt-1">קיבלו תוצאת אבחון</div>
          </div>
          <div>
            <div className="text-3xl font-semibold text-primary">{rate}%</div>
            <div className="text-xs text-muted-foreground mt-1">שיעור השלמה</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          "התחילו" סופר מטפלים ייחודיים שפתחו שיחת אבחון (לא כל ניסיון בנפרד); "השלימו" סופר מטפלים עם תוצאת אבחון שמורה כרגע — אם מטפל/ת חזר/ה על האבחון כמה פעמים, נשמרת רק התוצאה האחרונה.
        </p>
      </CardContent>
    </Card>
  );
}
