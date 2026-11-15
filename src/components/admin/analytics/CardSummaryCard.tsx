import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { CARD_TOOL } from "@/lib/toolFunnel";

// Business-card homework, from the start: registered → made a card → downloaded → pressed "send to Eliana".
// Made a card = anyone with a card event (every card records "viewed" as soon as it is shown, so this matches the
// cards themselves, which the admin cannot read directly). The viewing admin's own account is left out.
// Whether someone then pressed send inside WhatsApp cannot be known from the site.

interface EventRow {
  user_id: string;
  kind: string;
  created_at: string;
}

const israelDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : "–");

export function CardSummaryCard() {
  const [data, setData] = useState<{ registered: number; events: EventRow[]; clicks: { visitor_id: string; created_at: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      const [reg, ev, wa] = await Promise.all([
        supabase.from("challenge_registrations").select("id", { count: "exact", head: true }),
        supabase.from("deliverable_events").select("user_id, kind, created_at").eq("tool", CARD_TOOL).limit(20000),
        supabase.from("challenge_tool_funnel").select("visitor_id, created_at").eq("tool", CARD_TOOL).eq("step", "whatsapp_click").limit(20000),
      ]);
      const err = reg.error ?? ev.error ?? wa.error;
      if (err) setError(err.message);
      setData({
        registered: reg.count ?? 0,
        events: ((ev.data as EventRow[]) ?? []).filter((r) => r.user_id !== me),
        clicks: wa.data ?? [],
      });
    })();
  }, []);

  const today = israelDay(new Date().toISOString());
  const users = (rows: EventRow[], kind?: string, onlyToday = false) =>
    new Set(rows.filter((r) => (!kind || r.kind === kind) && (!onlyToday || israelDay(r.created_at) === today)).map((r) => r.user_id)).size;

  const made = data ? users(data.events) : 0;
  const downloaded = data ? users(data.events, "downloaded") : 0;
  const clicked = data ? new Set(data.clicks.map((c) => c.visitor_id)).size : 0;

  const tiles = data
    ? [
        { label: "נרשמו לאתגר", value: data.registered, sub: "" },
        { label: "הכינו כרטיס ביקור", value: made, sub: `${pct(made, data.registered)} מהנרשמים · היום ${users(data.events, undefined, true)}` },
        { label: "הורידו את הכרטיס", value: downloaded, sub: `${pct(downloaded, made)} ממי שהכין · היום ${users(data.events, "downloaded", true)}` },
        { label: "לחצו \"שליחת הכרטיס לאליענה\"", value: clicked, sub: `${pct(clicked, made)} ממי שהכין · נספר מ־15.11 בערב` },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">משימת כרטיס הביקור: סיכום</CardTitle>
        <p className="text-sm text-muted-foreground">
          מתחילת המשימה, בלי החשבון שלך. אם מישהו גם שלח בפועל בווטסאפ אי אפשר לדעת מהאתר (השליחה עצמה קורית בתוך ווטסאפ): את המספר האמיתי אפשר לספור בהודעות שהגיעו אלייך עם הקישור לכרטיס.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">חלק מהנתונים לא נטענו: {error}</p>}
        {!data ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-xl border bg-card p-4 text-right">
                <p className="text-sm text-muted-foreground">{t.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">{t.value}</p>
                {t.sub && <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
