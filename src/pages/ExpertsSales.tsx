import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  Compass,
  Megaphone,
  MessageCircle,
  Mic,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRevealOnScroll } from "@/hooks/useReveal";
import { trackEvent } from "@/lib/analytics";
import elianaPortrait from "@/assets/founders/eliana-portrait.jpg";

// Sales page of the "המומחים" program (copy: the program document). DESIGN DRAFT: noindex until approved.
//
// Colour language: everything that is Eliana's differentiator, the combination of a precise marketing strategy
// AND the inner work that lets you act on it, is set in the terracotta accent (<Hl>), so the eye follows it
// down the page. Anything not final in the document is shown as a dashed "להשלים" chip (<Todo>), never hidden.

// The Grow payment links come later. Until then every "join" button scrolls to the price section.
const JOIN_URL: string | null = null;
const ELIANA_WHATSAPP = "972523379716";
const PRICE = "6,700";

const joinHref = JOIN_URL ?? "#join";
const askHref = `https://wa.me/${ELIANA_WHATSAPP}?text=${encodeURIComponent('היי אליענה, יש לי שאלה לגבי תוכנית "המומחים".')}`;

// The differentiator colour. On cream: terracotta with a soft marker under the line. On dark bands: the light terracotta.
function Hl({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={`font-semibold ${dark ? "text-[hsl(var(--terracotta))]" : "text-accent"}`}
      style={{ boxShadow: `inset 0 -0.42em 0 hsl(var(--${dark ? "terracotta" : "accent"}) / ${dark ? 0.22 : 0.16})` }}
    >
      {children}
    </span>
  );
}

// Something the document still leaves open (date, payment options, credit, a number to verify).
function Todo({ children }: { children: ReactNode }) {
  return (
    <span className="mx-1 inline-block rounded border border-dashed border-amber-600/70 bg-amber-100 px-2 py-0.5 align-middle text-xs font-medium text-amber-900">
      להשלים: {children}
    </span>
  );
}

