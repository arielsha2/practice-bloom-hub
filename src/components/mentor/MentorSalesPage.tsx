import { motion } from "framer-motion";
import { useRevealOnScroll } from "@/hooks/useReveal";
import {
  Sparkles,
  Check,
  Clock,
  MessageCircle,
  Compass,
  KeyRound,
  HeartHandshake,
  ScrollText,
  Telescope,
  Anchor,
  Feather,
  Gem,
  Flame,
  Users2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";
import { useLanguage } from "@/contexts/LanguageContext";

const PAYMENT_URL = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";
const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=972523379716&text&type=phone_number&app_absent=0";

function openPayment() {
  window.open(PAYMENT_URL, "_blank", "noopener,noreferrer");
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="section-eyebrow">{children}</div>;
}

function Divider() {
  return (
    <div className="section-divider" aria-hidden="true">
      <span className="dot" />
    </div>
  );
}

function Band({
  tone,
  children,
  className = "",
  id,
}: {
  tone: "cream" | "charcoal" | "burgundy";
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const toneClass = tone === "cream" ? "band-cream" : tone === "charcoal" ? "band-charcoal" : "band-burgundy";
  return (
    <section id={id} className={`band band-grain ${toneClass} ${className}`}>
      <div className="container mx-auto px-4 max-w-4xl pt-20 pb-24 relative z-10">{children}</div>
    </section>
  );
}

function InterludeBanner({ text }: { text: string }) {
  return (
    <section className="band band-burgundy band-grain">
      <div className="container mx-auto px-4 max-w-2xl py-12 text-center">
        <p className="font-display text-xl md:text-2xl leading-snug text-background">{text}</p>
      </div>
    </section>
  );
}

const stageIcons = [Compass, Gem, Telescope, HeartHandshake, KeyRound];
const experienceIcons = [Clock, Anchor, ScrollText, Flame];

const COPY = {
  he: {
    badge: "גרסת בטא · 20 מקומות בלבד",
    hero: {
      title: "המנטור לקליניקה",
      subtitle: ["סופרוויז׳ן רגיש לעסק.", "לרשותך בכל זמן, בכל מקום."],
      body: "ליווי AI אישי שמוביל אותך שלב אחר שלב למלא את הקליניקה במטופלים הנכונים. באותנטיות, בביטחון, ובלי להרגיש מכירתי.",
      cta: "אני רוצה להיות אחד מ־20",
      ctaNote: "גישה לתמיד · כולל כל השיפורים העתידיים",
    },
    problem: {
      eyebrow: "הפער",
      title: ["שנים של הכשרות בפסיכותרפיה.", "אבל אף אחד לא לימד אותך את זה."],
      intro: "למדת טיפול. למדת שיטות התערבות. למדת איך להחזיק מרחב טיפולי. אבל שאלות מהותיות נשארו פתוחות:",
      questions: [
        "איך מוצאים מטופלים?",
        "איך מסבירים מה ייחודי בטיפול שלך כדי שאנשים ירצו להגיע דווקא אליך?",
        "איך ממלאים את הקליניקה באופן נעים ואותנטי, בלי להרגיש נזקקות ובלי להיות מכירתיים?",
        "כמה לתמחר את השעה הטיפולית שלך, ואיך להציג את המחיר בביטחון?",
      ],
      closing: "זה לא נלמד בשום מקום. אז איך יכולת לדעת?",
    },
    personas: {
      title: "את החידה הזו מטפלים מנסים לפתור לבד.",
      subtitle: "וזה לוקח הרבה זמן והרבה טעויות בדרך.",
      list: [
        "מי שמוריד מחירים כי לא בטוח שמגיע לו יותר.",
        "מי שיודע שיש לו מה להציע, אבל כשצריך להסביר את זה למישהו, המילים נתקעות.",
        'מי שמנסה "לעשות שיווק", ומרגיש שזה לא הוא.',
        "מי שמחכה שהקליניקה תגדל מעצמה. שאם הטיפול שלו יהיה ממש מעולה, השמועה תתפשט מאליה.",
        "מי שחוזר שוב ושוב לעבודה הציבורית, למרות השעות הרבות והמשכורת הלא מוצדקת, כי זה מייאש לקדם את הקליניקה לבד.",
        "מי שכבר ניסה. קנה ספרים, קורסים, קרא, הבין. ואז לא עשה כלום עם זה. כי ידע לבד לא מזיז אנשים.",
        "מי שיודע שהוא צריך ליווי אישי, אבל תוכנית ליווי איכותית עולה אלפי שקלים, וכרגע זה לא אפשרי.",
      ],
      outro1: "הבעיה היא לא רצון. היא לא כישרון. ואפילו לא הביטחון המקצועי.",
      outro2: ["מה שחסר לך: אף אחד לא לימד אותך את המיומנויות האלה.", "ואי אפשר לתרגל משהו שלא ידעת שצריך."],
    },
    interlude: "אף אחד לא לימד אותך את זה. אז איך יכולת לדעת?",
    solution: {
      title: "מה אם היה מישהו שמחזיק אותך בדיוק שם?",
      p1: "לא ידע שנשאר על המדף. לא תוכן שצורכים ושוכחים. לא תיאוריות - אלא ליווי מעשי.",
      p2: "מישהו שיושב איתך, שואל את השאלות הנכונות ומכוון אותך לתשובה שכבר קיימת בתוכך. מישהו שמוביל אותך לגירסה שלך שיודעת למלא את הקליניקה בביטחון ובאותנטיות.",
      p3: "הכוונה אישית. מיקוד. פעולות מדויקות.",
      p4: "הדבקת הפער בין המומחיות המקצועית שלך לבין היכולת שלך להביא מטופלים מתאימים לקליניקה.",
      cta: "זה המנטור לקליניקה.",
    },
    stages: {
      eyebrow: "חמשת השלבים",
      title: "מה המנטור עושה בפועל.",
      subtitle: "הוא מלווה אותך דרך חמישה שלבים מדויקים.",
      stepLabel: "שלב",
      items: [
        { title: "מי אתה כמטפל", text: "לא תיאור קליני. הייחוד שלך. מה אתה עושה שאחרים לא עושים. מה גורם למטופלים לרצות דווקא אותך." },
        { title: "כמה הערך של העבודה איתך", text: "לא מספר שרירותי. מחיר שנובע מערך אמיתי, ושאפשר לומר בלי להתנצל." },
        { title: "מאיפה יגיעו הלקוחות", text: 'בחירת אנשי קשר ספציפיים שימליצו עליך, במקום "לירות בכל הכיוונים" ולא להבין למה אנשים לא פונים.' },
        { title: "איך מדברים עם אנשי קשר", text: "תרגול אמיתי, שיחה אמיתית, משוב מיידי." },
        { title: "איך להציג את עצמך", text: "המשפט שגורם לאנשים לרצות לשלוח אליך לקוחות." },
      ],
      innerLabel: "הרובד הפנימי",
      innerTitle: "ובמקביל, העבודה שמתחת לפני השטח.",
      innerText: "הביטחון והנוכחות המקצועית. היכולת להתחבר לערך האמיתי שלך ולשדר אותו. כי זה מה שבאמת מעכב גם כשיש את כל הידע העסקי.",
    },
    experience: {
      eyebrow: "החוויה",
      title: "איך זה נראה בפועל?",
      items: [
        { title: "זמין מתי שמתאים לך", text: "בבוקר או בערב, בין מטופלים, אפילו בסוף יום ארוך." },
        { title: "זוכר אותך", text: "הוא זוכר מה אמרת בפגישה הקודמת וממשיך מאיפה שעצרתם." },
        { title: "שאלות ממקדות", text: "לא צ׳ט פתוח. AI שמאומן על השיטה שלנו, מותאם למטפלים כדי להביא תוצאות בפועל." },
        { title: "שולח לפעולה", text: "מחכה שתחזור לדווח מה עבד ומה צריך המשך שיכלול." },
      ],
      closing: "כמו סופרוויז׳ן. רק שזמין תמיד, מכיר אותך לעומק, ועם סבלנות אינסופית.",
    },
    proof: {
      eyebrow: "מהשטח",
      title: "מה קרה למטפלים שעבדו איתו.",
      quotes: [
        "מטפלת אחת העלתה מחירים, וסיפרה שלראשונה הרגישה שהיא מקבלת תגמול שהיא באמת ראויה לו.",
        "מטפל אחר מצא את המנטור, התנסה, וקנה מיוזמתו. עוד לפני שהצענו.",
      ],
    },
    beta: {
      eyebrow: "גרסת מייסדים",
      title: "20 מטפלים. תנאים שלא יחזרו.",
      exclusive: "בלעדי למייסדים",
      seats: "20 מקומות בלבד",
      p1: "התמזל מזלך להיות בין 20 המטפלים הראשונים שנזמין בתנאים מיוחדים שלא יחזרו.",
      p2: "בתמורה, אנחנו מבקשים את המשוב הכן שלך. מה עובד, מה לא, מה חסר. חשוב לנו שהמנטור ייתן את המענה הטוב ביותר למטפלים כמוך.",
      warningTitle: "המנטור מיועד למטפלים שמוכנים לא רק לקרוא, אלא לעשות.",
      warningBody: "כל שלב מסתיים בפעולות ליישום בעולם האמיתי. אם אתה מחפש עוד ידע לצבור, זה לא בשבילך. אם אתה מוכן להיות בתנועה, אנחנו כאן.",
    },
    pricing: {
      investment: "ההשקעה שלך",
      futurePrice: "מחיר המנטור בהמשך:",
      futurePriceValue: "₪1,800",
      currentPrice: "₪750",
      priceNote: "תשלום חד פעמי · כולל מע״מ · למייסדים - המצטרפים בגרסת הבטא",
      bullets: ["גישה מלאה לתמיד", "כולל כל השיפורים העתידיים", "פחות משני מפגשי סופרוויז׳ן", "שלך לתמיד"],
      cta: "אני רוצה להיות אחד מ־20",
      secure: "תשלום מאובטח דרך משולם",
    },
    contact: {
      title: "שאלות?",
      body: "כתבו לאליענה ישירות. היא עונה אישית.",
      whatsapp: "שליחת הודעה בוואטסאפ",
    },
  },
  en: {
    badge: "Beta · 20 founding seats only",
    hero: {
      title: "The Clinic Mentor",
      subtitle: ["Sensitive business supervision.", "Available to you anytime, anywhere."],
      body: "An AI personal guide that leads you step by step to fill your practice with the right clients — authentically and confidently.",
      cta: "I want one of the 20 seats",
      ctaNote: "Lifetime access · Including all future improvements",
    },
    problem: {
      eyebrow: "The gap",
      title: ["Years of psychotherapy training.", "But no one ever taught you this."],
      intro: "You learned therapy. You learned intervention methods. You learned how to hold a therapeutic space. But essential questions were left unanswered:",
      questions: [
        "How do you find clients?",
        "How do you explain what makes your therapy unique so people want to come specifically to you?",
        "How do you fill your practice authentically — without feeling desperate or salesy?",
        "How do you price your sessions and state your fee with confidence?",
      ],
      closing: "This is never taught anywhere. So how could you have known?",
    },
    personas: {
      title: "Therapists try to solve this puzzle alone.",
      subtitle: "And it takes a long time, with many mistakes along the way.",
      list: [
        "Who lowers their fees because they're not sure they deserve more.",
        "Who knows they have something to offer — but when they need to explain it, the words get stuck.",
        "Who tries to 'do marketing' — and feels like that's just not them.",
        "Who waits for the practice to grow on its own.",
        "Who keeps going back to institutional work because building a practice alone is exhausting.",
        "Who already tried. Bought courses, read, understood. And then did nothing with it. Because knowledge alone doesn't move people.",
        "Who knows they need personal guidance — but a quality program costs thousands of dollars. And right now, that's not possible.",
      ],
      outro1: "The problem isn't willingness. It isn't talent. It isn't even professional confidence.",
      outro2: ["What's missing is that no one ever taught you these skills.", "And you can't practice something you didn't know you needed."],
    },
    interlude: "No one ever taught you this. So how could you have known?",
    solution: {
      title: "What if someone held you right there?",
      p1: "Not a lecturer. Not a course. Not knowledge that sits on a shelf. Not theories — but practical guidance.",
      p2: "Someone who sits with you, asks the right questions, and leads you to the answer that already exists within you.",
      p3: "Personal guidance. Focus. Precise actions.",
      p4: "Bridging the gap between your expertise and your ability to bring the right clients.",
      cta: "This is the Clinic Mentor.",
    },
    stages: {
      eyebrow: "The five stages",
      title: "What the Mentor actually does.",
      subtitle: "It guides you through five precise stages.",
      stepLabel: "Stage",
      items: [
        { title: "Who you are as a therapist", text: "Your uniqueness. What makes clients want specifically you." },
        { title: "What your work is worth", text: "A price that comes from real value — one you can state without apologizing." },
        { title: "Where clients will come from", text: "Specific referral contacts — instead of shooting in all directions." },
        { title: "How to talk to referral contacts", text: "Real practice, real conversation, immediate feedback." },
        { title: "How to present yourself", text: "The sentence that makes people want to send you clients." },
      ],
      innerLabel: "And alongside all of this",
      innerTitle: "The work beneath the surface.",
      innerText: "The Mentor works on what's beneath the surface — confidence, professional presence, and the ability to connect with your real value.",
    },
    experience: {
      eyebrow: "The experience",
      title: "What does it actually look like?",
      items: [
        { title: "Available when it suits you", text: "You come when it suits you — morning, evening, between clients." },
        { title: "Remembers you", text: "It remembers what you said in the previous session." },
        { title: "Focused questions", text: "It asks focused questions — not open-ended chat. AI trained on our method." },
        { title: "Sends you to action", text: "It sends you to one specific action. And waits for you to identify what worked." },
      ],
      closing: "Like supervision — only always available, with infinite patience.",
    },
    proof: {
      eyebrow: "From the field",
      title: "What happened to therapists who worked with it.",
      quotes: [
        "I raised my prices — and for the first time felt I was receiving compensation I truly deserved.",
        "I found the Mentor, tried it — and bought on my own initiative. Before it was even offered to me.",
      ],
    },
    beta: {
      eyebrow: "Founding members",
      title: "Founding members — 20 seats only",
      exclusive: "Exclusive to founders",
      seats: "20 seats only",
      p1: "In exchange for the special price — we ask for your honest feedback.",
      p2: "What works, what doesn't, what's missing. It matters to us that the Mentor delivers the best possible support for therapists like you.",
      warningTitle: "The Clinic Mentor is for therapists ready not just to read — but to act.",
      warningBody: "If you're ready to move — we're here.",
    },
    pricing: {
      investment: "Your investment",
      futurePrice: "Regular price:",
      futurePriceValue: "₪1,800 (~$600 USD)",
      currentPrice: "₪750",
      priceNote: "(~$250 USD) · One-time payment, incl. VAT",
      bullets: ["Lifetime full access", "Including all future improvements", "Less than two supervision sessions", "Yours forever"],
      cta: "I want one of the 20 founding seats",
      secure: "Secure payment via Meshulam",
    },
    contact: {
      title: "Questions?",
      body: "Message Eliana directly.",
      whatsapp: "Send a WhatsApp message",
    },
  },
} as const;

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function MentorSalesPage() {
  useRevealOnScroll();
  const { language, isRTL } = useLanguage();
  const t = COPY[language];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} lang={language} className="bg-background text-foreground">
      {/* ============ HERO ============ */}
      <section
        className="band band-grain relative w-full overflow-hidden"
        style={{ backgroundColor: "#2a0614", color: "hsl(var(--background))" }}
      >
        <div
          className="container mx-auto px-4 max-w-4xl relative z-10 text-center"
          style={{ paddingTop: "clamp(72px, 8vw, 100px)", paddingBottom: "clamp(72px, 7vw, 90px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border border-accent/40 bg-accent/10"
            style={{ color: "hsl(var(--terracotta))" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6"
            style={{ textShadow: "0 2px 12px rgba(75,11,36,0.5)" }}
          >
            {t.hero.title}
            <span
              className="block mt-4 text-2xl md:text-4xl lg:text-5xl font-display"
              style={{ color: "hsl(var(--terracotta))" }}
            >
              {t.hero.subtitle[0]}
              <br className="hidden md:block" />
              {t.hero.subtitle[1]}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 text-background/75"
          >
            {t.hero.body}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="my-4"
          >
            <button
              onClick={openPayment}
              className="inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                borderRadius: "4px",
                background: "#9e5a38",
                color: "#faf7f2",
                padding: "22px 64px",
                fontSize: "19px",
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(75,11,36,0.4)",
              }}
            >
              {t.hero.cta}
            </button>
            <p
              style={{
                fontSize: "12px",
                color: "rgba(250,247,242,0.4)",
                marginTop: "0.75rem",
                textAlign: "center",
              }}
            >
              {t.hero.ctaNote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ PROBLEM — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
          <Eyebrow>{t.problem.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t.problem.title[0]}
            <br />
            {t.problem.title[1]}
          </h2>
          <Divider />
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            {t.problem.intro}
          </p>
        </motion.div>

        <motion.ul {...fadeUp} className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {t.problem.questions.map((q, i) => (
            <li key={i} className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5 shadow-soft">
              <span className="icon-chip shrink-0" style={{ width: 44, height: 44 }}>
                <HelpCircle className="w-5 h-5" />
              </span>
              <span className="text-foreground leading-relaxed pt-1.5">{q}</span>
            </li>
          ))}
        </motion.ul>

        <motion.p {...fadeUp} className="text-lg md:text-xl font-semibold text-center text-foreground mt-12">
          {t.problem.closing}
        </motion.p>
      </Band>

      {/* ============ PERSONAS — BURGUNDY ============ */}
      <Band tone="burgundy">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t.personas.title}
          </h2>
          <Divider />
          <p className="text-background/80 text-base md:text-lg mb-10">{t.personas.subtitle}</p>
        </motion.div>

        <motion.ul {...fadeUp} className="flex flex-col gap-3 max-w-3xl mx-auto">
          {t.personas.list.map((p, i) => (
            <li
              key={i}
              className={`reveal stagger-${Math.min(i, 4)} flex items-center gap-6 py-5 px-6 md:px-8 border border-background/15 bg-background/[0.06] rounded-tr-2xl rounded-tl-none rounded-br-none rounded-bl-none min-h-[72px]`}
            >
              <span
                className="shrink-0 font-display text-xs tnum tracking-wider"
                style={{ color: "hsl(var(--terracotta))" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-background/90 leading-relaxed text-start">{p}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div {...fadeUp} className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-base md:text-lg leading-relaxed text-background/85">
            {t.personas.outro1}
          </p>
          <p className="text-lg md:text-xl font-semibold leading-relaxed text-background mt-3">
            {t.personas.outro2[0]}
            <br />
            {t.personas.outro2[1]}
          </p>
        </motion.div>
      </Band>

      {/* ============ INTERLUDE ============ */}
      <InterludeBanner text={t.interlude} />

      {/* ============ SOLUTION INTRO — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t.solution.title}
          </h2>
          <Divider />
        </motion.div>

        <motion.div
          {...fadeUp}
          className="relative bg-card border border-border rounded-3xl p-8 md:p-12 max-w-3xl mx-auto shadow-card"
        >
          <span className={`icon-chip absolute -top-7 ${isRTL ? "right-8" : "left-8"}`}>
            <HeartHandshake className="w-6 h-6" />
          </span>
          <div className="space-y-5 text-foreground leading-relaxed text-lg">
            <p className="text-muted-foreground">{t.solution.p1}</p>
            <p>{t.solution.p2}</p>
            <p className="font-display text-xl md:text-2xl" style={{ color: "hsl(var(--accent))" }}>
              {t.solution.p3}
            </p>
            <p className="text-muted-foreground">{t.solution.p4}</p>
            <p className="text-2xl md:text-3xl font-display pt-3 text-primary">{t.solution.cta}</p>
          </div>
        </motion.div>
      </Band>

      {/* ============ STAGES — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>{t.stages.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.stages.title}</h2>
          <Divider />
          <p className="text-background/75 text-base md:text-lg mb-12">{t.stages.subtitle}</p>
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {t.stages.items.map((s, i) => {
            const Icon = stageIcons[i];
            return (
              <div
                key={i}
                className="relative rounded-2xl p-7 border border-background/15 bg-background/[0.04] hover:bg-background/[0.07] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <span className="icon-chip shrink-0">
                    <Icon className="w-6 h-6" />
                  </span>
                  <div className="pt-1">
                    <div className="step-numeral mb-1.5">{t.stages.stepLabel} {String(i + 1).padStart(2, "0")}</div>
                    <h3 className="font-display text-xl mb-2 text-background">{s.title}</h3>
                    <p className="text-background/70 leading-relaxed text-sm md:text-base">{s.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>

        <motion.div
          {...fadeUp}
          className="mt-10 max-w-3xl mx-auto rounded-2xl p-7 md:p-8 border border-accent/40 bg-accent/[0.07]"
        >
          <div className="flex items-start gap-4">
            <span className="icon-chip shrink-0">
              <Feather className="w-6 h-6" />
            </span>
            <div className="pt-1">
              <div className="step-numeral mb-1.5">{t.stages.innerLabel}</div>
              <h3 className="font-display text-xl mb-2 text-background">{t.stages.innerTitle}</h3>
              <p className="text-background/75 leading-relaxed">{t.stages.innerText}</p>
            </div>
          </div>
        </motion.div>
      </Band>

      {/* ============ EXPERIENCE — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>{t.experience.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.experience.title}</h2>
          <Divider />
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {t.experience.items.map((e, i) => {
            const Icon = experienceIcons[i];
            return (
              <div
                key={i}
                className="bg-card border border-border rounded-2xl p-7 shadow-soft hover:shadow-card transition-shadow"
              >
                <span className="icon-chip mb-5">
                  <Icon className="w-6 h-6" />
                </span>
                <h3 className="font-display text-xl mb-2 text-foreground">{e.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{e.text}</p>
              </div>
            );
          })}
        </motion.div>

        <motion.p
          {...fadeUp}
          className="text-center text-base md:text-xl text-foreground mt-12 max-w-2xl mx-auto italic font-display"
        >
          {t.experience.closing}
        </motion.p>
      </Band>

      {/* ============ SOCIAL PROOF — BURGUNDY ============ */}
      <Band tone="burgundy">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>{t.proof.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t.proof.title}
          </h2>
          <Divider />
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {t.proof.quotes.map((q, i) => (
            <div key={i} className="relative rounded-2xl p-8 border border-background/15 bg-background/[0.06]">
              <p className="pull-quote relative text-background leading-relaxed text-lg">{q}</p>
            </div>
          ))}
        </motion.div>
      </Band>

      {/* ============ BETA + PRICING — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
          <Eyebrow>{t.beta.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            {t.beta.title}
          </h2>
          <Divider />
        </motion.div>

        <motion.div
          {...fadeUp}
          className="max-w-3xl mx-auto rounded-3xl border border-accent/40 bg-background/[0.04] p-8 md:p-12 mb-10"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="icon-chip">
              <Users2 className="w-6 h-6" />
            </span>
            <div>
              <div className="step-numeral">{t.beta.exclusive}</div>
              <div className="font-display text-xl text-background">{t.beta.seats}</div>
            </div>
          </div>
          <div className="space-y-4 text-background/85 leading-relaxed">
            <p>{t.beta.p1}</p>
            <p>{t.beta.p2}</p>
            <div className="rounded-xl p-5 border border-background/15 bg-background/[0.04] mt-4">
              <p className="font-semibold text-background mb-1.5">{t.beta.warningTitle}</p>
              <p className="text-sm text-background/65">{t.beta.warningBody}</p>
            </div>
          </div>
        </motion.div>

        {/* PRICING CARD */}
        <motion.div
          {...fadeUp}
          className="reveal shimmer-once card-asym max-w-2xl mx-auto bg-background text-foreground p-8 md:p-12 text-center shadow-elevated"
        >
          <p className="font-display text-xl md:text-2xl text-foreground mb-3">{t.pricing.investment}</p>
          <p className="text-base md:text-lg text-muted-foreground mb-2">
            {t.pricing.futurePrice}{" "}
            <span className="line-through opacity-80 tnum font-display text-2xl md:text-3xl text-foreground/80 mx-1">
              {t.pricing.futurePriceValue}
            </span>
          </p>
          <div className="inline-flex items-baseline gap-2 mb-3">
            <span className="font-display text-6xl md:text-7xl tnum" style={{ color: "hsl(var(--accent))" }}>
              {t.pricing.currentPrice}
            </span>
          </div>
          <p className="text-base md:text-lg text-foreground font-medium mb-8">
            {t.pricing.priceNote}
          </p>
          <ul className="text-start max-w-md mx-auto space-y-3 mb-10">
            {t.pricing.bullets.map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground">
                <span className="icon-chip shrink-0" style={{ width: 32, height: 32 }}>
                  <Check className="w-4 h-4" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="py-3">
            <button
              onClick={openPayment}
              className="inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 w-full sm:w-auto"
              style={{
                borderRadius: "4px",
                background: "#9e5a38",
                color: "#faf7f2",
                padding: "22px 64px",
                fontSize: "19px",
                fontWeight: 600,
                boxShadow: "0 4px 16px rgba(75,11,36,0.4)",
              }}
            >
              {t.pricing.cta}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-5 tracking-wide">{t.pricing.secure}</p>
        </motion.div>
      </Band>

      {/* ============ CONTACT — CREAM ============ */}
      <Band tone="cream" className="!py-16">
        <motion.div {...fadeUp} className="text-center max-w-xl mx-auto">
          <span className="icon-chip mx-auto mb-5">
            <MessageCircle className="w-6 h-6" />
          </span>
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">{t.contact.title}</h3>
          <p className="text-muted-foreground mb-6">{t.contact.body}</p>
          <Button
            variant="cta-dark"
            size="lg"
            onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
          >
            <MessageCircle className="w-4 h-4" />
            {t.contact.whatsapp}
          </Button>
        </motion.div>
      </Band>

      {/* COMING SOON BANNER */}
      <div className="band band-cream">
        <div className="container mx-auto px-4 max-w-4xl pb-16">
          <WebsiteComingSoonCard variant="paywall" />
        </div>
      </div>
    </div>
  );
}

export default MentorSalesPage;
