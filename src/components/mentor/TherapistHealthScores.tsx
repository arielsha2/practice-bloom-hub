import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, TrendingUp, TrendingDown, Minus, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JourneyRow {
  user_id: string;
  health_score: number | null;
  score_breakdown: any;
  score_updated_at: string | null;
  score_history: any;
  completed_stages: string[] | null;
  stuck_points: string[] | null;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
}

const ALL_STAGES = ["niche", "self_presentation", "connection_bridge", "contact_finder", "pricing"];

function scoreColor(score: number) {
  if (score <= 40) return "bg-amber-400/90 text-amber-950";
  if (score <= 70) return "bg-teal text-white";
  return "bg-primary text-primary-foreground";
}

function scoreRingColor(score: number) {
  if (score <= 40) return "text-amber-500";
  if (score <= 70) return "text-teal";
  return "text-primary";
}

function getTrend(history: any, current: number) {
  if (!Array.isArray(history) || history.length < 2) return { delta: 0, dir: "flat" as const };
  const prev = history[history.length - 2];
  const prevScore = typeof prev === "number" ? prev : prev?.score ?? prev?.health_score ?? null;
  if (prevScore == null) return { delta: 0, dir: "flat" as const };
  const delta = current - Number(prevScore);
  return {
    delta,
    dir: delta > 0 ? ("up" as const) : delta < 0 ? ("down" as const) : ("flat" as const),
  };
}

export function TherapistHealthScores() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Array<JourneyRow & { profile?: ProfileRow }>>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data: journeys } = await supabase
      .from("therapist_journeys")
      .select("user_id, health_score, score_breakdown, score_updated_at, score_history, completed_stages, stuck_points")
      .order("health_score", { ascending: false, nullsFirst: false });

    const ids = (journeys || []).map((j: any) => j.user_id);
    let profilesById = new Map<string, ProfileRow>();
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ids);
      profilesById = new Map((profs || []).map((p: any) => [p.id, p]));
    }

    setRows(
      ((journeys || []) as JourneyRow[]).map((j) => ({
        ...j,
        profile: profilesById.get(j.user_id),
      }))
    );
    setLoading(false);
  }

  // Cohort summary
  const total = rows.length;
  const avg = total
    ? Math.round(rows.reduce((s, r) => s + (r.health_score ?? 0), 0) / total)
    : 0;
  const completedAll = rows.filter(
    (r) => ALL_STAGES.every((s) => (r.completed_stages ?? []).includes(s))
  ).length;

  const stuckCounts = new Map<string, number>();
  rows.forEach((r) =>
    (r.stuck_points ?? []).forEach((sp) =>
      stuckCounts.set(sp, (stuckCounts.get(sp) ?? 0) + 1)
    )
  );
  const bottleneck = [...stuckCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cohort summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ציון התקדמות ממוצע</p>
              <p className={cn("text-3xl font-bold mt-1", scoreRingColor(avg))}>{avg}</p>
              <p className="text-xs text-muted-foreground mt-1">על פני {total} מטפלים</p>
            </div>
            <Activity className={cn("w-10 h-10", scoreRingColor(avg))} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">השלימו את כל 5 השלבים</p>
              <p className="text-3xl font-bold mt-1 text-success">{completedAll}</p>
              <p className="text-xs text-muted-foreground mt-1">מתוך {total}</p>
            </div>
            <CheckCircle2 className="w-10 h-10 text-success" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">צוואר הבקבוק</p>
              <p
                className="text-lg font-bold mt-1 line-clamp-2 break-words"
                title={bottleneck?.[0] || ", "}
              >
                {bottleneck?.[0] || ", "}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {bottleneck ? `מופיע אצל ${bottleneck[1]} מטפלים` : "אין נתונים"}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-amber-500 shrink-0" />
          </CardContent>
        </Card>
      </div>

      {/* Therapist list */}
      <Card>
        <CardHeader>
          <CardTitle>ציוני התקדמות לפי מטפל ({total})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">אין מטפלים עם נתוני מסע עדיין</p>
          )}
          {rows.map((r) => {
            const score = r.health_score ?? 0;
            const bd = (r.score_breakdown ?? {}) as Record<string, any>;
            const groupA = Number(bd.group_a ?? bd.language_quality ?? 0);
            const groupC = Number(bd.group_c ?? bd.content_signals ?? 0);
            const trend = getTrend(r.score_history, score);
            const name = r.profile?.display_name || r.profile?.email || r.user_id.slice(0, 8);

            return (
              <div
                key={r.user_id}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{name}</p>
                    {r.profile?.email && r.profile?.display_name && (
                      <p className="text-xs text-muted-foreground truncate">{r.profile.email}</p>
                    )}
                    {r.score_updated_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        עודכן: {format(new Date(r.score_updated_at), "dd/MM/yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {trend.dir !== "flat" && (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          trend.dir === "up" ? "text-success" : "text-destructive"
                        )}
                      >
                        {trend.dir === "up" ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {trend.delta > 0 ? "+" : ""}
                        {trend.delta}
                      </span>
                    )}
                    {trend.dir === "flat" && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Minus className="w-4 h-4" />
                      </span>
                    )}
                    <Badge className={cn("text-base px-3 py-1", scoreColor(score))}>{score}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">איכות שפה (40%)</span>
                      <span className="font-medium">{Math.round(groupA)}</span>
                    </div>
                    <Progress value={Math.min(100, groupA)} animated={false} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">סיגנלים תכניים (35%)</span>
                      <span className="font-medium">{Math.round(groupC)}</span>
                    </div>
                    <Progress value={Math.min(100, groupC)} animated={false} className="h-2" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-3">
                  {(r.completed_stages ?? []).map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                  {(r.stuck_points ?? []).slice(0, 3).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs border-amber-500 text-amber-700">
                      תקוע: {s}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
