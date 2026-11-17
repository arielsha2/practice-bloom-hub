import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Who left details on the "המומחים" sales page before going on to payment (leads with source "hamumchim:<plan>").
// Leaving details is not paying: compare with the Grow payments to see who completed the purchase.

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string | null;
  created_at: string | null;
}

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const PLAN: Record<string, string> = { "hamumchim:installments": "תשלומים", "hamumchim:single": "תשלום אחד", "hamumchim:form": "בוחרים מסלול אחרי הטופס" };

export function ExpertsLeadsCard() {
  const [rows, setRows] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error: err } = await supabase
        .from("leads")
        .select("id, name, phone, email, source, created_at")
        .like("source", "hamumchim:%")
        .order("created_at", { ascending: false })
        .limit(500);
      if (err) setError(err.message);
      setRows((data as Lead[]) ?? []);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">המומחים: השאירו פרטים לפני תשלום</CardTitle>
        <p className="text-sm text-muted-foreground">כל מי שמילאה את הטופס בעמוד המכירה ועברה לעמוד התשלום. השארת פרטים היא עוד לא תשלום: מי שילמה בפועל רואים ב־Grow.</p>
      </CardHeader>
      <CardContent>
        {error && <p className="mb-3 text-sm text-destructive">הנתונים לא נטענו: {error}</p>}
        {!rows ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">עוד אין פניות.</p>
        ) : (
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-right text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">שם</th>
                  <th className="py-2 font-medium">טלפון</th>
                  <th className="py-2 font-medium">אימייל</th>
                  <th className="py-2 font-medium">מקור</th>
                  <th className="py-2 font-medium">מתי</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2" dir="ltr">{r.phone}</td>
                    <td className="py-2" dir="ltr">{r.email}</td>
                    <td className="py-2">{PLAN[r.source ?? ""] ?? r.source}</td>
                    <td className="py-2 text-muted-foreground">{when(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
