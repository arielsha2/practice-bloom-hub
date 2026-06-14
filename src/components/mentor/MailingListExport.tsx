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
  // 1. Everyone who consented
  const consentedRes = await supabase
    .from("profiles")
    .select("id, display_name, email, mailing_list_consent, mailing_list_consent_at, created_at")
    .eq("mailing_list_consent", true);
  if (consentedRes.error) throw consentedRes.error;

  // 2. Everyone who ever started using the mentor (has a journey row)
  const journeysRes = await supabase
    .from("therapist_journeys")
    .select("user_id");
  if (journeysRes.error) throw journeysRes.error;
  const journeyUserIds = Array.from(
    new Set((journeysRes.data || []).map((j: any) => j.user_id).filter(Boolean))
  );

  // Fetch profiles for journey users (chunked to avoid URL length limits)
  const journeyProfiles: any[] = [];
  const chunkSize = 100;
  for (let i = 0; i < journeyUserIds.length; i += chunkSize) {
    const chunk = journeyUserIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, mailing_list_consent, mailing_list_consent_at, created_at")
      .in("id", chunk);
    if (error) throw error;
    journeyProfiles.push(...(data || []));
  }

  const journeySet = new Set(journeyUserIds);
  const byId = new Map<string, Row>();

  for (const p of consentedRes.data || []) {
    byId.set(p.id, {
      id: p.id,
      display_name: p.display_name,
      email: p.email,
      mailing_list_consent: !!p.mailing_list_consent,
      mailing_list_consent_at: p.mailing_list_consent_at,
      created_at: p.created_at,
      used_mentor: journeySet.has(p.id),
    });
  }

  for (const p of journeyProfiles) {
    if (!byId.has(p.id)) {
      byId.set(p.id, {
        id: p.id,
        display_name: p.display_name,
        email: p.email,
        mailing_list_consent: !!p.mailing_list_consent,
        mailing_list_consent_at: p.mailing_list_consent_at,
        created_at: p.created_at,
        used_mentor: true,
      });
    } else {
      byId.get(p.id)!.used_mentor = true;
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const ad = a.mailing_list_consent_at || a.created_at || "";
    const bd = b.mailing_list_consent_at || b.created_at || "";
    return bd.localeCompare(ad);
  });
}

export function MailingListExport() {
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState<{ total: number; consented: number; legacy: number } | null>(null);

  async function loadCounts() {
    try {
      const rows = await fetchRows();
      const consented = rows.filter((r) => r.mailing_list_consent).length;
      setCounts({
        total: rows.length,
        consented,
        legacy: rows.length - consented,
      });
    } catch {
      // ignore — surfaced at download
    }
  }

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function download() {
    setLoading(true);
    try {
      const rows = await fetchRows();
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
      a.download = `mailing-list-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`הורדו ${rows.length} אנשי קשר`);
    } catch (err: any) {
      toast.error(err?.message || "שגיאה בהורדת הרשימה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" /> רשימת תפוצה — "על שפת הקליניקה"
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          כל מי שאישר דיוור או החל בעבר להשתמש במנטור. הקובץ כולל עמודה שמציינת האם המשתמש אישר דיוור.
          {counts && (
            <span className="block mt-1 text-foreground font-medium">
              סה״כ {counts.total} · אישרו דיוור: {counts.consented} · משתמשי מנטור ללא אישור: {counts.legacy}
            </span>
          )}
        </div>
        <Button onClick={download} disabled={loading} size="lg">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
          ) : (
            <Download className="w-4 h-4 ml-2" />
          )}
          הורד CSV
        </Button>
      </CardContent>
    </Card>
  );
}
