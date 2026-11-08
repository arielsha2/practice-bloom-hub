import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { trackEvent } from "@/lib/analytics";
import { resolveChallengeSource } from "@/lib/challengeSource";
import { CtaButton, OUTCOMES, RegistrationForm, useChallengeVisit } from "@/components/challenge/ChallengeShared";
import { Check } from "lucide-react";
import elianaPortrait from "@/assets/founders/eliana-portrait.jpg";

// Short invitation for members of the "על שפת הקליניקה" community, who already
// know Eliana: no pain story, testimonials or bio, straight to what the
// challenge is and the form. Same challenge, form and sign-ups table as
// /challenge; visitors without a ?src are tagged "community".
const HOW = [
  { big: "5 ימים", small: "15-19 בנובמבר, בכל יום ידע ותרגול מעשי" },
  { big: "קבוצה סגורה", small: "בווטסאפ, כדי שתוכל להתרכז בתוכן ולשתף אותי בפרטי" },
  { big: "סדנה חיה", small: "ביום רביעי, 18.11, החלק הכי חשוב באתגר" },
];

const ChallengeCommunity = () => {
  const [params] = useSearchParams();
  const [source] = useState(() => resolveChallengeSource(params) ?? "community");
  useChallengeVisit(source);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground font-body">
      <SEOHead
        title="הזמנה לקהילה: אתגר להיות מומחה מבוקש - עם אליענה שפירא"
        description="לחברי קהילת על שפת הקליניקה: אתגר חינמי של 5 ימים (15-19.11), ממטפל אנונימי למומחה מבוקש בתחומך."
        canonicalUrl="/challenge-community"
        ogImage="/og-challenge-v4.jpg"
      />

      {/* Hero */}
      <section className="band band-charcoal band-grain">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[150px]"
            style={{ background: "hsl(var(--accent) / 0.18)" }}
          />
          <div
            className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full blur-[150px]"
            style={{ background: "hsl(var(--primary) / 0.4)" }}
          />
        </div>
        <div className="container mx-auto px-4 pt-5 relative z-10 flex items-center justify-between gap-4">
          <span className="text-background/90 font-display text-lg">אליענה שפירא</span>
          <a
            href="#register"
            onClick={() => trackEvent("challenge_cta_click", { location: "community_top_bar" })}
            className="rounded-full border border-background/30 px-4 py-1.5 text-sm text-background/90 hover:bg-background/10 transition-colors"
          >
            להרשמה
          </a>
        </div>
        <div className="container mx-auto px-4 pt-10 pb-16 md:pt-14 md:pb-20 relative z-10">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="section-eyebrow">לחברי קהילת על שפת הקליניקה</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight text-background leading-[1.2] mb-6">
                יש לי הזמנה בשבילך
              </h1>
              <p className="text-xl md:text-2xl text-background/85 leading-relaxed mb-3">
                אתגר חינמי של 5 ימים: ממטפל אנונימי למומחה מבוקש בתחומך.
              </p>
              <p className="text-lg text-background/65 leading-relaxed mb-8">
                15-19 בנובמבר · קבוצת ווטסאפ סגורה · סדנה חיה ביום רביעי 18.11
              </p>
              <CtaButton label="כן, אני מצטרף" location="community_hero" />
            </div>
            <div className="relative max-w-xs mx-auto lg:max-w-sm w-full">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-[hsl(var(--terracotta)/0.5)]" />
              <img
                src={elianaPortrait}
                alt="אליענה שפירא"
                className="relative rounded-[2rem] w-full aspect-square object-cover shadow-[var(--shadow-elevated)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Personal note */}
      <section className="container mx-auto px-4 py-14 md:py-20 max-w-2xl text-center space-y-5">
        <p className="text-xl md:text-2xl leading-relaxed text-foreground/90">
          אתה כבר מכיר את הדרך שלי: שיווק מודע, שמחובר לערכים שלך ולא דורש ממך להיות מישהו אחר.
        </p>
        <p className="text-lg leading-relaxed text-foreground/80">
          באתגר הזה ריכזתי את הצעדים הכי מעשיים שלה, כדי שתצא מחמשת הימים עם דברים מוכנים ביד, ולא רק עם השראה.
        </p>
      </section>

      {/* Outcomes + how it works */}
      <section className="band band-burgundy band-grain">
        <div className="container mx-auto px-4 py-14 md:py-20 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-display text-center mb-8">מה תצא איתו בסוף האתגר</h2>
          <ul className="grid sm:grid-cols-2 gap-4 mb-12">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-5 py-4 text-lg">
                <Check className="w-5 h-5 shrink-0 text-[hsl(var(--terracotta))]" />
                {o}
              </li>
            ))}
          </ul>
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {HOW.map((s) => (
              <div key={s.big} className="rounded-2xl border border-primary-foreground/15 p-5">
                <p className="text-xl font-display text-[hsl(var(--terracotta))] mb-1">{s.big}</p>
                <p className="text-primary-foreground/80 leading-relaxed">{s.small}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration */}
      <section id="register" className="bg-secondary/60 scroll-mt-4">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-display text-primary mb-3">נתראה באתגר?</h2>
              <p className="text-lg text-foreground/80">
                ההרשמה ללא עלות. אחרי ההרשמה תקבל קישור לקבוצת הווטסאפ של האתגר.
              </p>
            </div>
            <div className="rounded-3xl bg-card p-6 md:p-8 shadow-[var(--shadow-elevated)] border border-border">
              <RegistrationForm source={source} />
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} אליענה שפירא · TherapyKeys
      </footer>
    </div>
  );
};

export default ChallengeCommunity;
