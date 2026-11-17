import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// The step before payment on the "המומחים" sales page: name, phone and e-mail go to the `leads` table (anyone may
// insert, only admins read; source = "hamumchim:<plan>"), and then the browser moves on to the Grow payment page.
// Saving the details never blocks the payment: if the insert fails, the visitor still reaches the payment page.

export type ExpertsPlan = "installments" | "single";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneDigits = (s: string) => s.replace(/[^\d]/g, "");

export function ExpertsLeadDialog({
  plan,
  location,
  payUrl,
  onClose,
}: {
  plan: ExpertsPlan | null;
  location: string;
  payUrl: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim().replace(/\s+/g, " ");
    const p = phoneDigits(phone);
    const m = email.trim().toLowerCase();
    if (n.length < 2) return setError("נא למלא שם מלא.");
    if (p.length < 9 || p.length > 13) return setError("נא למלא מספר טלפון תקין.");
    if (!EMAIL.test(m)) return setError("נא למלא כתובת אימייל תקינה.");
    setError(null);
    setBusy(true);
    try {
      const { error: err } = await supabase.from("leads").insert({ name: n.slice(0, 120), phone: p, email: m.slice(0, 200), source: `hamumchim:${plan ?? "installments"}` });
      if (err) console.error("lead not saved", err.message);
    } catch (err) {
      console.error("lead not saved", err);
    }
    trackEvent("experts_lead_submitted", { location, plan: plan ?? "installments" });
    window.location.href = payUrl;
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <Dialog open={plan !== null} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent dir="rtl" className="max-w-md text-right">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="font-display text-2xl text-primary">עוד רגע ונכנסים</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {plan === "single" ? "משאירים פרטים ועוברים לתשלום (תשלום אחד)." : "משאירים פרטים ועוברים לתשלום (עד 12 תשלומים ללא ריבית)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="mt-2 space-y-3" noValidate>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">שם מלא</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">טלפון</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className={`${field} text-right`} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">אימייל</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" dir="ltr" className={`${field} text-right`} />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-lg font-semibold text-accent-foreground shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {busy ? "מעבירים לתשלום…" : "המשך לתשלום"}
            {!busy && <ArrowLeft className="h-5 w-5" />}
          </button>
          <p className="text-center text-xs text-muted-foreground">הפרטים משמשים רק ליצירת קשר בנוגע לתוכנית. התשלום מתבצע בעמוד מאובטח של Grow.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
