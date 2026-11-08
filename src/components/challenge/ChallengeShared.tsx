// Shared by the challenge landing pages (/challenge and the short community page):
// one registration form, one WhatsApp link, one visit counter, one challenge key.
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { challengeVisitorId, firstViewInTab, isRegistered, markRegistered, randomId } from "@/lib/challengeSource";
import { Check, Loader2, MessageCircle } from "lucide-react";

// One row per challenge run in challenge_registrations; change both when the
// next challenge opens so its sign-ups stay separate.
export const CHALLENGE_KEY = "anonymous-to-expert-2026-11";
export const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/KBJdNI4SqvUGrrxCkIEl5x";

export const OUTCOMES = [
  "הכרזת מומחיות",
  "תמונת פרופיל מקצועית",
  "משפט הצגה עצמית בשפת המטופל",
  "טקסט נקי ממילים מקטינות",
];

/** Records the page visit once per tab session (admin card: visits vs sign-ups). */
export function useChallengeVisit(source: string | null) {
  useEffect(() => {
    trackEvent("challenge_view", { challenge: CHALLENGE_KEY, source: source ?? "direct" });
    // One row per tab session, for the visits-vs-sign-ups card on the admin page.
    const visitorId = challengeVisitorId() ?? randomId();
    if (firstViewInTab(CHALLENGE_KEY)) {
      const row = { challenge_key: CHALLENGE_KEY, source, visitor_id: visitorId };
      void (async () => {
        let { error } = await supabase
          .from("challenge_page_views")
          .insert({ ...row, already_registered: isRegistered(CHALLENGE_KEY) });
        // Before migration 20261102120000 the column does not exist: keep
        // recording the visit without the flag rather than losing it.
        if (error?.message.includes("already_registered")) {
          ({ error } = await supabase.from("challenge_page_views").insert(row));
        }
        if (error) console.warn("challenge view not recorded", error.message);
      })();
    }
  }, [source]);
}

export function CtaButton({ label, location }: { label: string; location: string }) {
  return (
    <Button
      asChild
      size="xl"
      className="bg-[#ff6f61] hover:bg-[#ff5a4d] text-white shadow-lg w-full sm:w-auto whitespace-normal h-auto py-4 text-lg"
    >
      <a href="#register" onClick={() => trackEvent("challenge_cta_click", { location })}>
        {label}
      </a>
    </Button>
  );
}

export function RegistrationForm({ source }: { source: string | null }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    if (name.length < 2) return setError("נא למלא שם מלא");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError("כתובת המייל לא נראית תקינה");

    setStatus("sending");
    const { error: insertError } = await supabase.from("challenge_registrations").insert({
      challenge_key: CHALLENGE_KEY,
      full_name: name,
      email: mail,
      phone: null,
      source,
      marketing_consent: consent,
    });
    // 23505 = already registered with this email: still show the group link.
    if (insertError && insertError.code !== "23505") {
      setStatus("idle");
      setError("משהו השתבש בשליחה. אפשר לנסות שוב בעוד רגע.");
      return;
    }
    trackEvent("challenge_registered", { challenge: CHALLENGE_KEY, source: source ?? "direct" });
    trackMetaEvent("Lead", { content_name: CHALLENGE_KEY });
    markRegistered(CHALLENGE_KEY);
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="text-center space-y-5 py-4">
        <span className="icon-chip">
          <Check className="w-7 h-7" />
        </span>
        <h3 className="text-2xl md:text-3xl font-display text-primary">נרשמת לאתגר :)</h3>
        <p className="text-lg text-foreground/80 leading-relaxed">
          נשאר צעד אחד חשוב: להצטרף לקבוצת הווטסאפ הסגורה של האתגר.
          <br />
          שם יקרה הכל, ושם יישלחו הפרטים לסדנה החיה.
        </p>
        <Button
          asChild
          size="xl"
          className="bg-[#25D366] hover:bg-[#1ebe5a] text-white shadow-lg w-full sm:w-auto"
        >
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("challenge_whatsapp_click", { challenge: CHALLENGE_KEY })}
          >
            <MessageCircle className="w-5 h-5" />
            הצטרפות לקבוצת הווטסאפ
          </a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="ch-name">שם מלא <span className="text-accent">*</span></Label>
        <Input id="ch-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 text-base bg-background" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ch-email">מייל <span className="text-accent">*</span></Label>
        <Input id="ch-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 text-base bg-background text-right" />
      </div>
      <label className="flex items-start gap-2.5 text-sm text-foreground/75 cursor-pointer pt-1">
        <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" />
        <span>אשמח לקבל גם תכנים ועדכונים במייל (אפשר להסיר בכל עת)</span>
      </label>
      {error && <p className="text-sm text-destructive font-medium" role="alert">{error}</p>}
      <Button
        type="submit"
        size="xl"
        disabled={status === "sending"}
        className="w-full bg-[#ff6f61] hover:bg-[#ff5a4d] text-white shadow-lg text-lg h-auto py-4 whitespace-normal"
      >
        {status === "sending" ? <Loader2 className="w-5 h-5 animate-spin" /> : "כן, אני רוצה להיות מומחה מבוקש"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">האתגר ללא עלות</p>
    </form>
  );
}
