import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { resolveChallengeSource } from "@/lib/challengeSource";
import { Check, Quote, Loader2, MessageCircle } from "lucide-react";
import elianaPortrait from "@/assets/founders/eliana-portrait.jpg";

// One row per challenge run in challenge_registrations; change both when the
// next challenge opens so its sign-ups stay separate.
const CHALLENGE_KEY = "anonymous-to-expert-2026-11";
const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/HXhgZGw2g6pF2rusCfEcgr?s=sw&p=i&mlu=4&ilr=4";

const DISCOVER = [
  {
    title: "איך להפסיק לפספס הזדמנויות!",
    text: "לקבל יותר פניות מתאימות, של מטופלים שאתה רוצה לעבוד איתם, כי יהיה לך ברור מה הם צריכים לדעת עליך ולהרגיש כלפיך כדי שירצו לעבוד איתך.",
  },
  {
    title: "איך לשדר את המומחיות שלך באופן אותנטי,",
    text: 'שיוצר חיבור, הערכה ורצון לעבוד איתך, בלי "למכור" ובלי להרגיש שהתפשרת על המקצועיות שלך.',
  },
  {
    title: "איך להימנע מטעויות נפוצות של מטפלים",
    text: "שיוצרות ריחוק במקום חיבור.",
  },
  {
    title: "איך להשתמש באותם עקרונות בכל מקום",
    text: "בפוסטים, בפנייה לאנשי קשר ובכל שיחה ששואלים אותך מה אתה עושה, כדי שמטופלים מתאימים ירגישו את החיבור אליך הרבה לפני שהם נכנסים לקליניקה.",
  },
];

const OUTCOMES = [
  "הכרזת מומחיות",
  "תמונת פרופיל מקצועית",
  "משפט הצגה עצמית בשפת המטופל",
  "טקסט נקי ממילים מקטינות",
];

const FOR_YOU = [
  'ברור לך שיש לך את היכולת והכישרון המקצועי, וגם השקעת בזה המון, אבל כל מה שקשור ל"שיווק" מרתיע ומלחיץ, וחשוב לך להביא מטופלים באופן אותנטי ונעים שמכבד אותך ואת המטופלים שלך.',
  "כל פעם מחדש שמתעניין שפנה אליך נעלם ולא ממשיך לטיפול, משהו בביטחון שלך נסדק, ותחושת הדחייה הזו צובטת ואולי גם מערערת את תחושת המקצועיות שלך.",
  "יש לך תחושה שעוד לא פיצחת איך מטפלים לא יותר מוכשרים ממך מחזיקים קליניקה מלאה ותור המתנה, כשאצלך משהו עדיין מרגיש תקוע.",
];

const TESTIMONIALS = [
  {
    text: "התהליך שעברתי היה באמת תהליך מאוד משמעותי, מאוד עמוק, קיבלתי המון ידע וכלים. היום מגיעים לקליניקה באמת מטופלים שאני רוצה לעבוד איתם, שאני שמחה לעבוד איתם, שהם טובים ומדויקים למה שאני רוצה לתת בעולם. אני יכולה להגיד שזה הקפיץ אותי בעשרות אחוזים. אם אני חושבת על עצמי חמישה חודשים אחורה, הייתי במקום אחר לגמרי, מדשדשת שם במחשבות של איך ואיפה. והיום אני עם הרבה פחות פחד, עם הרבה ידע איך לעשות את זה נכון, איך לשווק את זה נכון, איך לתמחר נכון.",
    by: "מטפלת שליוויתי",
  },
  {
    text: "אליענה ואריאל ממש נגעו במחסומים הרגשיים ובחלקים שעוצרים אותנו מבפנים. אני רואה את עצמי מאז שסיימתי את התוכנית, כותבת, מפרסמת ומקבלת משובים באמת חמים ומרגשים שלא חלמתי. את מגיעה לאנשים, אנשים מכירים אותך... מדהים, מדהים, מדהים.",
    by: "משתתפת בתוכנית",
  },
];

