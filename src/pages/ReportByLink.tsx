import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { DiagnosisResultDialog } from "@/components/bots/DiagnosisResultDialog";
import { diagnosisFromOutput } from "@/lib/diagnosisOutput";

type State =
  | { kind: "loading" }
  | { kind: "ready"; name: string | null; output: Record<string, unknown> }
  | { kind: "expired" }
  | { kind: "missing" };

// The personal report link from the follow-up e-mail (/r/<token>): shows the stored diagnosis report without a login.
// The token is the only credential, so the address must not leak through the Referer header or into search results.
export default function ReportByLink() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "referrer";
    meta.content = "no-referrer";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.functions.invoke("diagnosis-report-view", { body: { token } });
      if (cancelled) return;
      if (error) {
        const status = (error as { context?: Response }).context?.status;
        setState({ kind: status === 410 ? "expired" : "missing" });
        return;
      }
      const output = data?.diagnosis_output as Record<string, unknown> | undefined;
      if (!output) {
        setState({ kind: "missing" });
        return;
      }
      setState({ kind: "ready", name: (data?.display_name as string | null) ?? null, output });
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const result = useMemo(() => (state.kind === "ready" ? diagnosisFromOutput(state.output) : null), [state]);

  return (
    <div dir="rtl" className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <SEOHead title="הדו״ח שלך | על שפת הקליניקה" description="דו״ח האבחון האישי שלך" canonicalUrl="https://therapykeys.co.il/" noindex />
      <div className="w-full max-w-md text-center space-y-5">
        <p className="text-sm text-muted-foreground">על שפת הקליניקה</p>

        {state.kind === "loading" && <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />}

        {state.kind === "ready" && result && (
          <>
            <FileText className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-2xl font-semibold">הדו״ח שלך מוכן</h1>
            <Button size="lg" onClick={() => setOpen(true)}>
              לצפייה בדו״ח
            </Button>
            <p className="text-sm text-muted-foreground">
              כדי לפתוח את הכלי שהאבחון המליץ עליו,{" "}
              <Link to="/auth?next=report&mode=login" className="underline">
                אפשר להתחבר לאתר
              </Link>
              .
            </p>
            <DiagnosisResultDialog
              open={open}
              onOpenChange={setOpen}
              result={result}
              isRTL
              displayName={state.name}
              hasPaidAccess={false}
              onContinue={() => navigate(`/ai-assistants/${result.recommendedTool}`)}
            />
          </>
        )}

        {state.kind === "expired" && (
          <>
            <h1 className="text-xl font-semibold">הקישור הזה כבר לא בתוקף</h1>
            <p className="text-sm text-muted-foreground">הדו״ח שלך עדיין שמור. אפשר להתחבר ולצפות בו.</p>
            <Button asChild>
              <Link to="/auth?next=report&mode=login">להתחברות והצגת הדו״ח</Link>
            </Button>
          </>
        )}

        {state.kind === "missing" && (
          <>
            <h1 className="text-xl font-semibold">לא מצאנו את הדו״ח</h1>
            <p className="text-sm text-muted-foreground">
              ייתכן שהקישור לא הועתק במלואו. אפשר להתחבר ולצפות בדו״ח מתוך האתר.
            </p>
            <Button asChild>
              <Link to="/auth?next=report&mode=login">להתחברות</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
