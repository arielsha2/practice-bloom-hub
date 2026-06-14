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

export function MailingListExport() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  async function loadCount() {
    const { count: c, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("mailing_list_consent", true);
    if (error) return;
    setCount(c ?? 0);
  }

  useEffect(() => {
    loadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function download() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, email, mailing_list_consent_at, created_at")
      .eq("mailing_list_consent", true)
      .order("mailing_list_consent_at", { ascending: false });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    const rows = data || [];
    const header = ["שם", "אימייל", "תאריך אישור", "תאריך הרשמה"];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        csvEscape(r.display_name),
        csvEscape(r.email),
        csvEscape(r.mailing_list_consent_at),
        csvEscape(r.created_at),
      ].join(","));
    }
    // Prepend BOM so Excel reads Hebrew correctly
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
    setCount(rows.length);
    setLoading(false);
    toast.success(`הורדו ${rows.length} אנשי קשר`);
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
          הורדה של כל המשתמשים שאישרו הצטרפות לרשימת התפוצה (שם, אימייל, תאריך אישור).
          {count !== null && (
            <span className="block mt-1 text-foreground font-medium">
              {count} משתמשים מאושרים כרגע
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
