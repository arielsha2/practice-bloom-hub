import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

function csvEscape(v: string | null | undefined) {
  const s = (v ?? "").toString();
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

type Row = {
  id: string;
  display_name: string | null;
  email: string | null;
  mailing_list_consent: boolean;
  mailing_list_consent_at: string | null;
  created_at: string | null;
  used_mentor: boolean;
};

async function fetchRows(): Promise<Row[]> {
  // Every registered user — each gets an automatic 8-day mentor trial on signup,
  // so the full profiles table represents "everyone who got access to the mentor".
  const profilesRes = await supabase
    .from("profiles")
    .select("id, display_name, email, mailing_list_consent, mailing_list_consent_at, created_at")
    .not("email", "is", null);
  if (profilesRes.error) throw profilesRes.error;

  // Users who actually opened a mentor journey
  const journeysRes = await supabase
    .from("therapist_journeys")
    .select("user_id");
  if (journeysRes.error) throw journeysRes.error;
  const journeySet = new Set(
    (journeysRes.data || []).map((j: any) => j.user_id).filter(Boolean)
  );

  const rows: Row[] = (profilesRes.data || []).map((p: any) => ({
    id: p.id,
    display_name: p.display_name,
    email: p.email,
    mailing_list_consent: !!p.mailing_list_consent,
    mailing_list_consent_at: p.mailing_list_consent_at,
    created_at: p.created_at,
    used_mentor: journeySet.has(p.id),
  }));

  return rows.sort((a, b) => {
    const ad = a.mailing_list_consent_at || a.created_at || "";
    const bd = b.mailing_list_consent_at || b.created_at || "";
    return bd.localeCompare(ad);
  });
}

type Filter = "all" | "used" | "unused";

export function MailingListExport() {
  const [loading, setLoading] = useState<Filter | null>(null);
  const [counts, setCounts] = useState<{ total: number; used: number; unused: number; consented: number } | null>(null);

  async function loadCounts() {
    try {
      const rows = await fetchRows();
      const used = rows.filter((r) => r.used_mentor).length;
      setCounts({
        total: rows.length,
        used,
        unused: rows.length - used,
        consented: rows.filter((r) => r.mailing_list_consent).length,
      });
    } catch {
      // ignore — surfaced at download
    }
  }

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function download(filter: Filter) {
    setLoading(filter);
    try {
      const allRows = await fetchRows();
      const rows =
        filter === "used" ? allRows.filter((r) => r.used_mentor)
        : filter === "unused" ? allRows.filter((r) => !r.used_mentor)
        : allRows;
      const header = ["שם", "אימייל", "אישר דיוור", "תאריך אישור", "השתמש במנטור", "תאריך הרשמה"];
      const lines = [header.join(",")];
      for (const r of rows) {
        lines.push([
          csvEscape(r.display_name),
          csvEscape(r.email),
          csvEscape(r.mailing_list_consent ? "כן" : "לא"),
          csvEscape(r.mailing_list_consent_at),
          csvEscape(r.used_mentor ? "כן" : "לא"),
          csvEscape(r.created_at),
        ].join(","));
      }
      const csv = "\uFEFF" + lines.join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const suffix = filter === "used" ? "used-mentor" : filter === "unused" ? "not-used-mentor" : "all";
      a.download = `mailing-list-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`הורדו ${rows.length} אנשי קשר`);
    } catch (err: any) {
      toast.error(err?.message || "שגיאה בהורדת הרשימה");
    } finally {
      setLoading(null);
    }
  }

  const btn = (filter: Filter, label: string, variant: "default" | "outline" = "outline") => (
    <Button onClick={() => download(filter)} disabled={loading !== null} size="lg" variant={variant}>
      {loading === filter ? (
        <Loader2 className="w-4 h-4 animate-spin ml-2" />
      ) : (
        <Download className="w-4 h-4 ml-2" />
      )}
      {label}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" /> רשימת תפוצה — "על שפת הקליניקה"
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          כל המשתמשים שנרשמו לאתר (כולם מקבלים אוטומטית גישה למנטור). ניתן להוריד את הרשימה המלאה, או להפריד בין מי שהתחיל בפועל שיחה עם המנטור לבין מי שנרשם ולא השתמש.
          {counts && (
            <span className="block mt-1 text-foreground font-medium">
              סה״כ {counts.total} · השתמשו במנטור: {counts.used} · לא השתמשו: {counts.unused} · אישרו דיוור: {counts.consented}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {btn("all", `הורד הכל${counts ? ` (${counts.total})` : ""}`, "default")}
          {btn("used", `השתמשו במנטור${counts ? ` (${counts.used})` : ""}`)}
          {btn("unused", `לא השתמשו${counts ? ` (${counts.unused})` : ""}`)}
        </div>
      </CardContent>
    </Card>
  );
}
