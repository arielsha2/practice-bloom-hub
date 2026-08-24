import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Stethoscope } from "lucide-react";

export function DiagnosisFunnelCard() {
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(0);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    // "started" counts distinct therapists, not raw conversation rows — a
    // therapist who retried the diagnosis a few times is one person, not
    // three. head:true row-counts don't dedupe, so this fetches the column
    // and dedupes client-side (fine at this scale, same approach StuckPointMap
    // already uses for its own tally).
    const [{ data: conversations }, { count: completedCount }] = await Promise.all([
      supabase
        .from("bot_conversations")
        .select("user_id")
        .eq("bot_key", "practice-diagnosis"),
      supabase
        .from("therapist_journeys")
        .select("id", { count: "exact", head: true })
        .not("diagnosis_output", "is", null),
    ]);
    const distinctStarters = new Set((conversations ?? []).map((c: any) => c.user_id)).size;
    setStarted(distinctStarters);
    setCompleted(completedCount ?? 0);
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
