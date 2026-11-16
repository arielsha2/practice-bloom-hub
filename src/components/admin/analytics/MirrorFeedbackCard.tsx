import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LETTER_TOOL } from "@/lib/toolFunnel";

// The therapists' own reflection at the end of the day-2 tool ("the mirror"): what was new or became clearer about
// their ideal client, and what would have helped them sharpen the mirror. Newest first, with the account name when
// the admin can read it. Rows come from challenge_tool_feedback (admin-only read policy).

interface Row {
  user_id: string;
  renewed: string | null;
  wish: string | null;
  updated_at: string;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

export function MirrorFeedbackCard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error: err } = await supabase
        .from("challenge_tool_feedback")
        .select("user_id, renewed, wish, updated_at")
        .eq("tool", LETTER_TOOL)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (err) setError(err.message);
      const list = (data as Row[]) ?? [];
      setRows(list);
      const ids = [...new Set(list.map((r) => r.user_id))];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
        setNames(Object.fromEntries(((profs as { id: string; display_name: string | null; email: string | null }[]) ?? []).map((p) => [p.id, p.display_name || p.email || ""])));
      }
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">המראה: מה המטפלים כתבו בסוף</CardTitle>
        <p className="text-sm text-muted-foreground">שתי השאלות בסוף המשימה של יום 2. התשובות הן רשות, ולכן לא כל מי שסיים מופיע כאן.</p>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">הנתונים לא נטענו: {error}</p>}
        {!rows ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">עוד אין תשובות.</p>
        ) : (
          <div className="max-h-[520px] space-y-3 overflow-y-auto">
            {rows.map((r) => (
              <div key={r.user_id} className="rounded-xl border bg-card p-4 text-right">
                <p className="text-xs text-muted-foreground">
                  {names[r.user_id] || "ללא שם"} · {when(r.updated_at)}
                </p>
                {r.renewed && (
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-medium">מה התחדש והתחדד: </span>
                    {r.renewed}
                  </p>
                )}
                {r.wish && (
                  <p className="mt-2 text-sm leading-relaxed">
                    <span className="font-medium">מה היה עוזר לדייק: </span>
                    {r.wish}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
