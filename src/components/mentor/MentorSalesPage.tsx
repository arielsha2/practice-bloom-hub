import { motion } from "framer-motion";
import { useRevealOnScroll } from "@/hooks/useReveal";
import { JourneyMap } from "@/components/mentor/JourneyMap";
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

const personas = [
  "מי שמוריד מחירים כי לא בטוח שמגיע לו יותר.",
  "מי שיודע שיש לו מה להציע, אבל כשצריך להסביר את זה למישהו, המילים נתקעות.",
  'מי שמנסה "לעשות שיווק", ומרגיש שזה לא הוא.',
  "מי שמחכה שהקליניקה תגדל מעצמה. שאם הטיפול שלו יהיה ממש מעולה, השמועה תתפשט מאליה.",
  "מי שחוזר שוב ושוב לעבודה הציבורית, למרות השעות הרבות והמשכורת הלא מוצדקת, כי זה מייאש לקדם את הקליניקה לבד.",
  "מי שכבר ניסה. קנה ספרים, קורסים, קרא, הבין. ואז לא עשה כלום עם זה. כי ידע לבד לא מזיז אנשים.",
  "מי שיודע שהוא צריך ליווי אישי, אבל תוכנית ליווי איכותית עולה אלפי שקלים, וכרגע זה לא אפשרי.",
];

const stages = [
  {
    icon: Compass,
    title: "מי אתה כמטפל",
    text: "לא תיאור קליני. הייחוד שלך. מה אתה עושה שאחרים לא עושים. מה גורם למטופלים לרצות דווקא אותך.",
  },
  {
    icon: Gem,
    title: "כמה הערך של העבודה איתך",
    text: "לא מספר שרירותי. מחיר שנובע מערך אמיתי, ושאפשר לומר בלי להתנצל.",
  },
  {
    icon: Telescope,
    title: "מאיפה יגיעו הלקוחות",
    text: 'בחירת אנשי קשר ספציפיים שימליצו עליך, במקום "לירות בכל הכיוונים" ולא להבין למה אנשים לא פונים.',
  },
  {
    icon: HeartHandshake,
    title: "איך מדברים עם אנשי קשר",
    text: "תרגול אמיתי, שיחה אמיתית, משוב מיידי.",
  },
  {
    icon: KeyRound,
    title: "איך להציג את עצמך",
    text: "המשפט שגורם לאנשים לרצות לשלוח אליך לקוחות.",
  },
];

