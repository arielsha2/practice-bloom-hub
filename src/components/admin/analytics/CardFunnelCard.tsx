import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { CARD_TOOL, type FunnelStep } from "@/lib/toolFunnel";

// Where people drop off on the way into the business-card exercise (rows written by logToolStep).
// Counts are distinct browsers, so one person on a phone and a computer counts twice.
const STEPS: { step: FunnelStep; label: string; note?: string }[] = [
  { step: "landed_signed_out", label: "פתחו את הלינק כשלא היו מחוברים", note: "נשלחו למסך ההרשמה" },
  { step: "auth_shown", label: "הגיעו למסך ההרשמה / הכניסה" },
  { step: "code_sent", label: "קיבלו קוד למייל" },
  { step: "code_send_failed", label: "שליחת הקוד נכשלה", note: "תקלה" },
  { step: "code_wrong", label: "הזינו קוד שגוי או שפג תוקפו", note: "תקלה" },
  { step: "signed_in", label: "השלימו את ההרשמה עם הקוד" },
  { step: "landed_signed_in", label: "נכנסו לתרגיל מחוברים", note: "כולל מי שכבר היה מחובר" },
  { step: "questions_shown", label: "התחילו את השאלות" },
  { step: "tool_done", label: "סיימו וקיבלו כרטיס" },
];

interface Row {
  step: string;
  visitor_id: string;
  created_at: string;
}

const israelDay = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });

export function CardFunnelCard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const { data, error: e } = await supabase
        .from("challenge_tool_funnel")
        .select("step, visitor_id, created_at")
        .eq("tool", CARD_TOOL)
        .order("created_at", { ascending: true })
        .limit(20000);
      if (e) setError(e.message);
      setRows((data as Row[]) ?? []);
    })();
  }, []);

  const today = israelDay(new Date().toISOString());
  const count = (step: string, onlyToday: boolean) =>
    new Set((rows ?? []).filter((r) => r.step === step && (!onlyToday || israelDay(r.created_at) === today)).map((r) => r.visitor_id)).size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-serif">המשפך לתרגיל כרטיס הביקור</CardTitle>
        <p className="text-sm text-muted-foreground">
          כמה אנשים הגיעו לכל שלב בדרך מהלינק של שיעורי הבית ועד הכרטיס. נספרים דפדפנים שונים (מי שנכנס גם מהטלפון וגם מהמחשב נספר פעמיים). הספירה התחילה ב־15.11.
        </p>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">הנתונים לא נטענו: {error}</p>}
        {!rows && !error && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {rows && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">שלב</TableHead>
                <TableHead className="text-center">היום</TableHead>
                <TableHead className="text-center">סה״כ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STEPS.map((s) => (
                <TableRow key={s.step} className={s.note === "תקלה" ? "text-destructive/90" : ""}>
                  <TableCell className="text-right">
                    {s.label}
                    {s.note && <span className="mr-2 text-xs text-muted-foreground">({s.note})</span>}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{count(s.step, true)}</TableCell>
                  <TableCell className="text-center tabular-nums">{count(s.step, false)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
