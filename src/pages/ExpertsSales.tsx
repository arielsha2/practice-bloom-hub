import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  Check,
  Clock,
  Compass,
  Megaphone,
  MessageCircle,
  Mic,
  PhoneCall,
  Quote,
  Sparkles,
  Target,
  Users,
  Video,
  X,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useRevealOnScroll } from "@/hooks/useReveal";
import { trackEvent } from "@/lib/analytics";
import elianaHero from "@/assets/founders/eliana-hero.webp";
import elianaAbout from "@/assets/founders/eliana-about.webp";
import { ProgramMockup } from "@/components/experts/ProgramMockup";
import { ExpertsLeadDialog } from "@/components/experts/ExpertsLeadDialog";
import type { ExpertsPlan, ExpertsPricing } from "@/components/experts/ExpertsLeadDialog";

// Sales page of the "המומחים" program. Updated 17.11.2026 from Eliana's final brief: a cream first screen with her
// photo, her story right after it, "התוכנית כוללת" with a benefit for every part, one length everywhere (4 months,
// opening 30.12.2026), Chaim's video next to the price, the price block with the two Grow links, a real deadline with
// a countdown. The page speaks to women and men alike: gender-neutral wording wherever Hebrew allows it, masculine
// only where it does not. Every join button first opens a short details form
// (name, phone, e-mail → leads) and only then goes on to the Grow payment page. The cancellation policy is NOT on the page until a
// lawyer approves it (the earlier "full refund" promise was removed for the same reason).
//
// Colour language: everything that is Eliana's differentiator, the combination of a precise marketing strategy AND
// the inner work that lets you act on it, is set in the terracotta accent (<Hl>), so the eye follows it down the page.

const PAY_INSTALLMENTS_URL = "https://pay.grow.link/NzkyMDE~075bd9d926572f18c0411c01e6756d65-NDMwODQyMA";
const PAY_SINGLE_URL = "https://pay.grow.link/NzkyMDE~e15034e37e45bcfd61c05f371abdd390-NDMwODQyMg";
const ELIANA_WHATSAPP = "972523379716";
const PRICE_ANCHOR = "7,447";
const PRICE = "6,777";
const PRICE_SINGLE = "6,277";
const INSTALLMENT = "565";
const INSTALLMENTS = 12;
const PRICING: ExpertsPricing = { installmentsUrl: PAY_INSTALLMENTS_URL, singleUrl: PAY_SINGLE_URL, price: PRICE, priceSingle: PRICE_SINGLE, installment: INSTALLMENT, installments: INSTALLMENTS };
const OPENING = "30.12.2026";
// Registration closes on Monday 23.11.2026 at 14:00, Israel time (winter, UTC+2).
const DEADLINE = new Date("2026-11-23T14:00:00+02:00");
const DEADLINE_TEXT = "ההרשמה נסגרת ביום שני, 23.11.2026, בשעה 14:00";

// Google Drive videos (shared "anyone with the link"), played in Drive's own player.
const CHAIM_VIDEO_ID = "1OzoXsJf4Tq6js49wRqozoIDEpU6g_ANn"; // vertical selfie video, 1080x1920
const MENTOR_DEMO_ID = "1PlQ9V45CEOVkjdTyHAC4hYsnCnpMktk9"; // screen recording, 1920x1080

const waLink = (text: string) => `https://wa.me/${ELIANA_WHATSAPP}?text=${encodeURIComponent(text)}`;
const askHref = waLink("היי אליענה, יש לי שאלה על תוכנית המומחים");
const consultHref = waLink("היי אליענה, אשמח לשיחת התייעצות קצרה איתך לפני ההחלטה על תוכנית המומחים");

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

// Every join button opens the details form first (ExpertsLeadDialog), which then goes on to the right Grow link.
const JoinContext = createContext<(plan: ExpertsPlan, location: string) => void>(() => {});

// The main call to action: one large terracotta button (installments), with the single-payment option as a small
// line under it, never as a second large button.
function JoinButton({ label = "אני רוצה להצטרף למומחים", location, withSingle = false, onDark = false }: { label?: string; location: string; withSingle?: boolean; onDark?: boolean }) {
  const join = useContext(JoinContext);
  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-start">
      <button
        type="button"
        onClick={() => join("installments", location)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-accent-foreground shadow-lg transition-opacity hover:opacity-90 sm:w-auto"
      >
        {label}
        <ArrowLeft className="h-5 w-5" />
      </button>
      {withSingle && (
        <button
          type="button"
          onClick={() => join("single", location)}
          className={`text-center text-sm underline-offset-4 hover:underline sm:text-start ${onDark ? "text-background/80" : "text-muted-foreground"}`}
        >
          או בתשלום אחד: <strong className={onDark ? "text-background" : "text-primary"}>{PRICE_SINGLE} ₪</strong> במקום {PRICE} ←
        </button>
      )}
    </div>
  );
}

function WhatsAppButton({ location }: { location: string }) {
  return (
    <a
      href={askHref}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent("experts_question_click", { location })}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90"
    >
      <MessageCircle className="h-5 w-5" />
      שאלה בוואטסאפ
    </a>
  );
}

function ConsultButton({ location, onDark = false }: { location: string; onDark?: boolean }) {
  return (
    <a
      href={consultHref}
      target="_blank"
      rel="noreferrer"
      onClick={() => trackEvent("experts_consult_click", { location })}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-2.5 font-semibold transition-colors ${
        onDark ? "border-background/40 text-background hover:bg-background/10" : "border-primary/40 text-primary hover:bg-primary/5"
      }`}
    >
      <PhoneCall className="h-5 w-5" />
      רוצה להתייעץ איתי לפני שמחליטים
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

// A testimonial as a large cream card on the burgundy band: the strongest sentence as a headline, then the full quote.
// Two of them sit side by side on wide screens and one under the other on phones.
function StoryCard({ headline, quote, who, role }: { headline: string; quote: string; who: string; role: string }) {
  return (
    <figure className="reveal flex h-full flex-col rounded-3xl bg-background p-7 text-right shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)] md:p-9">
      <Quote className="h-9 w-9 text-accent" />
      <p className="mt-4 font-display text-2xl leading-snug text-primary md:text-3xl">{headline}</p>
      <blockquote className="mt-5 flex-1 text-lg leading-[1.9] text-foreground/85">“{quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent">{who.charAt(0)}</span>
        <span className="leading-tight">
          <span className="block font-semibold text-primary">{who}</span>
          <span className="block text-sm text-muted-foreground">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function DriveVideo({ id, title, vertical = false }: { id: string; title: string; vertical?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-border bg-black shadow-[var(--shadow-elevated)] ${vertical ? "mx-auto aspect-[9/16] w-full max-w-[340px]" : "aspect-video w-full"}`}>
      <iframe src={`https://drive.google.com/file/d/${id}/preview`} title={title} allow="autoplay; fullscreen" allowFullScreen loading="lazy" className="h-full w-full border-0" />
    </div>
  );
}

