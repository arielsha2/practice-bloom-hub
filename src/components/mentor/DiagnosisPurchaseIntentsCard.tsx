import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, HandCoins } from "lucide-react";

interface PurchaseIntent {
  id: string;
  email: string | null;
  full_name: string | null;
  recommended_tool: string;
  purchase_type: "single_tool" | "full_mentor";
  language: string | null;
  clicked_at: string;
}

// Mirrors DiagnosisResultDialog's own tool labels — kept separate since one
// lives in the browser bundle and the other here, same reasoning as the
// bot-extract-output/frontend label-map split noted elsewhere in this codebase.
const TOOL_LABELS: Record<string, string> = {
  "niche-finder": "מציאת הנישה",
  "pricing-calculator": "מחשבון התמחור",
  "self-presentation": "הצגה עצמית",
  "contact-finder": "מציאת אנשי קשר להפניות",
  "connection-bridge": "גשר הקשר",
  "first-call-practice": "תרגול שיחת הטלפון הראשונה",
};

export function DiagnosisPurchaseIntentsCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PurchaseIntent[]>([]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("diagnosis_purchase_intents")
      .select("id, email, full_name, recommended_tool, purchase_type, language, clicked_at")
      .order("clicked_at", { ascending: false })
      .limit(100);
    setRows((data as PurchaseIntent[]) ?? []);
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
          <HandCoins className="w-5 h-5 text-primary" />
          מי לחץ "לקנות" — לפולו-אפ אישי
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין לחיצות רכישה מהאבחון.</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              כל שורה כאן היא ליד חם שלחץ על אחת מכפתורי הרכישה באבחון — שווה פנייה אישית תוך יום-יומיים.
            </p>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">תאריך</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">אימייל</TableHead>
                    <TableHead className="text-right">מה נלחץ</TableHead>
                    <TableHead className="text-right">כלי מומלץ</TableHead>
                    <TableHead className="text-right">שפה</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(r.clicked_at).toLocaleString("he-IL")}
                      </TableCell>
                      <TableCell className="text-sm">{r.full_name || "—"}</TableCell>
                      <TableCell className="text-sm" dir="ltr">{r.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={r.purchase_type === "full_mentor" ? "default" : "secondary"}>
                          {r.purchase_type === "full_mentor" ? "מסלול מלא" : "כלי בודד"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{TOOL_LABELS[r.recommended_tool] ?? r.recommended_tool}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.language === "en" ? "EN" : "HE"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
