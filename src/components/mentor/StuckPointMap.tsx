import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Map } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  pricing_fear: "פחד מהעלאת מחיר",
  unclear_niche: "נישה לא ברורה",
  no_patients_despite_marketing: "אין מטופלים למרות שיווק",
  self_presentation_anxiety: "חשש מהצגה עצמית",
  referral_network_gap: "חוסר באנשי קשר / הפניות",
  confidence_in_value: "ספק בערך העצמי",
  time_or_capacity: "עומס / ניהול זמן",
  other: "אחר",
};

export function StuckPointMap() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<Array<{ category: string; count: number }>>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("stuck_point_events").select("category");
    const rows = (data ?? []) as Array<{ category: string }>;
    const tally = new Map<string, number>();
    rows.forEach((r) => tally.set(r.category, (tally.get(r.category) ?? 0) + 1));
    const sorted = [...tally.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
    setCounts(sorted);
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

  const maxCount = counts[0]?.count ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          מיפוי קשיים — כלל המטפלים
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">אין עדיין אירועי קושי מתויגים.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">מבוסס על {total} אירועים — מדגם קטן, לפרש בזהירות.</p>
            {counts.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground">{CATEGORY_LABELS[c.category] ?? c.category}</span>
                  <span className="font-medium text-muted-foreground">{c.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.max(4, (c.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