function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972")) digits = "0" + digits.slice(3);
  return /^0\d{8,9}$/.test(digits) ? digits : null;
}

function CtaButton({ label, location }: { label: string; location: string }) {
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

function RegistrationForm({ source }: { source: string | null }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = fullName.trim();
    const mail = email.trim().toLowerCase();
    const tel = phone.trim() ? normalizePhone(phone) : null;
    if (name.length < 2) return setError("נא למלא שם מלא");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return setError("כתובת המייל לא נראית תקינה");
    if (phone.trim() && !tel) return setError("מספר הטלפון לא נראה תקין");

    setStatus("sending");
    const { error: insertError } = await supabase.from("challenge_registrations").insert({
      challenge_key: CHALLENGE_KEY,
      full_name: name,
      email: mail,
      phone: tel,
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
      <div className="space-y-1.5">
        <Label htmlFor="ch-phone">טלפון <span className="text-muted-foreground font-normal">(לא חובה)</span></Label>
        <Input id="ch-phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-base bg-background text-right" />
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

const ChallengeLanding = () => {
  const [params] = useSearchParams();
  const [source] = useState(() => resolveChallengeSource(params));

  useEffect(() => {
    trackEvent("challenge_view", { challenge: CHALLENGE_KEY, source: source ?? "direct" });
  }, [source]);

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground font-body">
      <SEOHead
        title="אתגר חינמי: ממטפל אנונימי למומחה מבוקש בתחומך | TherapyKeys"
        description="אתגר חינמי של 3 ימים (9-11.11) למטפלים, יועצים ומאמנים שרוצים קליניקה מלאה ומבוקשת, בדרך אותנטית שמכבדת את המקצועיות שלהם. עם אליענה שפירא."
        canonicalUrl="/challenge"
        ogImage="/og-image.jpg"
      />

      <Header />

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
        <div className="container mx-auto px-4 pt-28 pb-16 md:pt-36 md:pb-24 relative z-10">
          <div className="grid lg:grid-cols-[1.25fr_1fr] gap-10 lg:gap-14 items-center">
            <div>
              <p className="section-eyebrow">הזמנה לאתגר חינמי · 3 ימים · 9-11 בנובמבר</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display tracking-tight text-background leading-[1.2] mb-6">
                ממטפל אנונימי
                <br />
                למומחה מבוקש בתחומך!
              </h1>
              <p className="text-xl md:text-2xl text-background/85 leading-relaxed mb-4">
                כזה שמעריכים את המומחיות שלו, ממליצים עליו ופונים אליו כל הזמן.
              </p>
              <p className="text-lg text-background/65 leading-relaxed mb-8 max-w-xl">
                למטפלים, יועצים ומאמנים, אנשי מקצוע רציניים שרוצים קליניקה מלאה ומבוקשת, בדרך אותנטית שמכבדת את המקצועיות שלהם.
              </p>
              <CtaButton label="כן! אני מצטרף לאתגר" location="hero" />
            </div>
            <div className="relative max-w-sm mx-auto lg:max-w-none w-full">
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

      {/* The empty room */}
      <section className="band band-burgundy band-grain">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl text-center">
          <p className="text-xl md:text-2xl leading-loose text-primary-foreground/85">
            הכנת את הכל.
            <br />
            את החדר המזמין, הקליניקה המוארת, הכורסאות הנוחות.
            <br />
            כל הידע שצברת, הניסיון, הכישרון, הרצון להעניק...
          </p>
          <p className="text-3xl md:text-4xl font-display mt-8 mb-10">ורק המטופל לא בא.</p>
          <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
            מה מעכב אותו?
            <br />
            למה אין מספיק אנשים שפונים אליך ורוצים לעבוד דווקא איתך?
          </p>
        </div>
      </section>

      {/* Reframe: depth vs breadth */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
        <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            כשאתה מנסה להבין למה יש כזה פער בין היכולות הגבוהות שלך לבין מספר הפונים המצומצם, זה יכול לדכדך. לפעמים אתה מסביר לעצמך שכנראה אתה לא מספיק טוב, או שפשוט חסרה לך הכריזמה או היכולת השיווקית שהייתה ממלאת לך את הקליניקה.
          </p>
          <p className="text-xl text-primary font-semibold">
            אבל האמת היא שהפער הזה לא קשור ביכולות האישיות או המקצועיות שלך, אלא בפעולות שעשית לקידום הקליניקה.
          </p>
        </div>

        <div className="my-12 rounded-3xl bg-secondary p-8 md:p-10 text-center">
          <p className="text-2xl md:text-3xl font-display text-primary leading-snug">
            עד היום השקעת המון לעומק,
            <br />
            וכמעט בכלל לא השקעת לרוחב.
          </p>
        </div>

        <div className="space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            עשית הכשרות, צברת תעודות והתמקצעת בלי סוף, ובגלל זה אתה כל כך טוב במה שאתה עושה. אתה רואה את השינוי שאתה יוצר בחיים של האנשים שעובדים איתך, כמה טוב להם בחדר שלך, ובכל זאת זה לא מביא מספיק פניות.
          </p>
          <p className="font-semibold text-foreground">
            כי עבודה מעולה שקורית מאחורי דלת סגורה לא מקבלת תהודה. וגם המטופלים הכי מרוצים לא תמיד ממליצים.
          </p>
          <p>
            <span className="font-semibold text-primary">השקעה לרוחב היא בדיוק זה:</span> ליצור תהודה לעבודה שלך, כדי שיותר אנשים ישמעו עליך ויבינו את הערך שאתה נותן.
          </p>
          <p>
            ואני יודעת שזה יכול להרגיש כמו חידה: מסביבך מטפלים ומאמנים לא יותר טובים ממך מקבלים פניות והפניות, ואולי אפילו יש להם רשימת המתנה, ואתה שואל את עצמך: איך הם עושים את זה, ומה הם יודעים שאני לא?
          </p>
        </div>

        <div className="mt-12 text-center space-y-6">
          <p className="text-2xl md:text-3xl font-display text-primary leading-snug">
            היית רוצה לפתור סוף סוף את התעלומה?
          </p>
          <p className="text-lg leading-relaxed text-foreground/85">
            הכנתי לך אתגר חינמי, שבו תלמד את השלבים להפוך ממטפל שהוא מומחה בתוך החדר, לכזה שגם בחוץ מכירים בערך הגדול שהוא נותן ורוצים לעבוד דווקא איתו.
          </p>
          <CtaButton label="כן! אני רוצה להיות מומחה מבוקש" location="after_story" />
        </div>
      </section>

      {/* What we'll discover */}
      <section className="bg-secondary/60">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
          <div className="text-center"><p className="section-eyebrow">האתגר</p></div>
          <h2 className="text-3xl md:text-4xl font-display text-primary text-center">מה נגלה באתגר</h2>
          <span className="section-divider mb-10" />
          <div className="grid md:grid-cols-2 gap-5">
            {DISCOVER.map((d) => (
              <div key={d.title} className="rounded-2xl bg-card p-6 shadow-[var(--shadow-soft)] border border-border">
                <span className="icon-chip mb-4">
                  <Check className="w-6 h-6" />
                </span>
                <p className="text-lg leading-relaxed">
                  <span className="font-bold text-primary">{d.title}</span> {d.text}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xl md:text-2xl font-display text-primary text-center mt-12 leading-snug">
            יותר אנשים מתאימים פונים אליך לטיפול,
            <br className="hidden sm:block" /> כשהם בטוחים שהגיעו למקום הנכון.
          </p>
        </div>
      </section>

      {/* How it works + outcomes */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <div className="text-center"><p className="section-eyebrow">המבנה</p></div>
          <h2 className="text-3xl md:text-4xl font-display text-primary text-center">איך זה עובד?</h2>
          <span className="section-divider mb-10" />
        <div className="grid sm:grid-cols-3 gap-4 mb-14 text-center">
          {[
            { big: "3 ימים", small: "9-11 בנובמבר, ידע עמוק ותרגול פרקטי" },
            { big: "קבוצה סגורה", small: "בווטסאפ, כדי שתוכל להתרכז בתוכן, ואפשר לשתף אותי בפרטי בתובנות ובתרגילים" },
            { big: "שידור חי", small: "ביום רביעי, 11.11, סדנה מעשית: החלק הכי חשוב באתגר" },
          ].map((s) => (
            <div key={s.big} className="rounded-2xl border border-border bg-card p-6">
              <p className="text-2xl font-display text-accent mb-2">{s.big}</p>
              <p className="text-foreground/75 leading-relaxed">{s.small}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-primary text-primary-foreground p-8 md:p-12">
          <h3 className="text-2xl md:text-3xl font-display mb-2">ומה יוצאים איתו בפועל?</h3>
          <p className="text-primary-foreground/75 mb-8">תוצרים מוחשיים שתבנה תוך כדי האתגר:</p>
          <ul className="grid sm:grid-cols-2 gap-4">
            {OUTCOMES.map((o) => (
              <li key={o} className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 px-5 py-4 text-lg">
                <Check className="w-5 h-5 shrink-0 text-[hsl(var(--terracotta))]" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/60">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
          <div className="text-center"><p className="section-eyebrow">המלצות</p></div>
          <h2 className="text-3xl md:text-4xl font-display text-primary text-center">
            מה מספרים מטפלים שקיבלו ממני הדרכה וליווי
          </h2>
          <span className="section-divider mb-10" />
          <div className="grid md:grid-cols-2 gap-6 mb-14">
            {TESTIMONIALS.map((t) => (
              <figure key={t.by} className="card-asym bg-card p-7 shadow-[var(--shadow-soft)] border border-border flex flex-col">
                <Quote className="w-8 h-8 text-accent/40 mb-3" />
                <blockquote className="text-lg leading-relaxed text-foreground/85 flex-1">{t.text}</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-primary">{t.by}</figcaption>
              </figure>
            ))}
          </div>

          <p className="text-center text-muted-foreground mb-6">ומה אומרים אנשים בכירים בתחום הפסיכותרפיה:</p>
          <figure className="rounded-3xl border-2 border-primary/15 bg-card p-8 md:p-10 max-w-3xl mx-auto">
            <blockquote className="text-lg md:text-xl leading-relaxed text-foreground/85">
              "המדריך שכתבו ד"ר אריאל שפירא ואליענה שפירא, "על שפת הקליניקה", נותן מקום לשאלות שכל מטפל מכיר, ובתהליך כמו טיפולי מוליך את המעיין בו למפגש עם עצמי בעל ערך, הנותן מקום לעצמי המטפל המקצועי וחש בנוח במקום זה. מצאתי את המדריך רלוונטי לכל מטפל, ומצמיח את כולנו להיות אנשי מקצוע מקצועיים וטובים יותר."
            </blockquote>
            <figcaption className="mt-6">
              <span className="font-bold text-primary">פרופ' יוני גז</span>
              <span className="text-muted-foreground">, ראש המגמה לפסיכולוגיה קלינית במכללת ספיר</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Reassurance */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-3xl text-center space-y-6">
        <p className="text-lg leading-relaxed text-foreground/85">
          לקחתי את הניסיון המצטבר שלי, יותר מעשור של עבודה כמטפלת רגשית, ואת מה שלמדתי ממטפלים שליוויתי בשנים האחרונות, וריכזתי באתגר עקרונות עומק שיעזרו לך להפוך למומחה מבוקש.
        </p>
        <p className="text-xl md:text-2xl font-display text-primary leading-snug">
          וחשוב לי לומר לך: לא חסרה לך כריזמה, ולא תיאלץ להשתמש בשיטות מניפולטיביות.
        </p>
        <p className="text-lg leading-relaxed text-foreground/85">
          להפך. יש לך כל כך הרבה עומק מקצועי, שרק צריך להבין איך להנגיש אותו החוצה באופן שמרגיש לך נוח. המטרה היא שתהפוך לסמכות מקצועית אמינה ורצויה בעיני המטופלים שצריכים אותך, וזה גם מה שתמיד רצית.
        </p>
        <CtaButton label="לחץ כאן כדי להצטרף לאתגר" location="reassurance" />
      </section>

      {/* For you if */}
      <section className="band band-burgundy band-grain">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl">
          <div className="text-center"><p className="section-eyebrow">למי זה מתאים</p></div>
          <h2 className="text-3xl md:text-4xl font-display text-center">האתגר הזה בשבילך אם:</h2>
          <span className="section-divider mb-10" />
          <ul className="space-y-5">
            {FOR_YOU.map((f) => (
              <li key={f} className="flex gap-4 text-lg leading-relaxed text-primary-foreground/90">
                <Check className="w-6 h-6 shrink-0 mt-1 text-[hsl(var(--terracotta))]" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-lg leading-relaxed text-primary-foreground/80 border-t border-primary-foreground/15 pt-8">
            לפעמים ניסיונות השיווק שלא צלחו גורמים לך לתהות אם קליניקה פרטית זה באמת בשבילך, אבל משהו בתוכך לא רוצה לוותר על החלום המקצועי.
          </p>
        </div>
      </section>

      {/* About */}
      <section className="container mx-auto px-4 py-16 md:py-24 max-w-5xl">
        <div className="grid md:grid-cols-[1fr_1.6fr] gap-10 items-center">
          <img
            src={elianaPortrait}
            alt="אליענה שפירא"
            loading="lazy"
            className="rounded-full w-56 h-56 md:w-72 md:h-72 object-cover mx-auto shadow-[var(--shadow-card)]"
          />
          <div className="space-y-4 text-lg leading-relaxed text-foreground/85">
            <h2 className="text-3xl md:text-4xl font-display text-primary">קצת עליי</h2>
            <p className="font-semibold text-foreground">
              היי, אני אליענה שפירא, מטפלת זוגית ויועצת חינוכית (M.A). בשנים האחרונות אני מנחה ומלווה מטפלים, יועצים ומאמנים לקליניקה מבוקשת ורווחית.
            </p>
            <p>
              תמיד היה לי ברור שיום אחד תהיה לי קליניקה, אבל שנים זה הרגיש לי מסובך מדי. ראיתי גם מטפלים מעולים סביבי שמונעים מעצמם הגשמה, רק כי שיווק נראה להם אגרסיבי, חשוף או פשוט לא מתאים לאופי שלהם.
            </p>
            <p>
              לפני כמה שנים הקמתי יחד עם בעלי, ד"ר אריאל שפירא, פסיכולוג קליני, את "על שפת הקליניקה": קהילה של אלפי מטפלים ומאמנים שרוצים קליניקה מלאה באופן שמתאים לערכים שלהם. <strong className="text-foreground">שיווק מודע</strong> מאפשר לנו לשדר את הערך והמומחיות שלנו בעולם מתוך הקשבה עמוקה למטופלים שלנו.
            </p>
            <p>
              היום אני עוזרת למטפלים, יועצים ומאמנים להביא לידי ביטוי את המתנה המקצועית שלהם, באופן שמשקף את הידע והכישרון שלהם ומאפשר נתינה גדולה, תגמול משמח ותחושת משמעות.
            </p>
          </div>
        </div>
      </section>

      {/* Registration */}
      <section id="register" className="bg-secondary/60 scroll-mt-4">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-display text-primary mb-3">רוצה להיות מומחה מבוקש?</h2>
              <p className="text-lg text-foreground/80">מחכה לך באתגר!</p>
              <p className="text-sm text-muted-foreground mt-2">3 ימים · 9-11 בנובמבר · חינם</p>
            </div>
            <div className="rounded-3xl bg-card p-6 md:p-8 shadow-[var(--shadow-elevated)] border border-border">
              <RegistrationForm source={source} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ChallengeLanding;