const experiencePoints = [
  {
    icon: Clock,
    title: "זמין מתי שמתאים לך",
    text: "בבוקר או בערב, בין מטופלים, אפילו בסוף יום ארוך.",
  },
  {
    icon: Anchor,
    title: "זוכר אותך",
    text: "הוא זוכר מה אמרת בפגישה הקודמת וממשיך מאיפה שעצרתם.",
  },
  {
    icon: ScrollText,
    title: "שאלות ממקדות",
    text: "לא צ׳ט פתוח. AI שמאומן על השיטה שלנו, מותאם למטפלים כדי להביא תוצאות בפועל.",
  },
  {
    icon: Flame,
    title: "שולח לפעולה",
    text: "מחכה שתחזור לדווח מה עבד ומה צריך המשך שיכלול.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

export function MentorSalesPage() {
  useRevealOnScroll();
  return (
    <div dir="rtl" className="bg-background text-foreground">
      {/* ============ HERO — CHARCOAL ============ */}
      <Band tone="charcoal" className="!py-0">
        <div className="text-center pt-6 md:pt-8 pb-20 md:pb-28">
          {/* Live personal journey map */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="max-w-5xl mx-auto mb-6 md:mb-8"
          >
            <JourneyMap />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border border-accent/40 bg-accent/10"
            style={{ color: "hsl(var(--terracotta))" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            גרסת בטא · 20 מקומות בלבד
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6"
          >
            המנטור לקליניקה
            <span
              className="block mt-4 text-2xl md:text-4xl lg:text-5xl font-display"
              style={{ color: "hsl(var(--terracotta))" }}
            >
              סופרוויז׳ן רגיש לעסק.
              <br className="hidden md:block" />
              לרשותך בכל זמן, בכל מקום.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-10 text-background/75"
          >
            ליווי AI אישי שמוביל אותך שלב אחר שלב למלא את הקליניקה במטופלים הנכונים. באותנטיות, בביטחון, ובלי להרגיש
            מכירתי.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <Button variant="cta" size="xl" onClick={openPayment}>
              אני רוצה להיות אחד מ־20
            </Button>
            <p className="text-xs text-background/55 mt-5 tracking-wide">גישה לתמיד · כולל כל השיפורים העתידיים</p>
          </motion.div>
        </div>
      </Band>

      {/* ============ PROBLEM — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="max-w-3xl mx-auto text-center">
          <Eyebrow>הפער</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            שנים של הכשרות בפסיכותרפיה.
            <br />
            אבל אף אחד לא לימד אותך את זה.
          </h2>
          <Divider />
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            למדת טיפול. למדת שיטות התערבות. למדת איך להחזיק מרחב טיפולי. אבל השאלות הבאות נשארו פתוחות:
          </p>
        </motion.div>

        <motion.ul {...fadeUp} className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {[
            "איך מוצאים מטופלים?",
            "איך מסבירים מה ייחודי בטיפול שלך כדי שאנשים ירצו להגיע דווקא אליך?",
            "איך ממלאים את הקליניקה באופן נעים ואותנטי, בלי להרגיש נזקקות ובלי להיות מכירתיים?",
            "כמה לתמחר את השעה הטיפולית שלך, ואיך להציג את המחיר בביטחון?",
          ].map((q, i) => (
            <li key={i} className="flex items-start gap-4 bg-card border border-border rounded-2xl p-5 shadow-soft">
              <span className="icon-chip shrink-0" style={{ width: 44, height: 44 }}>
                <HelpCircle className="w-5 h-5" />
              </span>
              <span className="text-foreground leading-relaxed pt-1.5">{q}</span>
            </li>
          ))}
        </motion.ul>

        <motion.p {...fadeUp} className="text-lg md:text-xl font-semibold text-center text-foreground mt-12">
          זה לא נלמד בשום מקום. אז איך יכולת לדעת?
        </motion.p>
      </Band>

      {/* ============ PERSONAS — BURGUNDY ============ */}
      <Band tone="burgundy">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>זיהוי</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            את החידה הזו מטפלים מנסים לפתור לבד.
          </h2>
          <Divider />
          <p className="text-background/80 text-base md:text-lg mb-10">וזה לוקח הרבה זמן והרבה טעויות בדרך.</p>
        </motion.div>

        <motion.ul {...fadeUp} className="grid md:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {personas.map((p, i) => {
            // Asymmetric 60/40 rhythm: cards alternate 3-col / 2-col widths
            const span = i % 2 === 0 ? "md:col-span-3" : "md:col-span-2";
            return (
              <li
                key={i}
                className={`card-asym flex items-start gap-4 p-5 border border-background/15 bg-background/[0.06] backdrop-blur-sm ${span}`}
              >
                <span
                  className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-display text-sm border tnum"
                  style={{
                    color: "hsl(var(--terracotta))",
                    borderColor: "hsl(var(--terracotta) / 0.5)",
                    background: "hsl(var(--foreground) / 0.3)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-background pt-1">{p}</span>
              </li>
            );
          })}
        </motion.ul>

        <motion.div {...fadeUp} className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-base md:text-lg leading-relaxed text-background/85">
            הבעיה היא לא רצון. היא לא כישרון. ואפילו לא הביטחון המקצועי.
          </p>
          <p className="text-lg md:text-xl font-semibold leading-relaxed text-background mt-3">
            מה שחסר לך: אף אחד לא לימד אותך את המיומנויות האלה.
            <br />
            ואי אפשר לתרגל משהו שלא ידעת שצריך.
          </p>
        </motion.div>
      </Band>

      {/* ============ INTERLUDE ============ */}
      <InterludeBanner text="אף אחד לא לימד אותך את זה. אז איך יכולת לדעת?" />

      {/* ============ SOLUTION INTRO — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>המענה</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            מה אם היה מישהו שמחזיק אותך בדיוק שם?
          </h2>
          <Divider />
        </motion.div>

        <motion.div
          {...fadeUp}
          className="relative bg-card border border-border rounded-3xl p-8 md:p-12 max-w-3xl mx-auto shadow-card"
        >
          <span className="icon-chip absolute -top-7 right-8">
            <HeartHandshake className="w-6 h-6" />
          </span>
          <div className="space-y-5 text-foreground leading-relaxed text-lg">
            <p className="text-muted-foreground">לא מרצה. לא קורס. לא עוד תוכן לצרוך.</p>
            <p>
              מישהו שיושב איתך, שואל את השאלות הנכונות, ומוביל אותך לתשובה שכבר קיימת בתוכך. לגרסה שלך שיודעת למלא את
              הקליניקה בביטחון ובאותנטיות.
            </p>
            <p className="font-display text-xl md:text-2xl" style={{ color: "hsl(var(--accent))" }}>
              הכוונה אישית. מיקוד. פעולות מדויקות.
            </p>
            <p className="text-muted-foreground">
              הדבקת הפער בין המומחיות המקצועית שלך לבין היכולת שלך להביא מטופלים מתאימים לקליניקה.
            </p>
            <p className="text-2xl md:text-3xl font-display pt-3 text-primary">זה המנטור לקליניקה.</p>
          </div>
        </motion.div>
      </Band>

      {/* ============ STAGES — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>חמשת השלבים</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">מה המנטור עושה בפועל.</h2>
          <Divider />
          <p className="text-background/75 text-base md:text-lg mb-12">הוא מלווה אותך דרך חמישה שלבים מדויקים.</p>
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {stages.map((s, i) => {
            const Icon = s.icon;
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
                    <div className="step-numeral mb-1.5">שלב {String(i + 1).padStart(2, "0")}</div>
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
              <div className="step-numeral mb-1.5">הרובד הפנימי</div>
              <h3 className="font-display text-xl mb-2 text-background">ובמקביל, העבודה שמתחת לפני השטח.</h3>
              <p className="text-background/75 leading-relaxed">
                הביטחון והנוכחות המקצועית. היכולת להתחבר לערך האמיתי שלך ולשדר אותו. כי זה מה שבאמת מעכב גם כשיש את כל
                הידע העסקי.
              </p>
            </div>
          </div>
        </motion.div>
      </Band>

      {/* ============ EXPERIENCE — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>החוויה</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">איך זה נראה בפועל?</h2>
          <Divider />
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {experiencePoints.map((e, i) => {
            const Icon = e.icon;
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
          כמו סופרוויז׳ן. רק שזמין תמיד, מכיר אותך לעומק, ועם סבלנות אינסופית.
        </motion.p>
      </Band>

      {/* ============ SOCIAL PROOF — BURGUNDY ============ */}
      <Band tone="burgundy">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>מהשטח</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            מה קרה למטפלים שעבדו איתו.
          </h2>
          <Divider />
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="relative rounded-2xl p-8 border border-background/15 bg-background/[0.06]">
            <p className="pull-quote relative text-background leading-relaxed text-lg">
              מטפלת אחת העלתה מחירים, וסיפרה שלראשונה הרגישה שהיא מקבלת תגמול שהיא באמת ראויה לו.
            </p>
          </div>
          <div className="relative rounded-2xl p-8 border border-background/15 bg-background/[0.06]">
            <p className="pull-quote relative text-background leading-relaxed text-lg">
              מטפל אחר מצא את המנטור, התנסה, וקנה מיוזמתו. עוד לפני שהצענו.
            </p>
          </div>
        </motion.div>
      </Band>

      {/* ============ BETA + PRICING — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
          <Eyebrow>גרסת מייסדים</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">
            20 מטפלים. תנאים שלא יחזרו.
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
              <div className="step-numeral">בלעדי למייסדים</div>
              <div className="font-display text-xl text-background">20 מקומות בלבד</div>
            </div>
          </div>
          <div className="space-y-4 text-background/85 leading-relaxed">
            <p>התמזל מזלך להיות בין 20 המטפלים הראשונים שנזמין בתנאים מיוחדים שלא יחזרו.</p>
            <p>
              בתמורה, אנחנו מבקשים את המשוב הכן שלך. מה עובד, מה לא, מה חסר. חשוב לנו שהמנטור ייתן את המענה הטוב ביותר
              למטפלים כמוך.
            </p>
            <div className="rounded-xl p-5 border border-background/15 bg-background/[0.04] mt-4">
              <p className="font-semibold text-background mb-1.5">
                המנטור מיועד למטפלים שמוכנים לא רק לקרוא, אלא לעשות.
              </p>
              <p className="text-sm text-background/65">
                כל שלב מסתיים בפעולות ליישום בעולם האמיתי. אם אתה מחפש עוד ידע לצבור, זה לא בשבילך. אם אתה מוכן להיות
                בתנועה, אנחנו כאן.
              </p>
            </div>
          </div>
        </motion.div>

        {/* PRICING CARD — asymmetric corners + single shimmer sweep on entry */}
        <motion.div
          {...fadeUp}
          className="reveal shimmer-once card-asym max-w-2xl mx-auto bg-background text-foreground p-8 md:p-12 text-center shadow-elevated"
        >
          <Eyebrow>מה ההשקעה שלך</Eyebrow>
          <p className="text-sm text-muted-foreground mb-2">
            מחיר קבוע בהמשך: <span className="line-through opacity-70 tnum">₪1,800</span>
          </p>

          <div className="inline-flex items-baseline gap-2 mb-3">
            <span className="font-display text-6xl md:text-7xl tnum" style={{ color: "hsl(var(--accent))" }}>
              ₪750
            </span>
          </div>
          <p className="text-base md:text-lg text-foreground font-medium mb-8">
            תשלום חד פעמי · כולל מע״מ · למייסדי גרסת הבטא
          </p>

          <ul className="text-right max-w-md mx-auto space-y-3 mb-10">
            {["גישה מלאה לתמיד", "כולל כל השיפורים העתידיים", "פחות משני מפגשי סופרוויז׳ן", "שלך לתמיד"].map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground">
                <span className="icon-chip shrink-0" style={{ width: 32, height: 32 }}>
                  <Check className="w-4 h-4" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <Button variant="cta" size="xl" onClick={openPayment} className="w-full sm:w-auto">
            אני רוצה להיות אחד מ־20
          </Button>

          <p className="text-xs text-muted-foreground mt-5 tracking-wide">תשלום מאובטח דרך משולם</p>
        </motion.div>
      </Band>

      {/* ============ CONTACT — CREAM ============ */}
      <Band tone="cream" className="!py-16">
        <motion.div {...fadeUp} className="text-center max-w-xl mx-auto">
          <span className="icon-chip mx-auto mb-5">
            <MessageCircle className="w-6 h-6" />
          </span>
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-2">שאלות?</h3>
          <p className="text-muted-foreground mb-6">כתבו לאליענה ישירות. היא עונה אישית.</p>
          <Button
            variant="cta-dark"
            size="lg"
            onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
          >
            <MessageCircle className="w-4 h-4" />
            שליחת הודעה בוואטסאפ
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
