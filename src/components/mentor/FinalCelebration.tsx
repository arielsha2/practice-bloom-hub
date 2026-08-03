import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Trophy, Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTherapistJourney } from "@/hooks/useTherapistJourney";
import { useLanguage } from "@/contexts/LanguageContext";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";
import { ContactDreamTable, type DreamContact } from "@/components/mentor/ContactDreamTable";
import { toast } from "sonner";

const STAGE_ORDER = ["niche", "pricing", "self-presentation", "network", "conversion"];

interface Section {
  title: string;
  body: string;
}

export function FinalCelebration() {
  const { isRTL } = useLanguage();
  const { journey } = useTherapistJourney();
  const navigate = useNavigate();
  const firedRef = useRef(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const completed = new Set(journey?.completed_stages ?? []);
  const allDone = STAGE_ORDER.every((s) => completed.has(s));

  // Fire confetti once when all stages complete
  useEffect(() => {
    if (!allDone || firedRef.current) return;
    firedRef.current = true;
    const fire = (origin: { x: number; y: number }, ratio: number) =>
      confetti({
        particleCount: Math.floor(200 * ratio),
        spread: 70,
        origin,
        colors: ["#4b0b24", "#9e5a38", "#c07a59", "#faf7f2"],
      });
    fire({ x: 0.2, y: 0.5 }, 0.4);
    fire({ x: 0.8, y: 0.5 }, 0.4);
    setTimeout(() => fire({ x: 0.5, y: 0.3 }, 0.5), 250);
  }, [allDone]);

  if (!allDone || !journey) return null;

  const niche: any = journey.niche_output ?? {};
  const sp: any = journey.self_presentation_output ?? {};
  const pricing: any = journey.pricing_output ?? {};
  const dreamContacts = (journey.contact_finder_output as unknown as DreamContact[] | null) ?? null;
  const tools: any = (journey.reflection as any)?.tool_summaries ?? {};

  const sections: Section[] = [];

  if (niche.ideal_client || niche.core_pain || niche.transformation) {
    sections.push({
      title: "המטופל האידיאלי",
      body: [
        niche.ideal_client && `מי: ${niche.ideal_client}`,
        niche.core_pain && `הכאב המרכזי: ${niche.core_pain}`,
        niche.transformation && `הטרנספורמציה: ${niche.transformation}`,
        niche.handshake_version && `ניסוח לחיצת יד: ${niche.handshake_version}`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (sp.story_version || sp.internal_pain || sp.external_pain) {
    sections.push({
      title: "ההצגה העצמית שלך",
      body: [
        sp.story_version,
        sp.internal_pain && `כאב פנימי: ${sp.internal_pain}`,
        sp.external_pain && `ביטוי בחיים: ${sp.external_pain}`,
        sp.desire && `הכמיהה: ${sp.desire}`,
        sp.result && `התוצאה: ${sp.result}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
  }

  // Contacts got a real structured deliverable (editable table) once
  // contact-finder started producing contact_finder_output — fall back to
  // the old prose summary only for journeys completed before that existed.
  const contactsSummary = tools["contact-finder"]?.summary;
  const hasDreamContacts = !!dreamContacts && dreamContacts.length > 0;
  if (!hasDreamContacts && contactsSummary) {
    sections.push({ title: "אנשי קשר ורשת מקצועית", body: contactsSummary });
  }

  const conversionSummary = tools["connection-bridge"]?.summary;
  const pricingSummary = tools["pricing-calculator"]?.summary;

  // Same fallback logic for pricing: prefer the computed structured numbers,
  // fall back to the old free-text summary for journeys completed earlier.
  const hasPricingOutput =
    pricing.recommended_rate != null || pricing.comfort_range_low != null || pricing.comfort_range_high != null;
  if (hasPricingOutput) {
    const body = [
      pricing.comfort_range_low != null && pricing.comfort_range_high != null
        ? `טווח הנוחות שלך: ${pricing.comfort_range_low}–${pricing.comfort_range_high} ש"ח`
        : null,
      pricing.recommended_rate != null && `התעריף המומלץ: ${pricing.recommended_rate} ש"ח`,
      pricing.target_clients_per_week != null && `יעד: ${pricing.target_clients_per_week} מטופלים בשבוע`,
      pricing.monthly_income != null && `הכנסה חודשית משוערת: ${Number(pricing.monthly_income).toLocaleString()} ש"ח`,
      pricing.annual_income != null && `הכנסה שנתית משוערת: ${Number(pricing.annual_income).toLocaleString()} ש"ח`,
    ]
      .filter(Boolean)
      .join("\n");
    sections.push({ title: "התמחור שלך", body });
  } else if (pricingSummary) {
    sections.push({ title: "התמחור שלך", body: pricingSummary });
  }
  if (conversionSummary) sections.push({ title: "שיחת היכרות וסגירה", body: conversionSummary });

  // Generate outreach text from the data we have
  const outreach = (() => {
    const handshake = niche.handshake_version || (niche.ideal_client ? `אני עוזר ל${niche.ideal_client}` : "");
    if (!handshake) return null;
    const lines = [
      "שלום [שם], נעים מאוד.",
      handshake + (niche.transformation ? ` ${niche.transformation}.` : "."),
      sp.story_version ? "" : "",
      "אשמח להכיר ולבדוק אם יש לנו במה לשתף פעולה, האם נוח לך לשיחה קצרה השבוע?",
      "תודה,",
      "[השם שלך]",
    ].filter(Boolean);
    return lines.join("\n");
  })();

  if (outreach) {
    sections.push({ title: "ניסוח פנייה לאנשי קשר", body: outreach });
  }

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("הועתק");
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <motion.div
      dir={isRTL ? "rtl" : "ltr"}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto mt-8 mb-4"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-mentor-accent/40 bg-gradient-to-br from-mentor-accent/15 via-card to-primary/10 p-8 md:p-10 shadow-2xl">
        <div aria-hidden className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-mentor-accent/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-mentor-accent to-primary text-white shadow-xl mb-4"
          >
            <Trophy className="w-10 h-10" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-serif font-semibold text-foreground mb-2">
            השלמת את המסע 🎉
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-mentor-accent" />
            הנה הסיכום של כל מה שעלה, שלך לשמור, להעתיק ולהשתמש.
          </p>
        </div>

        <div className="relative space-y-5">
          {sections.map((s) => (
            <div
              key={s.title}
              className="bg-card/80 backdrop-blur border border-mentor-border/60 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-serif font-semibold text-lg text-foreground">{s.title}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => copy(s.title, s.body)}
                >
                  {copiedKey === s.title ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="ms-1">{copiedKey === s.title ? "הועתק" : "העתק"}</span>
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-foreground/85 font-sans leading-relaxed">
                {s.body}
              </pre>
            </div>
          ))}

          {hasDreamContacts && <ContactDreamTable contacts={dreamContacts as DreamContact[]} />}

          {sections.length === 0 && !hasDreamContacts && (
            <p className="text-center text-sm text-muted-foreground">
              סיימת את כל התחנות. שוחח/י עם המנטור כדי לאסוף את הסיכומים שלך.
            </p>
          )}

          {/* Coming soon, personalized website builder teaser */}
          <WebsiteComingSoonCard className="mt-2" />
        </div>
      </div>
    </motion.div>
  );
}