// Days, hours, minutes and seconds to the real deadline. After it, says the registration closed.
function Countdown({ onDark = false }: { onDark?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = DEADLINE.getTime() - now;
  if (left <= 0) return <p className={`font-semibold ${onDark ? "text-background" : "text-primary"}`}>ההרשמה למחזור הזה נסגרה.</p>;
  const s = Math.floor(left / 1000);
  const parts = [
    { v: Math.floor(s / 86400), l: "ימים" },
    { v: Math.floor((s % 86400) / 3600), l: "שעות" },
    { v: Math.floor((s % 3600) / 60), l: "דקות" },
    { v: s % 60, l: "שניות" },
  ];
  return (
    <div className="flex flex-col items-center gap-2">
      <p className={`text-sm font-semibold ${onDark ? "text-background/85" : "text-primary"}`}>{DEADLINE_TEXT}</p>
      <div className="flex gap-2" dir="rtl" aria-label={DEADLINE_TEXT}>
        {parts.map((p) => (
          <div key={p.l} className={`min-w-[64px] rounded-xl px-3 py-2 text-center ${onDark ? "bg-background/10 text-background" : "bg-primary text-primary-foreground"}`}>
            <span className="block font-display text-2xl tabular-nums leading-none">{String(p.v).padStart(2, "0")}</span>
            <span className="mt-1 block text-xs opacity-80">{p.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCENES = [
  { Icon: MessageCircle, when: "כששואלים אותך במה העבודה שלך", body: "יש לך דרך להציג את המומחיות שלך באופן פשוט, מדויק ומעורר עניין, כך שאנשים מבינים למי העבודה שלך עוזרת ובמה." },
  { Icon: Users, when: "כשמתפנה מקום בקליניקה", body: "במקום להמתין ולקוות לפנייה, יש לך רשת קשרים מקצועית ותוכנית פעולה. ברור לך למי לפנות ואיך לעשות זאת בדרך שמכבדת אותך ואת מי שמולך." },
  { Icon: Megaphone, when: "כשמגיע הזמן ליצור תוכן", body: "יש לך מסרים ורעיונות שמבוססים על הבנה עמוקה של האנשים שחשוב לך להגיע אליהם ועל נקודת המבט המקצועית הייחודית שלך. אין צורך לחפש בכל פעם מחדש על מה לכתוב." },
  { Icon: Mic, when: "וכשמישהו מתקשר להתעניין בטיפול", body: "ברור לך איך להוביל שיחה מקצועית ורגישה, לבדוק התאמה, להציג את דרך העבודה ואת המחיר שלך ולעזור למתעניין להבין מה נכון עבורו." },
];

const AREAS = [
  {
    n: "01",
    title: "להכיר במומחיות שלך",
    lead: "לבנות את היסודות המקצועיים והעסקיים של הקליניקה שלך.",
    body: ["נזהה את הידע, הניסיון והכישורים שמייחדים אותך, ונבחין בין תחומים שבהם נדרשת עוד למידה לבין מקומות שבהם כבר יש לך ערך מקצועי שאפשר להביא לעולם.", "נגדיר את החזון שלך, את המטרות המקצועיות והכלכליות ואת הדרך שבה הקליניקה תשתלב בחייך."],
    gets: "מפת מומחיות, חזון מקצועי ויעדים ברורים לבניית הקליניקה.",
  },
  {
    n: "02",
    title: "להיות הכתובת הנכונה",
    lead: "לבנות מיצוב ברור, כדי שהאנשים המתאימים יבינו למה דווקא העזרה שלך מתאימה להם.",
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
    lead: "לתרגם את המומחיות שלך למסרים שגורמים לאנשים הנכונים להבין שהעזרה שלך מתאימה להם.",
    body: ["נלמד להציג את עצמך ואת דרך העבודה שלך בשפה ברורה, אנושית ומדויקת.", "נבנה מסרים שמחברים בין הצרכים של המטופלים לבין הערך שלך, בלי להישמע כמו כולם."],
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
    body: ["נחבר את המיצוב, ערוצי השיווק, קשרי ההפניה, המסרים והתוכן לתוכנית עבודה שמתאימה לקליניקה שלך.", "נגדיר יעדים, סדרי עדיפויות ופעולות קבועות, כך שיהיה ברור במה להתמקד גם אחרי שהתוכנית מסתיימת."],
    gets: "תוכנית שיווקית אישית ומפת דרכים מעשית להמשך בניית הקליניקה.",
  },
];

const FIT = [
  "יש לך ידע וניסיון מקצועי, אבל לא מספיק אנשים מכירים את המומחיות שלך.",
  "כבר עשית פעולות שיווקיות, אבל חסרה לך אסטרטגיה ברורה שמחברת ביניהן.",
  "יש לך קליניקה פעילה, אבל הפניות מגיעות באופן לא עקבי.",
  "חשוב לך לפתח קשרי הפניה ונוכחות מקצועית, בלי תלות רק ברשתות החברתיות.",
  "קשה לך להציג את עצמך, לדבר על המחיר או להפוך שיחות היכרות לתחילת עבודה משותפת.",
  "חשובה לך דרך שיווקית מקצועית שמתאימה לערכים שלך ולמציאות של עולם הטיפול.",
];

// What the program includes, each with the benefit first ("למה זה שווה לי").
const INCLUDES = [
  {
    Icon: Video,
    title: "מפגשים חיים בזום",
    worth: "שם הכלים הופכים לתוצרים: יוצאים מכל מפגש עם עוד חלק בנוי של האסטרטגיה שלך, ולא רק עם רשימות.",
    body: "בכל מפגש לומדים עיקרון או כלי, רואים איך הוא נראה בקליניקות אמיתיות, מתרגלים, ועובדים על מה שעולה בפנים כשצריך ליישם. המפגשים מתקיימים בימים ובשעות משתנים, כדי לאפשר לכמה שיותר משתתפים להגיע.",
  },
  {
    Icon: Compass,
    title: "פגישת אסטרטגיה אישית איתי",
    worth: "יחד נפצח את הנישה הייחודית שלך. גם אם למדת שבע שנים באוניברסיטה, השוק צריך לפגוש ייחוד.",
    body: "פגישה אחת על אחת שבה נתמקד בקליניקה שלך, במטרות, באתגרים ובהחלטות השיווקיות והעסקיות שכדאי לדייק.",
  },
  {
    Icon: CalendarCheck,
    title: "ליווי והטמעה",
    worth: "המעבר מ“ברור לי מה צריך לעשות” ל“עשיתי את זה”: ליווי צמוד ברגע שבו נתקעים, עד שהפעולות קורות בפועל.",
    body: "חודש של מעבדת יישום והטמעה, “חמישי אישי”, חלון שבועי לפנייה פרטית אליי בימי חמישי בין 8:00 ל־10:00, וקבוצת ליווי בוואטסאפ לשאלות ולשיתוף בהתקדמות בין המפגשים.",
  },
  {
    Icon: Sparkles,
    title: "בונוס: המנטור",
    worth: "שותף חשיבה זמין בכל שעה, שלוקח תשובה כללית שלך והופך אותה לניסוח מדויק, כך שמגיעים למפגשים עם חומר מוכן ולא מדף ריק.",
    body: "צ'אט שטעון בידע ובשיטה שלי, לא ChatGPT רגיל. איתו מדייקים את הנישה והמסרים, מתרגלים שיחות היכרות, מתכוננים לפניות לאנשי קשר ועובדים על משימות התוכנית בקצב שלך. המנטור אינו מחליף את הליווי האנושי או את שיקול הדעת המקצועי שלך.",
  },
];

const FAQ = [
  {
    q: "התוכנית נפתחת ב־30.12. למה להירשם עכשיו?",
    a: ["כי העבודה מתחילה מיד. המנטור ופגישת האסטרטגיה האישית זמינים כבר מרגע ההרשמה, כך שאין צורך לחכות חודש וחצי: מתחילים לעבוד על הנישה והמומחיות שלך כבר השבוע, ומגיעים ל־30.12 כשכבר נמצאים בתנועה.", "וחוץ מזה, המחיר עולה בכל השקה. מי שמחכה למחזור הבא יפגוש מחיר גבוה יותר."],
  },
  {
    q: "לא אוכל להגיע לכל המפגשים. זה מתאים לי?",
    a: ["כן. אין חובה להיות בכל המפגשים: כולם מוקלטים וזמינים. המועדים משתנים כדי לאפשר לכמה שיותר משתתפים להגיע, ותאריכי המפגשים נשלחים במייל מיד אחרי ההרשמה, כדי להכניס אותם ליומן."],
  },
  {
    q: "אני לא רוצה להצטלם כל היום לרשתות החברתיות. האם התוכנית מתאימה לי?",
    a: ["בהחלט. התוכנית לא מבוססת על ההנחה שכולם צריכים ליצור סרטונים או להיות פעילים כל הזמן ברשתות החברתיות.", "נלמד לבחור דרכי שיווק שמתאימות למומחיות, לקהל, לאישיות ולמשאבים שלך. אלה יכולות לכלול קשרי הפניה מקצועיים, תוכן כתוב, נוכחות דיגיטלית ודרכים נוספות.", "המטרה היא לבנות נוכחות מקצועית שמתאימה לך, ולא להפוך אותך למישהו אחר."],
  },
  {
    q: "האם התוכנית מתאימה גם אם כבר יש לי קליניקה פעילה?",
    a: ["כן. התוכנית מיועדת גם לאנשי מקצוע שכבר עובדים בקליניקה, אבל רוצים ליצור זרם פניות יציב יותר, לדייק את המיצוב שלהם ולבנות אסטרטגיה שתאפשר להם להתקדם באופן מכוון."],
  },
  {
    q: "האם חייבים לבחור נישה צרה?",
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
  const [lead, setLead] = useState<{ plan: ExpertsPlan; location: string } | null>(null);
  const openJoin = (plan: ExpertsPlan, location: string) => {
    trackEvent("experts_cta_click", { location, plan });
    setLead({ plan, location });
  };

  // Body text in Heebo; headings in Eran when the font is available, otherwise Heebo. Loaded only here.
  useEffect(() => {
    const id = "experts-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }, []);

  // The sticky bar appears once the first screen has been scrolled past, and goes away at the price section.
  useEffect(() => {
    const onScroll = () => {
      const join = document.getElementById("join");
      const pastHero = window.scrollY > window.innerHeight * 0.8;
      const atJoin = join ? join.getBoundingClientRect().top < window.innerHeight * 0.6 && join.getBoundingClientRect().bottom > 0 : false;
      setShowBar(pastHero && !atJoin);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <JoinContext.Provider value={openJoin}>
    <div dir="rtl" className="experts-page min-h-screen bg-background text-foreground">
      <style>{`
        .experts-page { font-family: 'Heebo', 'Assistant', sans-serif; }
        .experts-page .font-display, .experts-page .section-eyebrow { font-family: 'Eran', 'Heebo', sans-serif; font-weight: 600; }
        .experts-page h1.font-display { font-weight: 800; }
        .experts-page .section-eyebrow { letter-spacing: 0.08em; }
      `}</style>
      <SEOHead
        title="המומחים | תוכנית ליווי למטפלים עם אליענה שפירא"
        description={`ממטפל אנונימי למומחה מבוקש: תוכנית ליווי של 4 חודשים, נפתחת ב־${OPENING}. אסטרטגיה שיווקית ועבודה פנימית, בדרך לקליניקה מלאה.`}
        canonicalUrl="/hamumchim"
        ogImage="/og-experts.jpg"
        noindex
      />

      {/* ============================================================ HERO (cream, photo on the left) */}
      <section className="band band-cream relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full blur-[150px]" style={{ background: "hsl(var(--terracotta) / 0.16)" }} />
        </div>
        <div className="container relative z-10 mx-auto flex items-center justify-between gap-4 px-4 pt-5">
          <span className="font-display text-lg text-primary">אליענה שפירא · על שפת הקליניקה</span>
          <a href="#join" onClick={() => trackEvent("experts_cta_click", { location: "top_bar" })} className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-primary transition-colors hover:bg-primary/5">
            להרשמה
          </a>
        </div>
        <div className="container relative z-10 mx-auto px-4 pb-14 pt-8 md:pb-20 md:pt-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.25fr_1fr] lg:gap-14">
            <div>
              <Eyebrow>תוכנית ליווי של 4 חודשים · נפתחת ב־{OPENING}</Eyebrow>
              <p className="font-display text-4xl text-primary md:text-5xl">המומחים</p>
              <h1 className="mt-3 font-display text-4xl leading-[1.2] text-primary md:text-6xl">
                הגיע הזמן להפוך <span className="whitespace-nowrap">ממטפל אנונימי</span>{" "}
                <span className="text-accent" style={{ boxShadow: "inset 0 -0.18em 0 hsl(var(--accent) / 0.35)" }}>
                  למומחה מבוקש
                </span>
              </h1>
              <p className="mt-6 text-xl leading-relaxed text-foreground md:text-2xl">
                אם מרגיש לך שהגיע הזמן להפסיק לחכות שיגלו אותך ולהתחיל לבנות נוכחות מקצועית, שמביאה אליך את האנשים המתאימים, התוכנית הזו בשבילך.
              </p>
              <div className="mt-6 space-y-3 border-s-4 border-accent ps-5 text-lg leading-relaxed">
                <p className="font-semibold text-accent">השקעת עשרות אלפי שקלים ושנים של לימוד בהכשרה המקצועית שלך. הגיע הזמן להתחיל לקטוף את הפירות וליהנות מקליניקה מלאה.</p>
                <p className="text-foreground">
                  אחרי שנים של ניסיון, אני גאה להציג את תוכנית הליווי שלי לאנשי מקצוע שרוצים למלא את היומן ואת הקליניקה, ולהיות מומחים מבוקשים.
                </p>
              </div>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                למטפלים, מאמנים ויועצים: 4 חודשים של לימוד, תרגול וליווי אישי וקבוצתי, שמשלבים <Hl>אסטרטגיה שיווקית ועבודה פנימית</Hl>.
              </p>
              <div className="mt-8">
                <JoinButton location="hero" />
              </div>
            </div>

            {/* On a phone the photo comes first (smaller), so it is on the first screen too. */}
            <div className="relative order-first mx-auto w-full max-w-[240px] md:order-none md:max-w-[570px]">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border-2 border-accent/50" />
              <img src={elianaHero} alt="אליענה שפירא" className="relative aspect-square w-full rounded-[2rem] object-cover shadow-[var(--shadow-elevated)]" />
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

      {/* ============================================================ CHAIM'S VIDEO, right after "זה אפשרי" */}
      <section className="band band-cream pb-8 pt-4 md:pb-12">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="reveal text-center font-display text-3xl leading-snug text-primary md:text-5xl">רואים תוצאות בשטח, אנשים מגיעים אל הקליניקה</h2>
          <div className="reveal mt-8 grid items-center gap-8 md:grid-cols-[340px_1fr]">
            <DriveVideo id={CHAIM_VIDEO_ID} title="העדות של חיים אדרת" vertical />
            <div>
              <Quote className="h-8 w-8 text-accent" />
              <blockquote className="mt-3 font-display text-2xl leading-[1.6] text-primary">“אני יכול לומר שאני רואה תוצאות בשטח. אנשים באים לקליניקה.”</blockquote>
              <p className="mt-4 text-sm text-muted-foreground">חיים אדרת, עובד סוציאלי בהתמחות קלינית, מטפל בהתמכרויות ומנחה קורסים לצוותי חינוך, בוגר התוכנית הקודמת</p>
              <div className="mt-6">
                <JoinButton location="chaim_video" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ THE PROBLEM */}
      <section className="band band-cream pb-16 md:pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Eyebrow>הפער</Eyebrow>
          <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">השקעת שנים בהכשרה המקצועית שלך. אבל כמה אנשים יודעים כמה יש לך לתת?</h2>
          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>למדת, התמקצעת, השקעת בהכשרות וצברת ניסיון.</p>
            <p>בחדר הטיפול הכול ברור: רואים את השינויים שאנשים עוברים בעזרתך, ומכירים את הערך של העבודה שלך.</p>
            <p>אבל מחוץ לחדר הטיפול, משהו אחר קורה.</p>
            <p className="font-display text-2xl text-primary">לא מספיק אנשים מכירים אותך.</p>
            <p>ויש קולגות שהיומן שלהם מלא, שממליצים עליהם ומפנים אליהם מטופלים, ועולה השאלה מה הם עושים אחרת.</p>
            <p>אולי כבר ניסית לפרסם. כתבת פוסט, העלית מודעה, סיפרת לאנשים שיש מקום בקליניקה. לפעמים אפילו קיבלת תגובות יפות.</p>
            <p>אבל זה עדיין לא הפך לזרם יציב של פניות.</p>
            <p>וההמתנה נמשכת: שמישהו ימליץ עליך, שמטופל חדש יתקשר, שמשהו יתחיל לזוז.</p>
          </div>
          <div className="reveal card-asym mt-10 border-s-4 border-accent bg-card p-7 shadow-card">
            <p className="text-xl font-semibold leading-relaxed text-primary">והפער הזה, בין מה שיש לך לתת לבין מה שקורה בקליניקה בפועל, כואב.</p>
            <p className="mt-2 text-muted-foreground">כי לא למדת כל כך הרבה כדי שאף אחד לא יכיר אותך.</p>
          </div>

          <h3 className="reveal mt-16 font-display text-2xl text-primary md:text-4xl">זה לא שאין לך מה לתת</h3>
          <div className="reveal mt-6 space-y-5 text-lg leading-[1.9]">
            <p>יש לך ידע, ניסיון והכשרות מקצועיות. אבל אף אחד לא באמת לימד אותך איך לתרגם אותם לנוכחות מקצועית שאנשים מכירים, זוכרים וממליצים עליה.</p>
            <p>איך לזהות את האנשים שהכי נכון לך לעבוד איתם, ליצור מסרים שיגרמו להם להבין את הערך שלך, לבנות קשרי הפניה ולנהל שיחות היכרות שמובילות לתחילת עבודה משותפת.</p>
            <p className="font-semibold">אלה מיומנויות שיווקיות ועסקיות שאפשר וחשוב ללמוד.</p>
            <p>אבל לפעמים, גם כשכבר יודעים מה נכון לעשות, משהו עוצר דווקא ברגע שבו צריך לפעול.</p>
          </div>

          <div className="reveal mt-8 grid gap-3">
            {["מי אני שאציג את עצמי כמומחה?", "יש כל כך הרבה מטפלים טובים ומנוסים ממני. מה כבר יש לי לחדש?", "אני יודע לעזור לאנשים, אבל איך אשווק את עצמי בלי להרגיש שאני מוכר משהו?"].map((q) => (
              <div key={q} className="rounded-2xl border border-border bg-card px-6 py-4 font-display text-lg italic text-primary">
                “{q}”
              </div>
            ))}
          </div>

          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>אולי ברור לך שכדאי ליצור קשר עם קולגה, אבל יש חשש שהפנייה תישמע כמו בקשת טובה.</p>
            <p>יש לך דעה מקצועית שחשוב לך להשמיע, אבל לא נוח לך להסתכן בכך שלא כולם יסכימו איתה.</p>
            <p>או שברור לך מה המחיר הנכון לעבודתך, אבל ברגע שמישהו מבקש הנחה, קשה לעמוד מאחוריו.</p>
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
              יש מטפלים מצוינים שהיומן שלהם עדיין רחוק מלהיות מלא. אבל כדי שאנשים יוכלו לבחור בך, הם צריכים קודם להכיר אותך, להבין במה העזרה שלך יכולה לשנות להם, ולהרגיש שמצאו את האדם הנכון.
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
            <p className="reveal mt-3 font-display text-xl text-background/75">האדם שמחפש עזרה, ואיש המקצוע שיכול להעניק אותה.</p>
            <p className="reveal mt-6 text-lg leading-[1.9] text-background/85">
              כשאנחנו חושבים על שיווק, אנחנו רגילים לשאול איך להגיע ליותר אנשים, איך לפרסם ואיך לגרום להם להכיר אותנו. אבל יש כאן מפגש עמוק יותר בין שני עולמות פנימיים.
            </p>
          </div>

          <div className="relative mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-2">
            <div className="reveal rounded-3xl border border-background/15 bg-background/5 p-8">
              <p className="font-display text-sm text-background/60">מצד אחד</p>
              <h3 className="mt-1 font-display text-2xl text-background">האדם שמחפש עזרה</h3>
              <p className="mt-4 leading-[1.9] text-background/85">אדם שמתמודד עם קושי, מחפש מענה ולא תמיד יודע למי לפנות או איך לבחור את איש המקצוע המתאים עבורו.</p>
              <p className="mt-3 leading-[1.9] text-background/85">כדי שיוכל לזהות את הערך שלך ולפתח אמון, צריך להבין את המסע שהוא עובר.</p>
              <p className="mt-3 leading-[1.9] text-background/70">מה מעסיק אותו? מה הוא צריך לדעת, להבין ולהרגיש בכל שלב? מה עשוי לעורר בו תקווה, ומה עדיין גורם לו להסס?</p>
            </div>
            <div className="reveal rounded-3xl border border-[hsl(var(--terracotta)/0.5)] bg-[hsl(var(--terracotta)/0.08)] p-8">
              <p className="font-display text-sm text-[hsl(var(--terracotta))]">ומצד שני</p>
              <h3 className="mt-1 font-display text-2xl text-background">יש אותך</h3>
              <p className="mt-4 leading-[1.9] text-background/85">איש מקצוע עם ידע, ניסיון והרבה מה לתת, אבל גם עם עולם פנימי שלם שמתעורר ברגע שצריך לצאת החוצה.</p>
              <p className="mt-3 leading-[1.9] text-background/85">להציג את המומחיות שלך, להביע עמדה, לפנות לאנשים, להזמין אותם לעבוד איתך ולבקש תשלום על השירות שלך.</p>
            </div>
            <div className="absolute left-1/2 top-1/2 z-10 hidden h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[hsl(var(--terracotta))] font-display text-3xl text-[#1e1a18] shadow-lg md:flex">+</div>
          </div>

          <div className="reveal mx-auto mt-14 max-w-3xl text-center">
            <p className="font-display text-3xl leading-snug text-background md:text-4xl">
              השיטה שלי <Hl dark>מחברת בין שני העולמות האלה</Hl>.
            </p>
            <div className="mt-6 space-y-4 text-lg leading-[1.9] text-background/85">
              <p>אנחנו לומדים להבין לעומק את האדם שאנחנו רוצים להגיע אליו, ולבנות אסטרטגיה שיווקית שמדברת אל הצרכים האמיתיים שלו.</p>
              <p>ובאותו הזמן, אנחנו לומדים לזהות מה מתרחש בתוכנו לאורך הדרך, ולפתח את הביטחון והחופש הפנימי שנדרשים כדי להביא את המומחיות שלנו לעולם.</p>
              <p>כך השיווק מפסיק להיות אוסף של פעולות שצריך להכריח את עצמנו לעשות.</p>
              <p className="text-background">הוא הופך לדרך מקצועית, אנושית ומבוססת אמון, שמחברת בין אנשים שזקוקים לעזרה לבין המומחיות שיכולה לתת להם מענה.</p>
            </div>
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
              “המומחים” היא תוכנית ליווי של 4 חודשים למטפלים, מאמנים ויועצים שרוצים לבנות קליניקה יציבה ומבוקשת, בדרך שמשקפת את הערכים, המומחיות והאישיות שלהם.
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
              <p className="mt-5 border-t border-border pt-4 text-sm font-semibold leading-relaxed text-primary">כדי להפסיק לנסות פעולות שיווק אקראיות, ולדעת למה עושים כל פעולה ואיך היא משרתת את בניית הקליניקה.</p>
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

      {/* ============================================================ ABOUT ELIANA (after the two foundations, with a second photo) */}
      <section className="band band-charcoal band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 md:grid-cols-[1fr_1.3fr]">
            <div className="reveal relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-[hsl(var(--terracotta)/0.6)]" />
              <img src={elianaAbout} alt="אליענה שפירא" loading="lazy" className="relative aspect-[4/5] w-full rounded-[2rem] object-cover object-top shadow-[var(--shadow-elevated)]" />
            </div>
            <div className="reveal">
              <Eyebrow>נעים מאוד</Eyebrow>
              <h2 className="font-display text-3xl leading-snug md:text-5xl">אני אליענה שפירא</h2>
              <div className="mt-5 space-y-4 text-lg leading-[1.9] text-primary-foreground/85">
                <p>אני מטפלת זוגית מאז 2016 ומלווה מטפלים בבניית קליניקה עצמאית שמשקפת את הערכים, המקצועיות והחיים שהם רוצים ליצור.</p>
                <p>אני מייסדת “על שפת הקליניקה”, קהילה של למעלה מ־5,000 אנשי מקצוע מעולמות הטיפול, הריפוי והאימון. אני מובילה תהליכי ליווי אישיים וקבוצתיים לבניית קליניקה מבוקשת, ומרצה במוסדות להכשרה מתקדמת של מטפלים.</p>
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

      {/* ============================================================ IMAGINE */}
      <section className="band band-burgundy band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto px-4">
          <h2 className="reveal mx-auto max-w-3xl text-center font-display text-3xl leading-snug md:text-5xl">ככה יכולה להיראות ההתנהלות שלך בעוד כמה חודשים</h2>
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
          <div className="reveal mx-auto mt-10 max-w-3xl text-center text-primary-foreground/85">
            <p className="leading-[1.9]">מאחורי כל אלה עומדת אסטרטגיה ברורה, שמאפשרת לך לדעת במה להתמקד ואיך הפעולות השונות מתחברות לבניית הקליניקה.</p>
            <p className="mt-3 text-sm leading-[1.9] text-primary-foreground/70">לא מדובר בהבטחה שכל פעולה תביא מטופל או שכל רגע יהפוך לקל. אלא בבניית יכולות, כלים ודרך פעולה שמאפשרים לך להתנהל באופן מקצועי, מכוון ובטוח יותר.</p>
          </div>
          <div className="mt-14">
            <p className="mb-6 text-center font-display text-2xl text-[hsl(var(--terracotta))]">כשהאנשים שמגיעים מתאימים למומחיות שלך</p>
            <Testimonial
              dark
              quote="היום מגיעים לקליניקה, באמת מטופלים שאני רוצה לעבוד איתם, שאני שמחה לעבוד איתם, שהם טובים ומדויקים למה שאני רוצה לתת בעולם."
              who="בוגרת התוכנית הקודמת"
            />
          </div>
        </div>
      </section>

      {/* ============================================================ EIGHT AREAS (the road map) */}
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

        </div>
      </section>

      {/* ============================================================ TESTIMONIALS: Miriam and the psychologist, side by side */}
      <section className="band band-burgundy band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          <div className="text-center">
            <Eyebrow>מהבוגרות</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">מה השתנה אצל מי שכבר עשו את הדרך</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <StoryCard
              headline="“לפני חמישה חודשים הייתי במקום אחר לגמרי”"
              quote="אם אני חושבת על עצמי אחורה חמישה חודשים, הייתי במקום אחר לגמרי, מדשדשת שם במחשבות של איך ואיפה, והיום אני עם הרבה פחות פחד, עם הרבה ידע איך לעשות את זה נכון, איך לשווק את זה נכון, איך לתמחר נכון."
              who="מרים"
              role="עובדת סוציאלית קלינית"
            />
            <StoryCard
              headline="“די מהר הקליניקה החלה לפרוח”"
              quote="נרשמתי ל'נקודת המפנה' בתקופה של קליניקה בתחילת דרכה, היו מעט פניות, וגם כשהיו, פעמים רבות השיחה הראשונית לא הובילה לתחילת הטיפול. במהלך התוכנית חידדתי את החשיבה על מי אני כפסיכולוגית, ומה אני מעוניינת לתת למטופלים שלי, ובתקופה קצרה יחסית העברתי זאת החוצה בבהירות ללא התנצלות ועם הבנה של מה אני יכולה לתת בטיפול. די מהר הקליניקה החלה לפרוח."
              who="ל.פ"
              role="פסיכולוגית קלינית, בוגרת “נקודת המפנה”"
            />
          </div>
        </div>
      </section>

      {/* ============================================================ FOUR MONTHS */}
      <section className="band band-charcoal band-grain py-16 md:py-24">
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="text-center">
            <Eyebrow>המבנה</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">תוכנית ליווי של 4 חודשים · נפתחת ב־{OPENING}</h2>
            <p className="reveal mt-3 text-background/75">שלושה חודשים של לימוד ובנייה, וחודש רביעי של יישום והטמעה.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div className="reveal rounded-3xl border border-background/15 bg-background/5 p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-[hsl(var(--terracotta))]">1–3</span>
                <h3 className="font-display text-2xl text-background">חודשים של לימוד ובנייה</h3>
              </div>
              <p className="mt-4 leading-[1.9] text-background/85">בשלושת החודשים הראשונים נלמד את הכלים ונבנה בהדרגה את האסטרטגיה השיווקית והעסקית של הקליניקה שלך. המפגשים מתקיימים בלייב בזום בהנחייתי, ומשלבים:</p>
              <ul className="mt-4 space-y-2.5">
                {["הוראה מקצועית של עקרונות וכלים שיווקיים ועסקיים.", "עבודה רגשית וחווייתית על האתגרים שעולים בכל שלב.", "דוגמאות מתוך המציאות של קליניקות פרטיות.", "שאלות, תרגול ומשימות יישום."].map((t, i) => (
                  <li key={t} className="flex items-start gap-3 text-background/90">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                    {i === 1 ? <Hl dark>{t}</Hl> : t}
                  </li>
                ))}
              </ul>
              <p className="mt-5 leading-[1.9] text-background/85">כבר במהלך הלמידה נתחיל לפעול: ליצור קשרי הפניה, לבנות מסרים, לפרסם תוכן ולתרגל שיחות. כך האסטרטגיה לא נשארת רק תוכנית לעתיד.</p>
            </div>
            <div className="reveal rounded-3xl border border-[hsl(var(--terracotta)/0.5)] bg-[hsl(var(--terracotta)/0.08)] p-8">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-5xl text-[hsl(var(--terracotta))]">4</span>
                <h3 className="font-display text-2xl text-background">מעבדת יישום והטמעה</h3>
              </div>
              <p className="mt-4 leading-[1.9] text-background/85">בחודש האחרון מרכז הכובד עובר מהלמידה אל היישום.</p>
              <p className="mt-3 leading-[1.9] text-background/85">בכל מפגש נפתח בתזכורת קצרה של כ־15 עד 20 דקות לעקרונות שנלמדו, ואת שאר הזמן נקדיש לתרגול, למשוב ולעבודה על התוצרים והדילמות של המשתתפים.</p>
              <p className="mt-3 leading-[1.9] text-background/85">נבחן את הפעולות שכבר ביצעת, מה עבד, מה עדיין דורש דיוק ואיך להתאים את המשך הדרך לקליניקה שלך.</p>
            </div>
          </div>
          <p className="reveal mx-auto mt-10 max-w-3xl text-center font-display text-xl leading-relaxed text-background">המטרה היא לצאת לא רק עם ידע, אלא עם אסטרטגיה אישית, ניסיון מעשי ויכולת להמשיך לפעול באופן עצמאי.</p>
        </div>
      </section>

      {/* ============================================================ THE PROGRAM INCLUDES (a benefit for every part) */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow>התוכנית כוללת</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">בנייה מא' ועד ת' של כל התשתיות השיווקיות והעסקיות</h2>
            <p className="reveal mt-4 text-lg leading-[1.9]">שיאפשרו לך לפגוש לקוחות רבים בשנים הקרובות.</p>
          </div>
          <div className="reveal mt-10">
            <ProgramMockup />
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {INCLUDES.map((c, i) => (
              <article key={c.title} className={`reveal card-asym p-7 shadow-card ${i === 3 ? "border border-accent/50 bg-accent/10" : "border border-border bg-card"}`}>
                <div className="flex items-center gap-3">
                  <span className="icon-chip">
                    <c.Icon className="h-6 w-6" />
                  </span>
                  <h3 className="font-display text-xl text-primary">{c.title}</h3>
                </div>
                <p className="mt-4 font-semibold leading-relaxed text-accent">{c.worth}</p>
                <p className="mt-2 leading-[1.9]">{c.body}</p>
              </article>
            ))}
          </div>
          <p className="reveal mx-auto mt-8 max-w-3xl rounded-2xl bg-primary px-6 py-4 text-center text-lg font-bold text-primary-foreground">אין חובה להיות בכל המפגשים: כולם מוקלטים וזמינים.</p>

          <div className="reveal mx-auto mt-14 max-w-4xl">
            <h3 className="text-center font-display text-2xl text-primary md:text-3xl">ככה נראית התייעצות עם המנטור</h3>
            <p className="mx-auto mt-2 max-w-2xl text-center leading-[1.9] text-muted-foreground">תשובה כללית של מטפלת על הנישה שלה, והניסוח המדויק שיוצא ממנה. לא ChatGPT רגיל: צ'אט שטעון בידע ובשיטה שלי.</p>
            <div className="mt-6">
              <DriveVideo id={MENTOR_DEMO_ID} title="דמו: התייעצות עם המנטור" />
            </div>
          </div>

          <div className="reveal card-asym mx-auto mt-14 max-w-3xl border-s-4 border-accent bg-card p-7 shadow-card">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 shrink-0 text-accent" />
              <h3 className="font-display text-xl text-primary">התוכנית נפתחת ב־{OPENING}, אבל העבודה מתחילה מיד</h3>
            </div>
            <p className="mt-3 leading-[1.9]">המנטור ופגישת האסטרטגיה האישית זמינים כבר מרגע ההרשמה. אין צורך לחכות חודש וחצי: מתחילים לעבוד על הנישה והמומחיות שלך כבר השבוע, ומגיעים ל־{OPENING} כשכבר נמצאים בתנועה.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ BONUS */}
      <section className="band band-burgundy band-grain py-16 md:py-20">
        <div className="container relative z-10 mx-auto max-w-3xl px-4 text-center">
          <span className="inline-block rounded-full border border-[hsl(var(--terracotta)/0.6)] px-4 py-1 text-xs font-semibold tracking-wide text-[hsl(var(--terracotta))]">בונוס מיוחד</span>
          <h2 className="reveal mt-4 font-display text-3xl leading-snug md:text-5xl">מאחורי הקלעים של השיווק שלי</h2>
          <p className="reveal mt-3 font-display text-xl text-primary-foreground/85">איך באמת בונים מהלך שיווקי שמביא אנשים להתעניין בתוכנית?</p>
          <div className="reveal mt-6 space-y-4 text-lg leading-[1.9] text-primary-foreground/85">
            <p>אקח אותך אל מאחורי הקלעים של העסק שלי ואפרק את המהלך שבאמצעותו שיווקתי את התוכנית שבה משתתפים.</p>
            <p>נראה איך חשבתי על הקהל, בניתי את המסרים, יצרתי תוכן ובחרתי את הדרכים להגיע לאנשים המתאימים. מה עבד, מה למדתי ומה הייתי עושה אחרת.</p>
            <p className="text-primary-foreground/75">לא כמתכון שמתאים לכל אחד, אלא כמקרה בוחן אמיתי שממחיש איך חשיבה אסטרטגית הופכת לפעולות שיווקיות בפועל.</p>
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
              <p className="mt-2 leading-[1.9]">אם המטרה היא שמישהו אחר יעשה עבורך את כל השיווק, בלי להתנסות, ללמוד ולפעול, זו כנראה לא התוכנית הנכונה עבורך.</p>
              <p className="mt-2 leading-[1.9] text-muted-foreground">“המומחים” נועדה למי שרוצה להבין איך בונים קליניקה, ולהוביל את התהליך באופן עצמאי, עם אסטרטגיה, כלים, תרגול ותמיכה מקצועית.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ JOIN + PRICE */}
      <section id="join" className="band band-charcoal band-grain scroll-mt-4 py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-40 -left-40 h-[460px] w-[460px] rounded-full blur-[150px]" style={{ background: "hsl(var(--accent) / 0.2)" }} />
        </div>
        <div className="container relative z-10 mx-auto max-w-5xl px-4">
          <div className="text-center">
            <Eyebrow>הצטרפות</Eyebrow>
            <h2 className="reveal font-display text-3xl leading-snug text-background md:text-5xl">איך מצטרפים ל“המומחים”?</h2>
            <p className="reveal mt-3 font-display text-xl text-background/80">תוכנית ליווי של 4 חודשים · נפתחת ב־{OPENING}</p>
          </div>

          <div className="reveal mx-auto mt-12 max-w-3xl rounded-3xl border border-background/15 bg-background/5 p-8">
            <h3 className="font-display text-xl text-[hsl(var(--terracotta))]">ההרשמה כוללת</h3>
            <ul className="mt-5 space-y-3.5 text-background/90">
              {[
                "מפגשי לימוד ותרגול חיים בזום לאורך שלושת החודשים הראשונים, כולם מוקלטים.",
                "חודש של מעבדת יישום והטמעה.",
                "פגישת אסטרטגיה אישית אחת איתי.",
                "“חמישי אישי”, חלון שבועי לפנייה פרטית בימי חמישי בין 8:00 ל־10:00.",
                "קבוצת ליווי בוואטסאפ.",
                "בונוס: גישה למנטור לתרגול ולעבודה בין המפגשים.",
                "בונוס: מאחורי הקלעים של המהלך השיווקי שלי.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[hsl(var(--terracotta))]" />
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-background/15 pt-5 text-sm text-background/85">
              <p>פתיחת התוכנית: {OPENING}.</p>
              <p>המפגשים מתקיימים בימים ובשעות משתנים, כדי לאפשר לכמה שיותר משתתפים להגיע. תאריכי המפגשים נשלחים במייל מיד אחרי ההרשמה, להכנסה ליומן.</p>
            </div>
          </div>

          {/* The price appears only here, after everything the program gives has been read. */}
          <div className="reveal mx-auto mt-14 max-w-xl text-center">
            <p className="font-display text-lg text-background/80">וההשקעה בתוכנית</p>
            <div className="card-asym relative mt-4 bg-background p-8 text-foreground shadow-[var(--shadow-elevated)]">
              <p className="text-muted-foreground">
                מחיר מלא <span className="line-through">{PRICE_ANCHOR} ₪</span>
              </p>
              <p className="mt-2 text-lg">
                מחיר מיוחד למשתתפי האתגר: <span className="font-semibold text-primary">{PRICE} ₪</span>
              </p>
              <p className="mt-5 font-display text-6xl leading-none text-primary md:text-7xl">
                {INSTALLMENT} <span className="text-3xl">₪</span>
              </p>
              <p className="mt-2 text-lg font-semibold text-accent">× {INSTALLMENTS} תשלומים שווים ללא ריבית</p>
              <p className="mt-2 rounded-xl bg-accent/10 px-4 py-2 text-base">
                או בתשלום אחד: <strong className="text-primary">{PRICE_SINGLE} ₪</strong>, חיסכון של 500 ₪
              </p>
              <p className="mt-2 text-xs text-muted-foreground">כל המחירים כוללים מע"מ.</p>
              <div className="mt-6 flex justify-center">
                <JoinButton location="price_card" withSingle />
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <Countdown />
              </div>
            </div>
          </div>

          <div className="reveal mx-auto mt-10 max-w-3xl rounded-3xl border border-background/15 bg-background/5 p-7 text-center">
            <h3 className="font-display text-xl text-background">למה להירשם עכשיו?</h3>
            <p className="mt-3 leading-[1.9] text-background/85">
              המחיר עולה בכל השקה. מי שמחכה למחזור הבא יפגוש מחיר גבוה יותר, ולא תהיה דרך לחזור אחורה. וחוץ מזה, העבודה מתחילה מיד: המנטור ופגישת האסטרטגיה האישית זמינים כבר מרגע ההרשמה.
            </p>
          </div>

          <div className="reveal mx-auto mt-10 max-w-3xl rounded-3xl border border-[hsl(var(--terracotta)/0.5)] bg-[hsl(var(--terracotta)/0.08)] p-7 text-center">
            <h3 className="font-display text-xl text-background">רוצה להתייעץ לפני שמחליטים?</h3>
            <p className="mt-2 leading-[1.9] text-background/85">זו השקעה משמעותית, וטבעי לגמרי לרצות לדבר עליה קודם. אפשר לקבוע איתי שיחה אישית של כחצי שעה, ולבדוק יחד אם “המומחים” מתאימה לך.</p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ConsultButton location="price" onDark />
              <WhatsAppButton location="price" />
            </div>
          </div>

          <div className="reveal mx-auto mt-10 max-w-3xl">
            <p className="mb-4 text-center font-display text-lg text-[hsl(var(--terracotta))]">למי שמתלבטים בגלל המחיר</p>
            <div className="grid gap-4 md:grid-cols-2">
              {["התלבטתי בגלל המחיר... אני מאוד שמחה שהשתתפתי בתוכנית.", "המחיר ממש משתלם ביחס לתמורה כי השינוי שעברתי הוא משמעותי."].map((q) => (
                <blockquote key={q} className="rounded-2xl border border-background/15 bg-background/5 p-5 font-display leading-relaxed text-background/90">
                  “{q}”
                </blockquote>
              ))}
            </div>
            <p className="mt-3 text-center text-sm text-background/70">בוגרת התוכנית הקודמת, בעילום שם</p>
          </div>
        </div>
      </section>

      {/* ============================================================ WAIT A BIT? */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="reveal font-display text-3xl text-primary md:text-4xl">אולי כדאי לחכות עוד קצת?</h2>
          <p className="reveal mt-5 text-lg">אולי עולות מחשבות כמו:</p>
          <div className="reveal mt-4 grid gap-3">
            {["אני אנסה קודם לבד.", "כרגע יש לי יותר מדי דברים על הראש.", "כבר ניסיתי ללמוד שיווק, ולא ראיתי את התוצאות שקיוויתי להן.", "חשוב לי לדעת שההשקעה תחזיר את עצמה."].map((q) => (
              <div key={q} className="rounded-2xl border border-border bg-card px-6 py-4 font-display text-lg italic text-primary">
                “{q}”
              </div>
            ))}
          </div>
          <div className="reveal mt-8 space-y-5 text-lg leading-[1.9]">
            <p>אלה שיקולים לגיטימיים. תוכנית ליווי היא השקעה של כסף, זמן ואנרגיה.</p>
            <p>אבל כדאי לשאול גם מה יאפשר למצב להיות שונה בעוד חצי שנה, אם הכול ימשיך כמו היום.</p>
            <p>
              לפעמים הבעיה אינה שחסר לך עוד ידע שיווקי, אלא שחסר <Hl>החיבור</Hl> בין אסטרטגיה שמתאימה לקליניקה שלך, ההבנה של האנשים שחשוב לך להגיע אליהם, והיכולת שלך לפעול גם כשעולים פחדים וספקות.
            </p>
            <p>בדיוק על החיבור הזה אנחנו עובדים ב“המומחים”. לא רק כדי לדעת מה נכון לעשות, אלא כדי לתרגל, ליישם, לקבל משוב ולבנות דרך פעולה שמתאימה לך.</p>
            <p className="text-muted-foreground">אני לא יכולה להבטיח לך כמה מטופלים יגיעו בעקבות התוכנית או בדיוק מתי. אבל אני כן יכולה להציע לך דרך מקצועית, מסגרת ליישום וליווי שיעזור לך להמשיך להתקדם גם כשעולים קשיים.</p>
          </div>
        </div>
      </section>

      {/* ============================================================ FINAL CTA */}
      <section className="band band-cream py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="reveal font-display text-3xl leading-snug text-primary md:text-5xl">הגיע הזמן שהמומחיות שלך תקבל מקום בעולם</h2>
          <div className="reveal mt-6 space-y-4 text-lg leading-[1.9]">
            <p>לא צריך להפוך למישהו אחר כדי לבנות קליניקה מבוקשת.</p>
            <p>אפשר ללמוד לבטא את המומחיות שכבר יש לך, ליצור היכרות ואמון עם האנשים הנכונים, ולפתח דרך שיווקית שמתאימה לך ולחיים שחשוב לך ליצור.</p>
            <p>אם הגיע הזמן להפסיק לחכות שיגלו אותך, ויש בך נכונות ללמוד, להתנסות ולפעול כדי להביא את המומחיות שלך לעולם,</p>
            <p className="font-display text-2xl text-primary">אני מזמינה אותך להצטרף ל“המומחים”.</p>
          </div>
          <div className="mt-8 flex justify-center">
            <JoinButton location="final" withSingle />
          </div>
          <div className="mt-8">
            <Countdown />
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
            <p className="mt-2 leading-[1.9]">לא תמיד אפשר לדעת אם תוכנית מתאימה רק מקריאת דף מכירה. אפשר לכתוב לי בוואטסאפ, או לקבוע שיחה אישית קצרה, ולבדוק יחד אם “המומחים” מתאימה לך.</p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <WhatsAppButton location="faq" />
              <ConsultButton location="faq" />
            </div>
          </div>
          <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            על שפת הקליניקה · אליענה שפירא
          </p>
        </div>
      </section>

      {/* Sticky bar: after the first screen, hidden while the price section is on screen */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur transition-transform duration-300 ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <span className="hidden font-display text-lg text-primary sm:block">המומחים · נפתחת ב־{OPENING}</span>
          <button
            type="button"
            onClick={() => openJoin("installments", "sticky_bar")}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground shadow-lg transition-opacity hover:opacity-90 sm:w-auto"
          >
            אני רוצה להצטרף
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
      </div>

      <ExpertsLeadDialog
        open={lead !== null}
        location={lead?.location ?? ""}
        pricing={PRICING}
        onClose={() => setLead(null)}
      />
    </div>
    </JoinContext.Provider>
  );
};

export default ExpertsSales;
