import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageCircleHeart } from "lucide-react";

interface ConsultClick {
  id: string;
  email: string | null;
  full_name: string | null;
  kind: "report_opened" | "whatsapp" | "premium_form";
  recommended_tool: string | null;
  clicked_at: string;
}

const KIND_LABELS: Record<ConsultClick["kind"], string> = {
  report_opened: "פתח/ה את הדו״ח",
  whatsapp: "WhatsApp לאליענה",
  premium_form: "טופס התאמה לליווי",
};

// Opening the report is common and not a lead by itself; the two contact clicks are what to follow up on.
export function DiagnosisConsultClicksCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ConsultClick[]>([]);
  const [onlyContact, setOnlyContact] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("diagnosis_consult_clicks")
        .select("id, email, full_name, kind, recommended_tool, clicked_at")
        .order("clicked_at", { ascending: false })
        .limit(200);
      setRows((data as ConsultClick[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const shown = onlyContact ? rows.filter((r) => r.kind !== "report_opened") : rows;
  const opened = new Set(rows.filter((r) => r.kind === "report_opened").map((r) => r.email)).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleHeart className="w-5 h-5 text-primary" />
          מי פתח/ה את הדו״ח ומי פנה לאליענה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          {opened} אנשים שונים פתחו את הדו״ח מאז שהמעקב הופעל. ברירת המחדל מציגה רק פניות (WhatsApp וטופס).
        </p>
        <label className="flex items-center gap-2 text-xs mb-3">
          <input type="checkbox" checked={onlyContact} onChange={(e) => setOnlyContact(e.target.checked)} />
          הצג רק פניות
        </label>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין שורות להצגה.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">מה קרה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.clicked_at).toLocaleString("he-IL")}
                    </TableCell>
                    <TableCell className="text-sm">{r.full_name || "—"}</TableCell>
                    <TableCell className="text-sm" dir="ltr">{r.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.kind === "report_opened" ? "secondary" : "default"}>{KIND_LABELS[r.kind]}</Badge>
                    </TableCell>
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
