import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";
import type { AnalyticsPeriod } from "@/hooks/useAdminAnalytics";
import { periodToSince } from "@/lib/analyticsPeriod";

// Same fixed 8 values as mentor-analyze/practice-diagnosis's stuck_category —
// duplicated here rather than imported (this is a React app, not a shared
// module with the Deno edge functions), same reasoning as elsewhere in this
// codebase for this exact list.
const STUCK_CATEGORY_LABELS: Record<string, string> = {
  pricing_fear: "פחד מהעלאת מחיר",
  unclear_niche: "נישה לא ברורה",
  no_patients_despite_marketing: "אין מטופלים למרות שיווק",
  self_presentation_anxiety: "חשש מהצגה עצמית",
  referral_network_gap: "חוסר באנשי קשר / הפניות",
  confidence_in_value: "ספק בערך העצמי",
  time_or_capacity: "עומס / ניהול זמן",
  other: "אחר",
};

const BOTTLENECK_STAGE_LABELS: Record<string, string> = {
  reach: "לא מגיעים אליו בכלל (חשיפה)",
  inquiry_to_booking: "פונים, אבל לא נקבעת פגישה",
  booking_to_followthrough: "נקבעת פגישה, אבל לא מגיעים אליה",
  unclear: "לא ברור",
};

// Chronological order of the funnel itself (reach → booking → follow-through),
// not sorted by count — the whole point of this view is "where in the
// sequence does it break," so the order has to mirror the real-world sequence.
const STAGE_ORDER = ["reach", "inquiry_to_booking", "booking_to_followthrough", "unclear"] as const;

const AREA_LABELS: Record<string, string> = {
  "niche-finder": "נישה ובידול",
  "pricing-calculator": "תמחור",
  "self-presentation": "הצגה עצמית",
  "contact-finder": "רשת הפניות",
  "connection-bridge": "גישור קשר",
  "first-call-practice": "שיחת הטלפון הראשונה",
};

type Tally = { key: string; label: string; count: number };

function tally(values: string[], labels: Record<string, string>): Tally[] {
  const map = new Map<string, number>();
  values.forEach((v) => map.set(v, (map.get(v) ?? 0) + 1));
  return [...map.entries()]
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count }))
    .sort((a, b) => b.count - a.count);
}

function Bars({ rows, total }: { rows: Tally[]; total: number }) {
  const max = rows[0]?.count ?? 1;
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-foreground">{r.label}</span>
            <span className="font-medium text-muted-foreground">
              {r.count} · {total > 0 ? Math.round((r.count / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(4, (r.count / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DiagnosisStatsCardProps {
  /** Omit for all-time totals (e.g. on /admin/mentor); pass to scope the
   * breakdowns to the same rolling window as the rest of /admin/analytics. */
  period?: AnalyticsPeriod;
}

type StageBreakdown = {
  key: string;
  label: string;
  count: number;
  causes: Tally[];
};

export function DiagnosisStatsCard({ period }: DiagnosisStatsCardProps = {}) {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [byArea, setByArea] = useState<Tally[]>([]);
  const [stageBreakdown, setStageBreakdown] = useState<StageBreakdown[]>([]);

  useEffect(() => {
    void load();
  }, [period]);

  async function load() {
    setLoading(true);
    const since = period ? periodToSince(period) : null;
    const { data } = await supabase
      .from("therapist_journeys")
      .select("diagnosis_output, reflection")
      .not("diagnosis_output", "is", null);
    // Scoped client-side against reflection.tool_summaries's own completion
    // timestamp, same reasoning as DiagnosisFunnelCard — the journey row's
    // updated_at isn't specific to when the diagnosis itself completed.
    const rows = (data ?? [])
      .filter((r: any) => {
        if (!since) return true;
        const completedAt = r.reflection?.tool_summaries?.["practice-diagnosis"]?.updated_at;
        return typeof completedAt === "string" && completedAt >= since;
      })
      .map((r: any) => r.diagnosis_output)
      .filter(Boolean);

    const priorityAreas = rows
      .map((d: any) => d.recommended_tool)
      .filter(Boolean);

    // Chronological funnel-stage view: for each stage in real-world order,
    // how many therapists are stuck there, and — within just that stage —
    // what's actually causing the block. This is what tells the story of
    // *where* practices fail and *why*, instead of two disconnected lists.
    const breakdown = STAGE_ORDER.map((stageKey) => {
      const rowsAtStage = rows.filter((d: any) => d.bottleneck_stage === stageKey);
      const causes = rowsAtStage.map((d: any) => d.stuck_category).filter(Boolean);
      return {
        key: stageKey,
        label: BOTTLENECK_STAGE_LABELS[stageKey],
        count: rowsAtStage.length,
        causes: tally(causes, STUCK_CATEGORY_LABELS),
      };
    });

    setStageBreakdown(breakdown);
    setByArea(tally(priorityAreas, AREA_LABELS));
    setTotal(rows.length);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          האבחון — הקשיים המרכזיים
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">אין עדיין תוצאות אבחון.</p>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-muted-foreground">מבוסס על {total} אבחונים — מדגם קטן, לפרש בזהירות.</p>

            <div>
              <p className="text-xs font-semibold text-foreground mb-3">
                איפה בתהליך (חשיפה ← פגישה ← המשך טיפול) נופלים המטפלים, ומה הסיבה המרכזית בכל שלב
              </p>
              <div className="space-y-4">
                {stageBreakdown.map((stage, i) => {
                  const pctOfTotal = total > 0 ? Math.round((stage.count / total) * 100) : 0;
                  return (
                    <div key={stage.key} className="border-r-2 border-muted pr-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {i + 1}. {stage.label}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {stage.count} · {pctOfTotal}% מכלל האבחונים
                        </span>
                      </div>
                      {stage.count === 0 ? (
                        <p className="text-xs text-muted-foreground mt-1">אין מקרים בשלב זה.</p>
                      ) : (
                        <div className="mt-2 pr-2">
                          <p className="text-[11px] text-muted-foreground mb-1.5">הסיבה המרכזית לחסימה בשלב הזה:</p>
                          <Bars rows={stage.causes} total={stage.count} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-foreground mb-2">הכלי שהומלץ (החסם הכי דחוף שנמצא)</p>
              <Bars rows={byArea} total={total} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