function JoinButton({ label = "אני רוצה להצטרף למומחים", location, tone = "coral" }: { label?: string; location: string; tone?: "coral" | "light" }) {
  return (
    <a
      href={joinHref}
      onClick={() => trackEvent("experts_cta_click", { location })}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg transition-colors sm:w-auto ${
        tone === "coral" ? "bg-[#ff6f61] text-white hover:bg-[#ff5a4d]" : "bg-background text-primary hover:bg-background/90"
      }`}
    >
      {label}
      <ArrowLeft className="h-5 w-5" />
    </a>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="section-eyebrow">{children}</p>;
}

function Testimonial({ quote, who, dark = false, children }: { quote: string; who: ReactNode; dark?: boolean; children?: ReactNode }) {
  return (
    <figure className="reveal mx-auto max-w-3xl text-center">
      <Quote className={`mx-auto mb-4 h-8 w-8 ${dark ? "text-[hsl(var(--terracotta))]" : "text-accent"}`} />
      <blockquote className="font-display text-xl leading-[1.75] md:text-2xl">“{quote}”</blockquote>
      <figcaption className={`mt-5 text-sm ${dark ? "text-background/70" : "text-muted-foreground"}`}>{who}</figcaption>
      {children}
    </figure>
  );
}

const SCENES = [
  { Icon: MessageCircle, when: "כששואלים אותך במה אתה מטפל", body: "אתה יודע להציג את המומחיות שלך באופן פשוט, מדויק ומעורר עניין, כך שאנשים מבינים למי אתה עוזר ובמה." },
  { Icon: Users, when: "כשמתפנה מקום בקליניקה", body: "במקום להמתין ולקוות לפנייה, יש לך רשת קשרים מקצועית ותוכנית פעולה. אתה יודע למי לפנות ואיך לעשות זאת בדרך שמכבדת אותך ואת מי שמולך." },
  { Icon: Megaphone, when: "כשאתה רוצה ליצור תוכן", body: "יש לך מסרים ורעיונות שמבוססים על הבנה עמוקה של האנשים שאתה רוצה להגיע אליהם ועל נקודת המבט המקצועית הייחודית שלך. אתה לא צריך לחפש בכל פעם מחדש על מה לכתוב." },
  { Icon: Mic, when: "וכשמישהו מתקשר להתעניין בטיפול", body: "אתה יודע איך להוביל שיחה מקצועית ורגישה, לבדוק התאמה, להציג את דרך העבודה ואת המחיר שלך ולעזור למתעניין להבין מה נכון עבורו." },
];

const AREAS = [
  {
    n: "01",
    title: "להכיר במומחיות שלך",
    lead: "לבנות את היסודות המקצועיים והעסקיים של הקליניקה שאתה רוצה ליצור.",
    body: ["נזהה את הידע, הניסיון והכישורים שמייחדים אותך, ונבחין בין תחומים שבהם נדרשת עוד למידה לבין מקומות שבהם כבר יש לך ערך מקצועי שאפשר להביא לעולם.", "נגדיר את החזון שלך, את המטרות המקצועיות והכלכליות ואת הדרך שבה אתה רוצה שהקליניקה תשתלב בחייך."],
    gets: "מפת מומחיות, חזון מקצועי ויעדים ברורים לבניית הקליניקה.",
  },
  {
    n: "02",
    title: "להיות הכתובת הנכונה",
    lead: "לבנות מיצוב ברור, כדי שהאנשים המתאימים יבינו למה דווקא אתה יכול לעזור להם.",
    body: ["נזהה את סוג המטופלים שהכי נכון לך לעבוד איתם, נבין את הצרכים שלהם ואת הדרך שבה הם מחפשים עזרה.", "נבחר תחום מיקוד שמחבר בין המומחיות והעניין המקצועי שלך לבין צורך אמיתי בשטח."],
    gets: "הגדרה ברורה של קהל היעד, תחום המיקוד והערך שמבדיל אותך.",
  },
  {
    n: "03",
    title: "לפתוח את הדלת למטופלים חדשים",
    lead: "לבנות אסטרטגיה שמחברת בין הקליניקה שלך לבין המקומות שבהם נמצאים האנשים המתאימים.",
    body: ["נמפה את הדרכים שבהן מטופלים יכולים להגיע אליך, ונבחן אילו ערוצי שיווק והפניה מתאימים למומחיות, לקהל ולמשאבים שלך.", "נשים דגש על קשרים מקצועיים עם קולגות ואנשי מקצוע מתחומים משלימים, ונלמד לפנות אליהם בדרך שמייצרת היכרות ואמון."],
    gets: "מפת ערוצי הגעה למטופלים, רשת קשרי הפניה, סדר עדיפויות ונוסחים לפניות ראשונות.",
  },
  {
    n: "04",
    title: "לדבר כך שיבינו את הערך שלך",
    lead: "לתרגם את המומחיות שלך למסרים שגורמים לאנשים הנכונים להבין שאתה יכול לעזור להם.",
    body: ["נלמד להציג את עצמך ואת דרך העבודה שלך בשפה ברורה, אנושית ומדויקת.", "נבנה מסרים שמחברים בין הצרכים של המטופלים לבין הערך שאתה מציע, בלי להישמע כמו כולם."],
    gets: "הצגה עצמית מקצועית ומסרים מרכזיים שאפשר להשתמש בהם בשיחות, בהפניות ובתוכן שיווקי.",
  },
  {
    n: "05",
    title: "לתת למומחיות שלך קול",
    lead: "לבנות נוכחות שיווקית ותוכן שמבססים את המומחיות שלך ומעודדים פניות מתאימות.",
    body: ["נלמד לבחור ערוצי תוכן שמתאימים לך, להבין אילו מסרים נכון להעביר בכל שלב וליצור תכנים שמפתחים היכרות, הזדהות ואמון.", "נתרגם רעיונות מקצועיים לשפה שמטופלים יכולים להתחבר אליה, ונבנה דרך ליצירת תוכן שאפשר להתמיד בה."],
    gets: "בנק מסרים ורעיונות לתוכן, כיווני פרסום ותוכנית ראשונית לנוכחות הדיגיטלית שלך.",
  },
  {
    n: "06",
    title: "להפוך התעניינות לפגישה טיפולית",
    lead: "לנהל את המפגש הראשון עם המתעניין באופן שמאפשר לבדוק התאמה ולהגיע להחלטה ברורה.",
    body: ["נבנה מבנה לשיחת היכרות מקצועית ורגישה, ונלמד להבין את הצורך של הפונה, להציג את דרך העבודה ולהוביל את השיחה.", "נתרגל גם מצבים של היסוס, שאלות מאתגרות ו“אני אחשוב על זה”, בלי להפעיל לחץ ובלי לוותר על העמדה המקצועית שלך."],
    gets: "מבנה שיחה, צ'ק ליסט ויכולת לנהל שיחות היכרות באופן בטוח ומדויק יותר.",
  },
  {
    n: "07",
    title: "לעמוד מאחורי המחיר שלך",
    lead: "לבנות תמחור רווחי והוגן, ולדבר על כסף מתוך בהירות וביטחון.",
    body: ["נבחן את המודל הכלכלי של הקליניקה, את המחירים ואת הקשר בין התמחור לבין המטרות המקצועיות והאישיות שלך.", "נתרגל הצגת מחיר, התמודדות עם בקשות הנחה ושמירה על גבולות מקצועיים."],
    gets: "מדיניות תמחור ברורה ושפה מקצועית ונוחה לשיחות על כסף.",
  },
  {
    n: "08",
    title: "לבנות קליניקה שנשענת על דרך",
    lead: "להפוך את כל מה שלמדת לאסטרטגיה שיווקית ותוכנית פעולה שאפשר להתמיד בהן לאורך זמן.",
    body: ["נחבר את המיצוב, ערוצי השיווק, קשרי ההפניה, המסרים והתוכן לתוכנית עבודה שמתאימה לקליניקה שלך.", "נגדיר יעדים, סדרי עדיפויות ופעולות קבועות, כך שתדע במה להתמקד גם אחרי שהתוכנית מסתיימת."],
    gets: "תוכנית שיווקית אישית ומפת דרכים מעשית להמשך בניית הקליניקה.",
  },
];

const FIT = [
  "יש לך ידע וניסיון מקצועי, אבל לא מספיק אנשים מכירים את המומחיות שלך.",
  "אתה כבר עושה פעולות שיווקיות, אבל חסרה לך אסטרטגיה ברורה שמחברת ביניהן.",
  "יש לך קליניקה פעילה, אבל הפניות מגיעות באופן לא עקבי.",
  "אתה רוצה לפתח קשרי הפניה ונוכחות מקצועית בלי להיות תלוי רק ברשתות החברתיות.",
  "אתה מתקשה להציג את עצמך, לדבר על המחיר או להפוך שיחות היכרות לתחילת עבודה משותפת.",
  "אתה רוצה דרך שיווקית מקצועית שמתאימה לערכים שלך ולמציאות של עולם הטיפול.",
];

const FAQ = [
  {
    q: "אני לא רוצה להצטלם כל היום לרשתות החברתיות. האם התוכנית מתאימה לי?",
    a: ["בהחלט. התוכנית לא מבוססת על ההנחה שכולם צריכים ליצור סרטונים או להיות פעילים כל הזמן ברשתות החברתיות.", "נלמד לבחור דרכי שיווק שמתאימות למומחיות, לקהל, לאישיות ולמשאבים שלך. אלה יכולות לכלול קשרי הפניה מקצועיים, תוכן כתוב, נוכחות דיגיטלית ודרכים נוספות.", "המטרה היא לבנות נוכחות מקצועית שמתאימה לך, ולא להפוך אותך למישהו שאתה לא."],
  },
  {
    q: "האם התוכנית מתאימה גם אם כבר יש לי קליניקה פעילה?",
    a: ["כן. התוכנית מיועדת גם לאנשי מקצוע שכבר עובדים בקליניקה, אבל רוצים ליצור זרם פניות יציב יותר, לדייק את המיצוב שלהם ולבנות אסטרטגיה שתאפשר להם להתקדם באופן מכוון."],
  },
  {
    q: "האם אני חייב לבחור נישה צרה?",
    a: ["לא בהכרח. נלמד לזהות את תחומי המומחיות, את האנשים שהכי נכון לך לעבוד איתם ואת הצרכים שלהם.", "המטרה אינה לצמצם אותך באופן מלאכותי, אלא ליצור בהירות שתאפשר לאנשים להבין מתי ולמה נכון לפנות דווקא אליך."],
  },
  {
    q: "מה קורה אם קשה לי להציג את עצמי או לדבר על המומחיות שלי?",
    a: ["זה בדיוק אחד הנושאים שנעבוד עליהם.", "לצד בניית המסרים והאסטרטגיה, נתבונן גם במה שמתעורר בתוכך כשצריך להיראות, להביע עמדה ולהציע את השירות שלך.", "לא מצפים ממך להגיע עם ביטחון מלא. נתרגל את המיומנויות האלה בהדרגה, כחלק מתהליך הלמידה והיישום."],
  },
];

const ExpertsSales = () => {
  useRevealOnScroll();
  const [showBar, setShowBar] = useState(false);

  // The round, warm faces of this page (headings: Fredoka, text: Alef), loaded only here.
  useEffect(() => {
    const id = "experts-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Alef:wght@400;700&display=swap";
    document.head.appendChild(l);
  }, []);

  // The sticky bar appears once the first screen has been scrolled past, and goes away at the price section.
  useEffect(() => {
    const onScroll = () => {
      const join = document.getElementById("join");
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const atJoin = join ? join.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
      setShowBar(pastHero && !atJoin);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div dir="rtl" className="experts-page min-h-screen bg-background text-foreground">
      <style>{`
        .experts-page { font-family: 'Alef', 'Assistant', sans-serif; }
        .experts-page .font-display, .experts-page .section-eyebrow { font-family: 'Fredoka', 'Alef', sans-serif; font-weight: 500; }
        .experts-page h1.font-display { font-weight: 600; }
        .experts-page .section-eyebrow { letter-spacing: 0.1em; }
      `}</style>
      <SEOHead
        title='המומחים | תוכנית ליווי למטפלים עם אליענה שפירא'
        description="ממטפל אנונימי למומחה מבוקש: ארבעה חודשים של לימוד, תרגול וליווי אישי וקבוצתי, שמשלבים אסטרטגיה שיווקית ועבודה פנימית."
        canonicalUrl="/hamumchim"
        noindex
      />

      {/* ============================================================ HERO */}
      <section className="band band-charcoal band-grain">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[150px]" style={{ background: "hsl(var(--accent) / 0.2)" }} />
          <div className="absolute -bottom-40 -right-40 h-[420px] w-[420px] rounded-full blur-[150px]" style={{ background: "hsl(var(--primary) / 0.45)" }} />
        </div>
        <div className="container relative z-10 mx-auto flex items-center justify-between gap-4 px-4 pt-5">
          <span className="font-display text-lg text-background/90">אליענה שפירא · על שפת הקליניקה</span>
          <a href={joinHref} onClick={() => trackEvent("experts_cta_click", { location: "top_bar" })} className="rounded-full border border-background/30 px-4 py-1.5 text-sm text-background/90 transition-colors hover:bg-background/10">
            להרשמה
          </a>
        </div>
        <div className="container relative z-10 mx-auto px-4 pb-16 pt-10 md:pb-24 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
            <div>
              <Eyebrow>תוכנית ליווי · ארבעה חודשים</Eyebrow>
              <h1 className="font-display text-5xl leading-[1.1] tracking-tight text-background md:text-7xl">המומחים</h1>
              <p className="mt-3 font-display text-2xl text-[hsl(var(--terracotta))] md:text-3xl">ממטפל אנונימי למומחה מבוקש</p>
              <p className="mt-7 text-xl leading-relaxed text-background/90 md:text-2xl">
                תוכנית ליווי למטפלים, מאמנים ויועצים שרוצים לבנות קליניקה יציבה ומבוקשת, כזו שמעריכים את המומחיות שלהם, ממליצים עליהם ופונים אליהם כל הזמן.
              </p>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-background/70">
                אם מרגיש לך שהגיע הזמן להפסיק לחכות שיגלו אותך, ולהתחיל לבנות נוכחות מקצועית שמביאה אליך את האנשים המתאימים, התוכנית הזו היא בשבילך.
              </p>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-background/85">
                ארבעה חודשים של לימוד, תרגול וליווי אישי וקבוצתי, שמשלבים{" "}
                <Hl dark>אסטרטגיה שיווקית ועבודה פנימית</Hl>, בדרך לקליניקה יציבה ומבוקשת.
              </p>
              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <JoinButton location="hero" />
                <span className="text-sm text-background/60">שבוע ראשון עם אחריות מלאה</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-[hsl(var(--terracotta)/0.5)]" />
              <div className="relative rounded-[2rem] border border-background/10 bg-background/5 p-7 backdrop-blur-sm">
                <p className="font-display text-sm text-[hsl(var(--terracotta))]">מה בפנים</p>
                <ul className="mt-4 space-y-3.5 text-background/90">
                  {[
                    ["3 חודשי לימוד", "ועוד חודש של מעבדת יישום והטמעה"],
                    ["זום חי", "בהנחייתה של אליענה"],
                    ["פגישת אסטרטגיה אישית", "אחת על אחת"],
                    ["חמישי אישי", "חלון שבועי לפנייה פרטית"],
                    ["המנטור", "סביבת תרגול אישית מבוססת AI"],
                  ].map(([t, s]) => (
                    <li key={t} className="flex items-start gap-3">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                      <span>
                        <span className="font-semibold">{t}</span>
                        <span className="block text-sm text-background/60">{s}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ THE GAP */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="reveal space-y-6 text-center text-xl leading-[1.9] md:text-2xl">
            <p>כי בתוך הקליניקה ברור לך שיש לך הרבה מה לתת. אבל בחוץ, לא תמיד רואים את זה.</p>
            <p className="text-muted-foreground">והגיע הזמן שהערך המקצועי שלך יקבל ביטוי גם מחוץ לקליניקה.</p>
            <p className="font-display text-3xl leading-snug text-primary md:text-4xl">להרגיש שמעריכים אותך בחוץ, כמו שמעריכים אותך בעבודה המשמעותית שלך מאחורי הדלת.</p>
          </div>
          <div className="reveal mt-12 grid gap-4 md:grid-cols-2">
            <div className="card-asym border border-border bg-card p-6">
              <p className="leading-relaxed">לדעת לבטא את המומחיות שלך באופן אותנטי, שמעורר אמון ומביא יותר פניות מאנשים שרוצים לעבוד דווקא איתך.</p>
            </div>
            <div className="card-asym border border-accent/40 bg-accent/10 p-6">
              <p className="leading-relaxed">
                <Hl>בלי להפוך ל“איש מכירות”</Hl>, ובלי לוותר על האישיות והערכים שלך.
              </p>
            </div>
          </div>
          <p className="reveal mt-10 text-center font-display text-2xl text-primary">זה אפשרי. ויש דרך ללמוד לעשות את זה.</p>
        </div>
      </section>

      {/* ============================================================ TESTIMONIAL: the clinic that began to bloom */}
      <section className="band band-burgundy band-grain py-16 md:py-20">
        <div className="container relative z-10 mx-auto px-4">
          <p className="mb-8 text-center font-display text-2xl text-[hsl(var(--terracotta))]">מקליניקה בתחילת דרכה לקליניקה שהחלה לפרוח</p>
          <Testimonial
            dark
            quote="נרשמתי ל'נקודת המפנה' בתקופה של קליניקה בתחילת דרכה, היו מעט פניות, וגם כשהיו, פעמים רבות השיחה הראשונית לא הובילה לתחילת הטיפול. במהלך התוכנית חידדתי את החשיבה על מי אני כפסיכולוגית, ומה אני מעוניינת לתת למטופלים שלי, ובתקופה קצרה יחסית העברתי זאת החוצה בבהירות ללא התנצלות ועם הבנה של מה אני יכולה לתת בטיפול. די מהר הקליניקה החלה לפרוח."
            who="ל.פ, פסיכולוגית קלינית, בוגרת “נקודת המפנה”"
          />
        </div>
      </section>

      {/* ============================================================ THE PROBLEM */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Eyebrow>הפער</Eyebrow>
          <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">השקעת שנים כדי להיות מטפל מקצועי. אבל כמה אנשים יודעים כמה יש לך לתת?</h2>
          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>למדת, התמקצעת, השקעת בהכשרות וצברת ניסיון.</p>
            <p>אתה יודע מה קורה בחדר הטיפול. אתה רואה את השינויים שאנשים עוברים בעזרתך ומכיר את הערך של העבודה שלך.</p>
            <p>אבל מחוץ לחדר הטיפול, משהו אחר קורה.</p>
            <p className="font-display text-2xl text-primary">לא מספיק אנשים מכירים אותך.</p>
            <p>אתה רואה קולגות שהיומן שלהם מלא, שממליצים עליהם ומפנים אליהם מטופלים, ותוהה מה הם עושים אחרת.</p>
            <p>אולי כבר ניסית לפרסם. כתבת פוסט, העלית מודעה, סיפרת לאנשים שיש מקום בקליניקה. לפעמים אפילו קיבלת תגובות יפות.</p>
            <p>אבל זה עדיין לא הפך לזרם יציב של פניות.</p>
            <p>ואתה ממשיך לחכות שמישהו ימליץ עליך, שמטופל חדש יתקשר, שמשהו יתחיל לזוז.</p>
          </div>
          <div className="reveal card-asym mt-10 border-s-4 border-accent bg-card p-7 shadow-card">
            <p className="text-xl font-semibold leading-relaxed text-primary">והפער הזה, בין מה שאתה יודע שיש לך לתת לבין מה שקורה בקליניקה בפועל, כואב.</p>
            <p className="mt-2 text-muted-foreground">כי לא למדת כל כך הרבה כדי להישאר אנונימי.</p>
          </div>

          <h3 className="reveal mt-16 font-display text-2xl text-primary md:text-4xl">זה לא שאין לך מה לתת</h3>
          <div className="reveal mt-6 space-y-5 text-lg leading-[1.9]">
            <p>יש לך ידע, ניסיון והכשרות מקצועיות. אבל אף אחד לא באמת לימד אותך איך לתרגם אותם לנוכחות מקצועית שאנשים מכירים, זוכרים וממליצים עליה.</p>
            <p>איך לזהות את האנשים שהכי נכון לך לעבוד איתם, ליצור מסרים שיגרמו להם להבין את הערך שלך, לבנות קשרי הפניה ולנהל שיחות היכרות שמובילות לתחילת עבודה משותפת.</p>
            <p className="font-semibold">אלה מיומנויות שיווקיות ועסקיות שאפשר וחשוב ללמוד.</p>
            <p>אבל לפעמים, גם כשכבר יודעים מה נכון לעשות, משהו עוצר דווקא ברגע שבו צריך לפעול.</p>
          </div>

          <div className="reveal mt-8 grid gap-3">
            {["מי אני שאציג את עצמי כמומחה?", "יש כל כך הרבה מטפלים טובים ומנוסים ממני. מה כבר יש לי לחדש?", "אני יודע לעזור לאנשים, אבל איך אשווה את עצמי לאחרים בלי להרגיש שאני מוכר משהו?"].map((q) => (
              <div key={q} className="rounded-2xl border border-border bg-card px-6 py-4 font-display text-lg italic text-primary">
                “{q}”
              </div>
            ))}
          </div>

          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>אולי אתה יודע שכדאי ליצור קשר עם קולגה, אבל חושש שהפנייה תישמע כמו בקשת טובה.</p>
            <p>יש לך דעה מקצועית שחשוב לך להשמיע, אבל לא נוח לך להסתכן בכך שלא כולם יסכימו איתה.</p>
            <p>או שאתה יודע מה המחיר הנכון לעבודתך, אבל ברגע שמישהו מבקש הנחה, אתה מתקשה לעמוד מאחוריו.</p>
            <p>וכך, גם כשהידע קיים, לא תמיד מצליחים להשתמש בו.</p>
          </div>

          <div className="reveal card-asym mt-12 border border-accent/40 bg-accent/10 p-8">
            <p className="text-sm font-semibold tracking-wide text-accent">כאן נמצא הבידול</p>
            <p className="mt-2 font-display text-2xl leading-snug md:text-3xl">
              כדי לבנות קליניקה מבוקשת צריך שני דברים: <Hl>לדעת מה נכון לעשות</Hl>, ו<Hl>להצליח לעשות את זה בפועל</Hl>.
            </p>
            <div className="mt-5 space-y-4 text-lg leading-[1.9]">
              <p>אפשר להכיר את כל הכלים השיווקיים, אבל להמשיך לדחות את הרגע שבו צריך להשתמש בהם.</p>
              <p>ואפשר לפתח ביטחון מקצועי, אבל עדיין לא לדעת איך להגיע לאנשים שזקוקים למומחיות שלך.</p>
              <p>
                לכן הדרך לקליניקה מבוקשת עוברת דרך השילוב בין <Hl>אסטרטגיה שיווקית</Hl> לבין <Hl>עבודה פנימית</Hl> שמאפשרת ליישם אותה.
              </p>
            </div>
          </div>

          <div className="reveal mt-12 text-center">
            <p className="text-lg text-muted-foreground">וחשוב לי לומר משהו:</p>
            <p className="mt-2 font-display text-3xl leading-snug text-primary md:text-4xl">מספר הפניות לקליניקה שלך אינו המדד למקצועיות שלך.</p>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-[1.9]">
              יש מטפלים מצוינים שהיומן שלהם עדיין רחוק מלהיות מלא. אבל כדי שאנשים יוכלו לבחור בך, הם צריכים קודם להכיר אותך, להבין במה אתה יכול לעזור להם ולהרגיש שאתה האדם הנכון עבורם.
            </p>
            <p className="mt-3 font-semibold">ואת זה אפשר ללמוד.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ TWO PEOPLE (the method) */}
      <section className="band band-charcoal band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>השיטה</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">שיווק טוב מתחיל בהבנה של שני אנשים</h2>
            <p className="reveal mt-3 font-display text-xl text-background/70">האדם שמחפש עזרה, ואיש המקצוע שיכול להעניק אותה.</p>
            <p className="reveal mt-6 text-lg leading-[1.9] text-background/80">
              כשאנחנו חושבים על שיווק, אנחנו רגילים לשאול איך להגיע ליותר אנשים, איך לפרסם ואיך לגרום להם להכיר אותנו. אבל יש כאן מפגש עמוק יותר בין שני עולמות פנימיים.
            </p>
          </div>

          <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-background/15 bg-background/5 p-8">
              <p className="font-display text-sm text-background/50">מצד אחד</p>
              <h3 className="mt-1 font-display text-2xl text-background">האדם שמחפש עזרה</h3>
              <p className="mt-4 leading-[1.9] text-background/80">אדם שמתמודד עם קושי, מחפש מענה ולא תמיד יודע למי לפנות או איך לבחור את איש המקצוע המתאים עבורו.</p>
              <p className="mt-3 leading-[1.9] text-background/80">כדי שיוכל לזהות את הערך שלך ולפתח אמון, צריך להבין את המסע שהוא עובר.</p>
              <p className="mt-3 leading-[1.9] text-background/60">מה מעסיק אותו? מה הוא צריך לדעת, להבין ולהרגיש בכל שלב? מה עשוי לעורר בו תקווה, ומה עדיין גורם לו להסס?</p>
            </div>
            <div className="reveal rounded-3xl border border-[hsl(var(--terracotta)/0.5)] bg-[hsl(var(--terracotta)/0.08)] p-8">
              <p className="font-display text-sm text-[hsl(var(--terracotta))]">ומצד שני</p>
              <h3 className="mt-1 font-display text-2xl text-background">יש אותך</h3>
              <p className="mt-4 leading-[1.9] text-background/80">איש מקצוע עם ידע, ניסיון והרבה מה לתת, אבל גם עם עולם פנימי שלם שמתעורר ברגע שצריך לצאת החוצה.</p>
              <p className="mt-3 leading-[1.9] text-background/80">להציג את המומחיות שלך, להביע עמדה, לפנות לאנשים, להזמין אותם לעבוד איתך ולבקש תשלום על השירות שלך.</p>
            </div>
            <div className="absolute left-1/2 top-1/2 z-10 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--terracotta))] font-display text-3xl text-[#1e1a18] shadow-lg md:flex">+</div>
          </div>

          <div className="reveal mx-auto mt-14 max-w-3xl text-center">
            <p className="font-display text-3xl leading-snug text-background md:text-4xl">
              השיטה שלי <Hl dark>מחברת בין שני העולמות האלה</Hl>.
            </p>
            <div className="mt-6 space-y-4 text-lg leading-[1.9] text-background/80">
              <p>אנחנו לומדים להבין לעומק את האדם שאנחנו רוצים להגיע אליו, ולבנות אסטרטגיה שיווקית שמדברת אל הצרכים האמיתיים שלו.</p>
              <p>ובאותו הזמן, אנחנו לומדים לזהות מה מתרחש בתוכנו לאורך הדרך, ולפתח את הביטחון והחופש הפנימי שנדרשים כדי להביא את המומחיות שלנו לעולם.</p>
              <p>כך השיווק מפסיק להיות אוסף של פעולות שצריך להכריח את עצמנו לעשות.</p>
              <p className="text-background">הוא הופך לדרך מקצועית, אנושית ומבוססת אמון, שמחברת בין אנשים שזקוקים לעזרה לבין המומחיות שיכולה לתת להם מענה.</p>
            </div>
          </div>

          <div className="reveal mx-auto mt-16 max-w-3xl">
            <h3 className="text-center font-display text-2xl text-background md:text-3xl">יש דרכים אחרות לשווק קליניקה</h3>
            <div className="relative mt-6 flex aspect-video items-center justify-center overflow-hidden rounded-3xl border border-background/15 bg-background/5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--terracotta))] text-[#1e1a18] shadow-lg">
                <Play className="h-8 w-8 translate-x-[-2px]" />
              </div>
              <span className="absolute bottom-3 start-3">
                <Todo>סרטון העדות של חיים אדרת</Todo>
              </span>
            </div>
            <Testimonial dark quote="אני יכול לומר שאני רואה תוצאות בשטח. אנשים באים לקליניקה." who="חיים אדרת, עובד סוציאלי בהתמחות קלינית, מטפל בהתמכרויות ומנחה קורסים לצוותי חינוך, בוגר התוכנית הקודמת" />
          </div>
        </div>
      </section>

      {/* ============================================================ THE PROGRAM: two foundations */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>התוכנית</Eyebrow>
            <h2 className="reveal font-display text-4xl text-primary md:text-6xl">המומחים</h2>
            <p className="reveal mt-3 font-display text-xl text-accent md:text-2xl">אסטרטגיה שיווקית מדויקת. נוכחות מקצועית בטוחה. קליניקה מבוקשת.</p>
            <p className="reveal mt-6 text-lg leading-[1.9]">
              “המומחים” היא תוכנית ליווי למטפלים, מאמנים ויועצים שרוצים לבנות קליניקה יציבה ומבוקשת, בדרך שמשקפת את הערכים, המומחיות והאישיות שלהם.
            </p>
            <p className="reveal mt-3 text-lg text-muted-foreground">בתוכנית נבנה שני יסודות שמשלימים זה את זה.</p>
          </div>

          <div className="relative mt-12 grid gap-6 md:grid-cols-2">
            <article className="reveal card-asym border border-border bg-card p-8 shadow-card">
              <span className="font-display text-5xl text-accent/40">1</span>
              <h3 className="mt-2 font-display text-2xl leading-snug text-primary">אסטרטגיה שיווקית ועסקית שמותאמת לקליניקה שלך</h3>
              <div className="mt-4 space-y-3 leading-[1.9]">
                <p>נלמד איך ליצור דרך מקצועית שבה האנשים המתאימים יכולים להכיר אותך, להבין את הערך שלך, לבנות בך אמון ולפנות אליך.</p>
                <p>נזהה את תחום המומחיות ואת קהל היעד שלך, נבנה מיצוב ומסרים ברורים, נבחר ערוצי שיווק מתאימים ונפתח רשת קשרי הפניה מקצועיים.</p>
                <p>נלמד ליצור תוכן שמבסס את המומחיות שלך, לנהל שיחות היכרות, לתמחר את השירות ולבנות תוכנית פעולה.</p>
              </div>
              <p className="mt-5 border-t border-border pt-4 text-sm font-semibold leading-relaxed text-primary">כדי שלא תצטרך להמשיך לנסות פעולות שיווק אקראיות, אלא תדע למה אתה עושה כל פעולה ואיך היא משרתת את בניית הקליניקה.</p>
            </article>

            <article className="reveal card-asym relative border-2 border-accent bg-accent/10 p-8 shadow-card">
              <span className="absolute -top-3 end-6 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">מה שמבדיל את “המומחים”</span>
              <span className="font-display text-5xl text-accent/50">2</span>
              <h3 className="mt-2 font-display text-2xl leading-snug text-accent">עבודה פנימית שמאפשרת לך להביא את המומחיות שלך לעולם</h3>
              <div className="mt-4 space-y-3 leading-[1.9]">
                <p>לצד הכלים המקצועיים נעסוק במה שמתרחש בתוכך כשצריך להציג את עצמך, לפנות לאנשים, להביע עמדה, לפרסם תוכן או לדבר על כסף.</p>
                <p>נלמד לזהות את הפחדים, הספקות והדפוסים שמצמצמים את חופש הפעולה שלך, ולפתח עמדה פנימית שמאפשרת לפעול גם כשהדברים אינם מושלמים.</p>
                <p>העבודה הזאת משולבת בכל שלבי התוכנית, באמצעות התבוננות, תרגול ועבודה חווייתית.</p>
              </div>
              <p className="mt-5 border-t border-accent/30 pt-4 text-sm font-semibold leading-relaxed text-accent">כי אסטרטגיה שלא מצליחים ליישם נשארת על הנייר. וביטחון בלי דרך ברורה לא בהכרח מביא מטופלים.</p>
            </article>
            <div className="absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary font-display text-2xl text-primary-foreground shadow-lg md:flex">+</div>
          </div>

          <p className="reveal mt-10 text-center font-display text-2xl text-primary md:text-3xl">
            ב“המומחים” אנחנו בונים <Hl>את שניהם, יחד</Hl>.
          </p>
        </div>
      </section>

      {/* ============================================================ IMAGINE */}
      <section className="band band-burgundy band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto px-4">
          <h2 className="reveal mx-auto max-w-3xl text-center font-display text-3xl leading-snug md:text-5xl">תאר לעצמך שככה נראית ההתנהלות שלך בעוד כמה חודשים</h2>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            {SCENES.map(({ Icon, when, body }) => (
              <div key={when} className="reveal rounded-3xl border border-primary-foreground/15 bg-primary-foreground/5 p-7">
                <span className="icon-chip">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-xl text-[hsl(var(--terracotta))]">{when}</h3>
                <p className="mt-2 leading-[1.9] text-primary-foreground/85">{body}</p>
              </div>
            ))}
          </div>
          <div className="reveal mx-auto mt-10 max-w-3xl text-center text-primary-foreground/80">
            <p className="leading-[1.9]">מאחורי כל אלה עומדת אסטרטגיה ברורה, שמאפשרת לך לדעת במה להתמקד ואיך הפעולות השונות מתחברות לבניית הקליניקה.</p>
            <p className="mt-3 text-sm leading-[1.9] text-primary-foreground/65">לא מדובר בהבטחה שכל פעולה תביא מטופל או שכל רגע יהפוך לקל. אלא בבניית יכולות, כלים ודרך פעולה שמאפשרים לך להתנהל באופן מקצועי, מכוון ובטוח יותר.</p>
          </div>
          <div className="mt-14">
            <p className="mb-6 text-center font-display text-2xl text-[hsl(var(--terracotta))]">כשהאנשים שמגיעים מתאימים למומחיות שלך</p>
            <Testimonial
              dark
              quote="היום מגיעים לקליניקה, באמת מטופלים שאני רוצה לעבוד איתם, שאני שמחה לעבוד איתם, שהם טובים ומדויקים למה שאני רוצה לתת בעולם."
              who={
                <>
                  בוגרת התוכנית הקודמת <Todo>קרדיט מאושר</Todo>
                </>
              }
            />
          </div>
        </div>
      </section>

      {/* ============================================================ EIGHT AREAS */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <Eyebrow>מפת הדרך</Eyebrow>
          <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">הדרך שלך לקליניקה יציבה ומבוקשת</h2>
          <p className="reveal mt-5 max-w-2xl text-lg leading-[1.9]">
            שמונה תחומי לימוד שבהם נבנה בהדרגה את האסטרטגיה השיווקית והעסקית של הקליניקה שלך, ונתרגל את היכולת להוציא אותה לפועל. כבר מהשלבים הראשונים מתחילים לבצע פעולות מעשיות שיכולות לפתוח דלתות למטופלים חדשים.
          </p>

          <div className="mt-12 space-y-5">
            {AREAS.map((a) => (
              <article key={a.n} className="reveal grid gap-5 rounded-3xl border border-border bg-card p-6 shadow-card md:grid-cols-[88px_1fr] md:p-8">
                <span className="font-display text-5xl leading-none text-accent/60 md:text-6xl">{a.n}</span>
                <div>
                  <h3 className="font-display text-2xl text-primary">{a.title}</h3>
                  <p className="mt-2 font-semibold leading-relaxed">{a.lead}</p>
                  <div className="mt-3 space-y-2 leading-[1.9] text-foreground/85">
                    {a.body.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                  <div className="mt-4 flex items-start gap-3 rounded-2xl bg-mentor-surface px-4 py-3">
                    <Target className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed">
                      <span className="font-semibold text-accent">מה יהיה לך ביד: </span>
                      {a.gets}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-16">
            <p className="mb-6 text-center font-display text-2xl text-primary">ממחשבות והתלבטויות ליכולת לפעול</p>
            <Testimonial quote="אם אני חושבת על עצמי אחורה חמישה חודשים, הייתי במקום אחר לגמרי, מדשדשת שם במחשבות של איך ואיפה, והיום אני עם הרבה פחות פחד, עם הרבה ידע איך לעשות את זה נכון, איך לשווק את זה נכון, איך לתמחר נכון." who="מרים, עובדת סוציאלית קלינית" />
          </div>
        </div>
      </section>

      {/* ============================================================ FOUR MONTHS */}
      <section className="band band-charcoal band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="text-center">
            <Eyebrow>המבנה</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">ארבעה חודשים של למידה, בנייה והטמעה</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div className="reveal rounded-3xl border border-background/15 bg-background/5 p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-[hsl(var(--terracotta))]">3</span>
                <h3 className="font-display text-2xl text-background">חודשים של לימוד ובנייה</h3>
              </div>
              <p className="mt-4 leading-[1.9] text-background/80">בשלושת החודשים הראשונים נלמד את הכלים ונבנה בהדרגה את האסטרטגיה השיווקית והעסקית של הקליניקה שלך. המפגשים מתקיימים בלייב בזום בהנחייתי, ומשלבים:</p>
              <ul className="mt-4 space-y-2.5">
                {["הוראה מקצועית של עקרונות וכלים שיווקיים ועסקיים.", "עבודה רגשית וחווייתית על האתגרים שעולים בכל שלב.", "דוגמאות מתוך המציאות של קליניקות פרטיות.", "שאלות, תרגול ומשימות יישום."].map((t, i) => (
                  <li key={t} className="flex items-start gap-3 text-background/90">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                    {i === 1 ? <Hl dark>{t}</Hl> : t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 leading-[1.9] text-background/80">כבר במהלך הלמידה נתחיל לפעול: ליצור קשרי הפניה, לבנות מסרים, לפרסם תוכן ולתרגל שיחות. כך האסטרטגיה לא נשארת רק תוכנית לעתיד.</p>
            </div>
            <div className="reveal rounded-3xl border border-[hsl(var(--terracotta)/0.5)] bg-[hsl(var(--terracotta)/0.08)] p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-[hsl(var(--terracotta))]">4</span>
                <h3 className="font-display text-2xl text-background">מעבדת יישום והטמעה</h3>
              </div>
              <p className="mt-4 leading-[1.9] text-background/80">בחודש האחרון מרכז הכובד עובר מהלמידה אל היישום.</p>
              <p className="mt-3 leading-[1.9] text-background/80">בכל מפגש נפתח בתזכורת קצרה של כ־15 עד 20 דקות לעקרונות שנלמדו, ואת שאר הזמן נקדיש לתרגול, למשוב ולעבודה על התוצרים והדילמות של המשתתפים.</p>
              <p className="mt-3 leading-[1.9] text-background/80">נבחן את הפעולות שכבר ביצעת, מה עבד, מה עדיין דורש דיוק ואיך להתאים את המשך הדרך לקליניקה שלך.</p>
            </div>
          </div>
          <p className="reveal mx-auto mt-10 max-w-3xl text-center font-display text-xl leading-relaxed text-background">המטרה היא לצאת לא רק עם ידע, אלא עם אסטרטגיה אישית, ניסיון מעשי ויכולת להמשיך לפעול באופן עצמאי.</p>
        </div>
      </section>

      {/* ============================================================ SUPPORT */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>הליווי</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">ליווי שנמצא איתך גם ברגעים המאתגרים</h2>
            <p className="reveal mt-5 text-lg leading-[1.9]">
              כדי לבנות אסטרטגיה שמתאימה לך ולהצליח ליישם אותה, לא תמיד מספיק להקשיב לשיעורים. לפעמים צריך משוב, תרגול, מבט נוסף או מקום לדבר על מה שעוצר אותך. לכן התוכנית כוללת מעטפת ליווי אישית וקבוצתית גם בין המפגשים.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {[
              { Icon: Compass, when: "כשאתה צריך אסטרטגיה שמותאמת לקליניקה שלך", title: "פגישת אסטרטגיה ודיוק אישית איתי", body: "פגישה אחת על אחד שבה נתמקד בקליניקה שלך, במטרות, באתגרים ובהחלטות השיווקיות והעסקיות שכדאי לדייק." },
              { Icon: CalendarCheck, when: "כשיש משהו שלא נוח לך להעלות בפני הקבוצה", title: "חמישי אישי | בכל יום חמישי, 8:00–10:00", body: "חלון שבועי קבוע לפנייה פרטית אליי עם שאלות, התלבטויות וחומרים, כדי שגם נושאים אישיים או רגישים יוכלו לקבל התייחסות.", todo: "אופן המענה והיקפו (לפי התקנון)" },
              { Icon: Sparkles, when: "כשאתה רוצה לתרגל בין המפגשים", title: "בונוס: “המנטור”, סביבת תרגול אישית מבוססת AI", body: "כלי שנבנה במיוחד לעבודה על המיומנויות של התוכנית. באמצעותו אפשר לדייק מסרים, לתרגל שיחות היכרות, להתכונן לפניות לאנשי קשר ולעבוד על משימות התוכנית בקצב שלך. כך אפשר להגיע למפגשים מוכנים יותר ולהשתמש בזמן הליווי כדי להעמיק ולדייק.", note: "המנטור אינו מחליף את הליווי האנושי או את שיקול הדעת המקצועי שלך.", bonus: true },
              { Icon: MessageCircle, when: "כשעולה שאלה במהלך השבוע", title: "קבוצת ליווי בוואטסאפ", body: "מרחב להתייעצות, לשאלות ולשיתוף בהתקדמות בין המפגשים." },
            ].map((c) => (
              <article key={c.title} className={`reveal card-asym p-7 shadow-card ${c.bonus ? "border border-accent/50 bg-accent/10" : "border border-border bg-card"}`}>
                <div className="flex items-center gap-3">
                  <span className="icon-chip">
                    <c.Icon className="h-6 w-6" />
                  </span>
                  <p className="text-sm font-semibold text-accent">{c.when}</p>
                </div>
                <h3 className="mt-4 font-display text-xl text-primary">{c.title}</h3>
                <p className="mt-2 leading-[1.9]">{c.body}</p>
                {c.note && <p className="mt-3 text-sm text-muted-foreground">{c.note}</p>}
                {c.todo && (
                  <p className="mt-3">
                    <Todo>{c.todo}</Todo>
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ BONUS */}
      <section className="band band-burgundy band-grain py-16 md:py-20">
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <span className="inline-block rounded-full border border-[hsl(var(--terracotta)/0.6)] px-4 py-1 text-xs font-semibold tracking-wide text-[hsl(var(--terracotta))]">בונוס מיוחד</span>
          <h2 className="reveal mt-4 font-display text-3xl leading-snug md:text-5xl">מאחורי הקלעים של השיווק שלי</h2>
          <p className="reveal mt-3 font-display text-xl text-primary-foreground/80">איך באמת בונים מהלך שיווקי שמביא אנשים להתעניין בתוכנית?</p>
          <div className="reveal mt-6 space-y-4 text-lg leading-[1.9] text-primary-foreground/85">
            <p>אני אקח אותך אל מאחורי הקלעים של העסק שלי ואפרק את המהלך שבאמצעותו שיווקתי את התוכנית שבה אתה משתתף.</p>
            <p>נראה איך חשבתי על הקהל, בניתי את המסרים, יצרתי תוכן ובחרתי את הדרכים להגיע לאנשים המתאימים. מה עבד, מה למדתי ומה הייתי עושה אחרת.</p>
            <p className="text-primary-foreground/70">לא כמתכון שמתאים לכל אדם, אלא כמקרה בוחן אמיתי שממחיש איך חשיבה אסטרטגית הופכת לפעולות שיווקיות בפועל.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ IS IT FOR YOU */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="reveal text-center font-display text-3xl text-primary md:text-5xl">האם “המומחים” מתאימה לך?</h2>
          <p className="reveal mx-auto mt-5 max-w-2xl text-center text-lg leading-[1.9]">
            התוכנית מיועדת למטפלים, יועצים ומאמנים שרוצים לבנות קליניקה מקצועית, יציבה ומבוקשת, ומוכנים לקחת חלק פעיל בבנייתה. היא יכולה להתאים לך במיוחד אם:
          </p>
          <ul className="mt-10 grid gap-3 md:grid-cols-2">
            {FIT.map((t) => (
              <li key={t} className="reveal flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check className="h-4 w-4" />
                </span>
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
          <div className="reveal mt-10 flex items-start gap-4 rounded-3xl border border-dashed border-border bg-mentor-surface p-7">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground">
              <X className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-xl text-primary">ולמי התוכנית פחות מתאימה?</h3>
              <p className="mt-2 leading-[1.9]">אם אתה מחפש שמישהו אחר יעשה עבורך את כל השיווק, בלי שתצטרך להתנסות, ללמוד ולפעול, זו כנראה לא התוכנית הנכונה עבורך.</p>
              <p className="mt-2 leading-[1.9] text-muted-foreground">“המומחים” נועדה למי שרוצה להבין איך לבנות את הקליניקה שלו ולהוביל את התהליך באופן עצמאי, עם אסטרטגיה, כלים, תרגול ותמיכה מקצועית.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ JOIN + PRICE */}
      <section id="join" className="band band-charcoal band-grain py-16 md:py-24 scroll-mt-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full blur-[150px]" style={{ background: "hsl(var(--accent) / 0.2)" }} />
        </div>
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="text-center">
            <Eyebrow>הצטרפות</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">איך מצטרפים ל“המומחים”?</h2>
            <p className="reveal mt-3 font-display text-xl text-background/75">ארבעה חודשים לבניית הדרך שלך לקליניקה יציבה ומבוקשת</p>
            <p className="reveal mt-1 text-background/60">שלושה חודשי לימוד ובנייה, וחודש של מעבדת יישום והטמעה.</p>
          </div>

          <div className="reveal mx-auto mt-12 max-w-3xl rounded-3xl border border-background/15 bg-background/5 p-8">
            <h3 className="font-display text-xl text-[hsl(var(--terracotta))]">ההרשמה כוללת</h3>
            <ul className="mt-5 space-y-3.5 text-background/90">
              {[
                "מפגשי לימוד ותרגול חיים בזום לאורך שלושת החודשים הראשונים.",
                "חודש של מעבדת יישום והטמעה.",
                "פגישת אסטרטגיה אישית אחת איתי.",
                "“חמישי אישי”, חלון שבועי לפנייה פרטית בימי חמישי בין 8:00 ל־10:00.",
                "קבוצת ליווי בוואטסאפ.",
                "בונוס: גישה למנטור AI לתרגול ולעבודה בין המפגשים.",
                "בונוס: מאחורי הקלעים של המהלך השיווקי שלי.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-background/15 pt-5 text-sm text-background/80">
              <p>
                מועד פתיחת התוכנית: <Todo>תאריך</Todo>
              </p>
              <p>
                מועדי המפגשים: <Todo>לפי לוח התוכנית</Todo>
              </p>
              <p>
                מספר המפגשים ומשך כל מפגש: <Todo>לפי לוח התוכנית הסופי</Todo>
              </p>
            </div>
          </div>

          {/* The price appears only here, after everything the program gives has been read. */}
          <div className="reveal mx-auto mt-14 max-w-xl text-center">
            <p className="font-display text-lg text-background/70">וההשקעה בתוכנית</p>
            <div className="card-asym relative mt-4 bg-background p-8 text-foreground shadow-[var(--shadow-elevated)]">
              <p className="font-display text-sm text-accent">ארבעה חודשים · ליווי אישי וקבוצתי</p>
              <p className="mt-2 font-display text-6xl leading-none text-primary md:text-7xl">
                {PRICE} <span className="text-3xl">₪</span>
              </p>
              <p className="mt-3 text-sm">
                אפשרויות תשלום: <Todo>פירוט</Todo>
              </p>
              <div className="mt-6">
                <JoinButton location="price_card" />
              </div>
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-start">
                <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
                <div>
                  <p className="font-semibold text-primary">שבוע ראשון עם אחריות מלאה</p>
                  <p className="mt-1 text-sm leading-relaxed">ההרשמה כוללת אחריות מלאה ממועד ההצטרפות ועד שבוע לאחר תחילת הקורס.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="reveal mx-auto mt-10 max-w-3xl rounded-3xl border border-background/15 bg-background/5 p-8">
            <h3 className="font-display text-xl text-background">שבוע ראשון עם אחריות מלאה</h3>
            <div className="mt-3 space-y-3 leading-[1.9] text-background/80">
              <p>אני רוצה שתוכל להצטרף מתוך ביטחון, ולא מתוך לחץ לקבל החלטה.</p>
              <p>לכן ההרשמה לתוכנית כוללת <strong className="text-background">אחריות מלאה ממועד ההצטרפות ועד שבוע לאחר תחילת הקורס</strong>. תהיה לך הזדמנות להתחיל את הדרך, להכיר את התוכנית ולהרגיש אם היא מתאימה לך.</p>
              <p>אם במהלך התקופה הזאת תחליט שלא נכון לך להמשיך, תוכל לבטל את השתתפותך ולקבל החזר מלא של הסכום ששילמת, בהתאם לתנאי האחריות.</p>
              <p>
                <Todo>התנאים המדויקים ואופן בקשת הביטול</Todo>
              </p>
            </div>
          </div>

          <div className="reveal mx-auto mt-10 max-w-3xl">
            <p className="mb-4 text-center font-display text-lg text-[hsl(var(--terracotta))]">למי שמתלבט בגלל המחיר</p>
            <div className="grid gap-4 md:grid-cols-2">
              {["התלבטתי בגלל המחיר... אני מאוד שמחה שהשתתפתי בתוכנית.", "המחיר ממש משתלם ביחס לתמורה כי השינוי שעברתי הוא משמעותי."].map((q) => (
                <blockquote key={q} className="rounded-2xl border border-background/15 bg-background/5 p-5 font-display leading-relaxed text-background/90">
                  “{q}”
                </blockquote>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-background/60">בוגרת התוכנית הקודמת, בעילום שם</p>
          </div>

          <div className="mt-10 text-center">
            <JoinButton location="join_section" />
          </div>
        </div>
      </section>

      {/* ============================================================ WAIT A BIT? */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="reveal font-display text-3xl text-primary md:text-4xl">אולי כדאי לחכות עוד קצת?</h2>
          <p className="reveal mt-5 text-lg">אולי אתה אומר לעצמך:</p>
          <div className="reveal mt-4 grid gap-3">
            {["אני אנסה קודם לבד.", "כרגע יש לי יותר מדי דברים על הראש.", "כבר ניסיתי ללמוד שיווק, ולא ראיתי את התוצאות שקיוויתי להן.", "אני רוצה להיות בטוח שההשקעה תחזיר את עצמה."].map((q) => (
              <div key={q} className="rounded-2xl border border-border bg-card px-6 py-4 font-display text-lg italic text-primary">
                “{q}”
              </div>
            ))}
          </div>
          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>אלה שיקולים לגיטימיים. תוכנית ליווי היא השקעה של כסף, זמן ואנרגיה.</p>
            <p>אבל כדאי לשאול גם מה יאפשר למצב להיות שונה בעוד חצי שנה, אם תמשיך לעשות את מה שאתה עושה היום.</p>
            <p>
              לפעמים הבעיה אינה שחסר לך עוד ידע שיווקי, אלא שחסר <Hl>החיבור</Hl> בין אסטרטגיה שמתאימה לקליניקה שלך, ההבנה של האנשים שאתה רוצה להגיע אליהם, והיכולת שלך לפעול גם כשעולים פחדים וספקות.
            </p>
            <p>
              בדיוק על החיבור הזה אנחנו עובדים ב“המומחים”. לא רק כדי שתדע מה נכון לעשות, אלא כדי שתוכל לתרגל, ליישם, לקבל משוב ולבנות דרך פעולה שמתאימה לך.
            </p>
            <p className="text-muted-foreground">אני לא יכולה להבטיח לך כמה מטופלים יגיעו בעקבות התוכנית או בדיוק מתי. אבל אני כן יכולה להציע לך דרך מקצועית, מסגרת ליישום וליווי שיעזור לך להמשיך להתקדם גם כשעולים קשיים.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ ABOUT ELIANA */}
      <section className="band band-burgundy band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.3fr]">
            <div className="reveal relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-[hsl(var(--terracotta)/0.6)]" />
              <img src={elianaPortrait} alt="אליענה שפירא" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-[var(--shadow-elevated)]" />
            </div>
            <div className="reveal">
              <Eyebrow>נעים להכיר</Eyebrow>
              <h2 className="font-display text-3xl leading-snug md:text-5xl">אני אליענה שפירא</h2>
              <div className="mt-5 space-y-4 text-lg leading-[1.9] text-primary-foreground/85">
                <p>אני מטפלת זוגית מאז 2016 ומלווה מטפלים בבניית קליניקה עצמאית שמשקפת את הערכים, המקצועיות והחיים שהם רוצים ליצור.</p>
                <p>
                  אני מייסדת “על שפת הקליניקה”, קהילה של למעלה מ־5,000 אנשי מקצוע מעולמות הטיפול, הריפוי והאימון <Todo>לאמת נתון</Todo>. אני מובילה תהליכי ליווי אישיים וקבוצתיים לבניית קליניקה מבוקשת, ומרצה במוסדות להכשרה מתקדמת של מטפלים.
                </p>
                <p>
                  הגישה שלי נולדה <Hl dark>מהחיבור בין שני עולמות</Hl>: ההבנה הטיפולית של מה שמתרחש בתוכנו כשאנחנו נדרשים להיחשף ולהציע את המומחיות שלנו, והחשיבה השיווקית שמאפשרת להבין את האנשים שמחפשים עזרה ולבנות דרך מקצועית להגיע אליהם.
                </p>
                <p>אני מאמינה שמטפלים לא צריכים לוותר על הערכים שלהם כדי לשווק היטב. אבל הם גם לא צריכים להסתמך רק על כך שאנשים יגלו אותם במקרה.</p>
                <p>אפשר ללמוד שיווק מקצועי, מדויק ואפקטיבי, שמכבד את האדם שמאחורי הקליניקה ואת האנשים שזקוקים לעזרתו.</p>
              </div>
              <div className="mt-8 border-s-4 border-[hsl(var(--terracotta))] ps-5">
                <p className="text-primary-foreground/75">כי שיווק טוב לא צריך לצעוק:</p>
                <p className="font-display text-2xl text-primary-foreground/90">“תראו אותי.”</p>
                <p className="mt-2 text-primary-foreground/75">הוא יכול ללחוש:</p>
                <p className="font-display text-3xl">
                  <Hl dark>“אני רואה אותך.”</Hl>
                </p>
                <p className="mt-2 text-primary-foreground/75">וכשהאדם הנכון מרגיש שרואים אותו, יכולה להיפתח דלת לקשר משמעותי.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ FINAL CTA */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">הגיע הזמן שהמומחיות שלך תקבל מקום בעולם</h2>
          <div className="reveal mt-6 space-y-4 text-lg leading-[1.9]">
            <p>לא צריך להפוך למישהו אחר כדי לבנות קליניקה מבוקשת.</p>
            <p>אפשר ללמוד לבטא את המומחיות שכבר יש לך, ליצור היכרות ואמון עם האנשים הנכונים, ולפתח דרך שיווקית שמתאימה למי שאתה ולחיים שאתה רוצה ליצור.</p>
            <p>אם אתה רוצה להפסיק לחכות שיגלו אותך, ומוכן ללמוד, להתנסות ולפעול כדי להביא את המומחיות שלך לעולם,</p>
            <p className="font-display text-2xl text-primary">אני מזמינה אותך להצטרף ל“המומחים”.</p>
          </div>
          <div className="mt-8">
            <JoinButton location="final" />
          </div>
          <p className="mt-8 font-display text-lg italic text-accent">המומחיות שלך כבר קיימת. עכשיו הגיע הזמן לבנות את הדרך שתביא אותה לאנשים שזקוקים לה.</p>
        </div>
      </section>

      {/* ============================================================ FAQ */}
      <section className="band band-cream pb-24 pt-4">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="reveal text-center font-display text-3xl text-primary md:text-4xl">שאלות נפוצות</h2>
          <Accordion type="single" collapsible className="mt-8 rounded-3xl border border-border bg-card px-6">
            {FAQ.map((f, i) => (
              <AccordionItem key={f.q} value={`q${i}`} className="border-border">
                <AccordionTrigger className="py-5 text-start font-display text-lg text-primary hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="space-y-3 pb-5 text-base leading-[1.9]">
                  {f.a.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="reveal card-asym mt-10 border border-accent/40 bg-accent/10 p-7 text-center">
            <h3 className="font-display text-xl text-primary">יש לך שאלה או התלבטות אישית?</h3>
            <p className="mt-2 leading-[1.9]">לא תמיד אפשר לדעת אם תוכנית מתאימה רק מקריאת דף מכירה. אם יש משהו שחשוב לך לברר, אפשר לכתוב לי בוואטסאפ ולבדוק יחד אם “המומחים” מתאימה לך.</p>
            <a
              href={askHref}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent("experts_question_click", {})}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-5 w-5" />
              יש לי שאלה לאליענה
            </a>
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            על שפת הקליניקה · אליענה שפירא
          </p>
        </div>
      </section>

      {/* Sticky bar: after the first screen, until the price section */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-300 ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <span className="hidden font-display text-lg text-primary sm:block">המומחים</span>
          <JoinButton label="אני רוצה להצטרף" location="sticky_bar" />
        </div>
      </div>
    </div>
  );
};

export default ExpertsSales;
