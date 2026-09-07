import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Flame } from "lucide-react";

interface LeadSignalRow {
  user_id: string;
  email: string | null;
  composite_score_v1: number;
  numbers_mentioned_count: number;
  urgency_phrase_count: number;
  emotional_intensity_count: number;
  computed_at: string;
}

export function DiagnosisLeadScoreCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LeadSignalRow[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("diagnosis_lead_signals")
      .select("user_id, email, composite_score_v1, numbers_mentioned_count, urgency_phrase_count, emotional_intensity_count, computed_at")
      .order("composite_score_v1", { ascending: false })
      .limit(15);
    setRows((data as LeadSignalRow[]) ?? []);
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
          <Flame className="w-5 h-5 text-primary" />
          לידים חמים לפי ניקוד (גרסה ניסיונית)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          ניקוד היוריסטי ראשוני — נבנה בלי אף המרה אמיתית לאמת מולה, ולכן עוד לא מכויל. ברגע שיהיו רכישות
          אמיתיות, שווה לבדוק אילו סימנים כאן באמת מנבאים רכישה ולעדכן את המשקלים בהתאם.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין עדיין נתונים.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">ניקוד</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">מספרים שהוזכרו</TableHead>
                  <TableHead className="text-right">שפת דחיפות</TableHead>
                  <TableHead className="text-right">עצימות רגשית</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.user_id}>
                    <TableCell className="font-semibold text-primary">{r.composite_score_v1}</TableCell>
                    <TableCell className="text-sm" dir="ltr">{r.email || "—"}</TableCell>
                    <TableCell className="text-sm">{r.numbers_mentioned_count}</TableCell>
                    <TableCell className="text-sm">{r.urgency_phrase_count}</TableCell>
                    <TableCell className="text-sm">{r.emotional_intensity_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
