import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";

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
  inquiry_to_conversation: "פונים, אבל לא מגיעים לשיחה",
  conversation_to_booking: "יש שיחה, אבל לא נקבעת פגישה",
  booking_to_followthrough: "נקבעת פגישה, אבל לא מגיעים אליה",
  unclear: "לא ברור",
};

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

export function DiagnosisStatsCard() {
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [byCategory, setByCategory] = useState<Tally[]>([]);
  const [byStage, setByStage] = useState<Tally[]>([]);
  const [byArea, setByArea] = useState<Tally[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("therapist_journeys")
      .select("diagnosis_output")
      .not("diagnosis_output", "is", null);
    const rows = (data ?? []).map((r: any) => r.diagnosis_output).filter(Boolean);

    const categories = rows.map((d: any) => d.stuck_category).filter(Boolean);
    const stages = rows.map((d: any) => d.bottleneck_stage).filter(Boolean);
    const priorityAreas = rows
      .map((d: any) => d.recommended_tool)
      .filter(Boolean);

    setByCategory(tally(categories, STUCK_CATEGORY_LABELS));
    setByStage(tally(stages, BOTTLENECK_STAGE_LABELS));
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
              <p className="text-xs font-semibold text-foreground mb-2">הכלי שהומלץ (החסם הכי דחוף שנמצא)</p>
              <Bars rows={byArea} total={total} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">איפה במשפך נמצא החסם</p>
              <Bars rows={byStage} total={total} />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">סיווג הקושי</p>
              <Bars rows={byCategory} total={total} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
