import { useEffect, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";

// The two steps before payment on the "המומחים" sales page:
// 1. name, phone and e-mail go to the `leads` table (anyone may insert, only admins read; source = "hamumchim:form");
// 2. the visitor chooses how to pay (installments or one payment) and the browser moves on to that Grow page.
// Saving the details never blocks the payment: if the insert fails, the visitor still reaches the choice and payment.
// The choice itself is not stored in `leads` (visitors cannot update rows); it is tracked as an analytics event, and
// Grow shows which link was paid.

export type ExpertsPlan = "installments" | "single";

export interface ExpertsPricing {
  installmentsUrl: string;
  singleUrl: string;
  price: string;
  priceSingle: string;
  installment: string;
  installments: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phoneDigits = (s: string) => s.replace(/[^\d]/g, "");

export function ExpertsLeadDialog({
  open,
  location,
  pricing,
  onClose,
}: {
  open: boolean;
  location: string;
  pricing: ExpertsPricing;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"details" | "choose">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [going, setGoing] = useState<ExpertsPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The step is kept between openings: a visitor who already left details in this visit goes straight to the choice.
  useEffect(() => {
    if (open) setGoing(null);
  }, [open]);

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
      const { error: err } = await supabase.from("leads").insert({ name: n.slice(0, 120), phone: p, email: m.slice(0, 200), source: "hamumchim:form" });
      if (err) console.error("lead not saved", err.message);
    } catch (err) {
      console.error("lead not saved", err);
    }
    trackEvent("experts_lead_submitted", { location });
    setBusy(false);
    setStep("choose");
  };

  const choose = (plan: ExpertsPlan) => {
    setGoing(plan);
    trackEvent("experts_plan_chosen", { location, plan });
    window.location.href = plan === "single" ? pricing.singleUrl : pricing.installmentsUrl;
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && !going && onClose()}>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-lg overflow-y-auto text-right">
        {step === "details" ? (
          <>
            <DialogHeader className="text-right sm:text-right">
              <DialogTitle className="font-display text-2xl text-primary">עוד רגע ונכנסים</DialogTitle>
              <DialogDescription className="text-base leading-relaxed">משאירים פרטים, ובשלב הבא בוחרים איך לשלם: בתשלום אחד או בתשלומים.</DialogDescription>
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
                {busy ? "שומרים…" : "המשך"}
                {!busy && <ArrowLeft className="h-5 w-5" />}
              </button>
              <p className="text-center text-xs text-muted-foreground">הפרטים משמשים רק ליצירת קשר בנוגע לתוכנית.</p>
            </form>
          </>
        ) : (
          <>
            <DialogHeader className="text-right sm:text-right">
              <DialogTitle className="font-display text-2xl text-primary">איך נוח לך לשלם?</DialogTitle>
              <DialogDescription className="text-base leading-relaxed">בוחרים מסלול, ועוברים לעמוד התשלום המאובטח של Grow.</DialogDescription>
            </DialogHeader>
            <div className="mt-2 grid gap-3">
              <button
                type="button"
                disabled={going !== null}
                onClick={() => choose("single")}
                className="group relative rounded-2xl border-2 border-accent bg-accent/5 p-5 text-right transition-colors hover:bg-accent/10 disabled:opacity-70"
              >
                <span className="absolute -top-3 start-4 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">חוסכים 500 ₪</span>
                <span className="block font-display text-xl text-primary">תשלום אחד</span>
                <span className="mt-1 block">
                  <strong className="font-display text-3xl text-primary">{pricing.priceSingle} ₪</strong>
                  <span className="ms-2 text-sm text-muted-foreground line-through">{pricing.price} ₪</span>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">מחיר מזומן, בתשלום אחד</span>
                <span className="mt-3 inline-flex items-center gap-1.5 font-semibold text-accent">
                  {going === "single" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {going === "single" ? "מעבירים לתשלום…" : "לתשלום אחד"}
                </span>
              </button>
              <button
                type="button"
                disabled={going !== null}
                onClick={() => choose("installments")}
                className="rounded-2xl border-2 border-border bg-card p-5 text-right transition-colors hover:border-primary/40 disabled:opacity-70"
              >
                <span className="block font-display text-xl text-primary">תשלומים</span>
                <span className="mt-1 block">
                  <strong className="font-display text-3xl text-primary">{pricing.installment} ₪</strong>
                  <span className="ms-2 text-base font-semibold text-primary">× {pricing.installments}</span>
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {pricing.installments} תשלומים שווים ללא ריבית (סך הכול {pricing.price} ₪)
                </span>
                <span className="mt-3 inline-flex items-center gap-1.5 font-semibold text-primary">
                  {going === "installments" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {going === "installments" ? "מעבירים לתשלום…" : "לתשלומים"}
                </span>
              </button>
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">כל המחירים כוללים מע"מ. התשלום מתבצע בעמוד מאובטח של Grow.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
