import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MailCheck, Download } from "lucide-react";

interface CompleterRow {
  email: string;
  display_name: string | null;
  recommended_tool: string | null;
  finished_on: string;
  has_report: boolean;
  clicked_buy: boolean;
}

// Same six areas as the tools; the label is what the follow-up emails say ({{area_hebrew}}).
const AREA_LABELS: Record<string, string> = {
  "niche-finder": "מציאת הנישה",
  "pricing-calculator": "מחשבון התמחור",
  "self-presentation": "הצגה עצמית",
  "contact-finder": "מציאת אנשי קשר להפניות",
  "connection-bridge": "גשר הקשר",
  "first-call-practice": "תרגול שיחת הטלפון הראשונה",
};

// A usable first name for "שלום {{first_name}}": the first word when it looks like a name, otherwise empty
// (initials, e-mail addresses and one-letter display names would read badly in a greeting).
function firstName(displayName: string | null): string {
  const word = (displayName ?? "").trim().split(/\s+/)[0] ?? "";
  return word.length >= 2 && !word.includes("@") && /^[\u0590-\u05FFA-Za-z'"-]+$/.test(word) ? word : "";
}

function toCsv(rows: CompleterRow[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["email", "first_name", "display_name", "recommended_tool", "area_hebrew", "finished_on", "has_report", "version", "clicked_buy"];
  const lines = rows.map((r) =>
    [
      r.email,
      firstName(r.display_name),
      r.display_name ?? "",
      r.recommended_tool ?? "",
      AREA_LABELS[r.recommended_tool ?? ""] ?? "",
      r.finished_on,
      r.has_report ? "yes" : "no",
      // A = has the official report (finished after it launched), B = older run without it
      r.has_report ? "A" : "B",
      r.clicked_buy ? "yes" : "",
    ].map(esc).join(","),
  );
  // BOM so Excel opens the Hebrew correctly
  return "﻿" + [header.map(esc).join(","), ...lines].join("\r\n");
}

// The addresses are never shown on screen: this card only counts and offers the download, so the list goes
// straight from the database to the admin's file without sitting on the page.
export function DiagnosisFollowupListCard() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CompleterRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error: loadError } = await supabase.rpc("admin_diagnosis_completers");
      if (loadError) setError(loadError.message);
      setRows((data as CompleterRow[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  function downloadCsv() {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnosis-followup-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const withReport = rows.filter((r) => r.has_report).length;
  const clicked = rows.filter((r) => r.clicked_buy).length;
  const byArea = new Map<string, number>();
  for (const r of rows) {
    const label = AREA_LABELS[r.recommended_tool ?? ""] ?? "לא ידוע";
    byArea.set(label, (byArea.get(label) ?? 0) + 1);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <MailCheck className="w-5 h-5 text-primary" />
          רשימה למעקב אחרי אבחון
        </CardTitle>
        {rows.length > 0 && (
          <Button variant="outline" size="sm" onClick={downloadCsv} className="gap-1.5">
            <Download className="w-4 h-4" />
            הורדה לאקסל
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">שגיאה: {error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין כרגע מי שסיים אבחון, אישר דיוור ולא קנה.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              מי שסיים אבחון, אישר דיוור ועדיין לא קנה. הכתובות לא מוצגות כאן, רק בקובץ.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">ברשימה</p>
                <p className="text-2xl font-semibold">{rows.length}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">עם דו"ח רשמי (גרסה A)</p>
                <p className="text-2xl font-semibold">{withReport}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">גרסה ישנה (גרסה B)</p>
                <p className="text-2xl font-semibold">{rows.length - withReport}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">לחצו על רכישה</p>
                <p className="text-2xl font-semibold">{clicked}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2">לפי התחום שעלה</p>
              <div className="flex flex-wrap gap-2">
                {[...byArea.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => (
                  <span key={label} className="rounded-full bg-secondary px-3 py-1 text-xs">
                    {label}: {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
