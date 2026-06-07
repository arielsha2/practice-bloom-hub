import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Clock,
  MessageCircle,
  Target,
  Heart,
  Users2,
  TrendingUp,
  HelpCircle,
  Compass,
  Tag,
  User as UserIcon,
  Users,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";

const PAYMENT_URL =
  "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";
const WHATSAPP_URL =
  "https://api.whatsapp.com/send/?phone=972523379716&text&type=phone_number&app_absent=0";

function CTAButton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      size="xl"
      onClick={() => window.open(PAYMENT_URL, "_blank", "noopener,noreferrer")}
      className={`bg-mentor-accent hover:bg-mentor-accent/90 text-mentor-accent-foreground shadow-elevated ${className}`}
    >
      {children}
    </Button>
  );
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`container mx-auto px-4 max-w-3xl py-10 md:py-14 ${className}`}
    >
      {children}
    </motion.section>
  );
}

const personas = [
  "מי שמוריד מחירים כי לא בטוח שמגיע לו יותר.",
  "מי שיודע שיש לו מה להציע — אבל כשצריך להסביר את זה למישהו, המילים נתקעות.",
  'מי שמנסה "לעשות שיווק" — ומרגיש שזה לא הוא.',
  "מי שמחכה שהקליניקה תגדל מעצמה — שאם הטיפול שלו יהיה ממש מעולה, השמועה תתפשט מאליה.",
  "מי שחוזר שוב ושוב לעבודה הציבורית, למרות השעות הרבות והמשכורת הלא מוצדקת, כי זה מייאש לקדם את הקליניקה לבד.",
  "מי שכבר ניסה — קנה ספרים, קורסים, קרא, הבין — ואז לא עשה כלום עם זה. כי ידע לבד לא מזיז אנשים.",
  "מי שיודע שהוא צריך ליווי אישי — אבל תוכנית ליווי איכותית עולה אלפי שקלים, וכרגע זה לא אפשרי.",
];

const stages = [
  {
    icon: UserIcon,
    title: "מי אתה כמטפל",
    text: "לא תיאור קליני. הייחוד שלך. מה אתה עושה שאחרים לא עושים. מה גורם למטופלים לרצות דווקא אותך.",
  },
  {
    icon: Tag,
    title: "כמה הערך של העבודה איתך",
    text: "לא מספר שרירותי. מחיר שנובע מערך אמיתי — ושאפשר לומר בלי להתנצל.",
  },
  {
    icon: Compass,
    title: "מאיפה יגיעו הלקוחות",
    text: 'בחירת אנשי קשר ספציפיים שימליצו עליך, במקום "לירות בכל הכיוונים" ולא להבין למה אנשים לא פונים.',
  },
  {
    icon: Users,
    title: "איך מדברים עם אנשי קשר",
    text: "תרגול אמיתי, שיחה אמיתית, משוב מיידי.",
  },
  {
    icon: Trophy,
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
    icon: Heart,
    title: "זוכר אותך",
    text: "הוא זוכר מה אמרת בפגישה הקודמת וממשיך מאיפה שעצרתם.",
  },
  {
    icon: Target,
    title: "שאלות ממקדות",
    text: "לא צ׳ט פתוח. AI שמאומן על השיטה שלנו — מותאם למטפלים כדי להביא תוצאות בפועל.",
  },
  {
    icon: TrendingUp,
    title: "שולח לפעולה",
    text: "מחכה שתחזור לדווח מה עבד ומה צריך המשך שיכלול.",
  },
];

export function MentorSalesPage() {
  return (
    <div dir="rtl" className="bg-mentor-bg text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-mentor-surface to-mentor-bg">
        <div className="container mx-auto px-4 max-w-3xl pt-12 pb-14 md:pt-20 md:pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentor-accent/15 text-mentor-accent text-xs font-semibold mb-5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            גרסת בטא · 20 מקומות בלבד
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="text-3xl md:text-5xl font-bold text-foreground leading-tight mb-5"
          >
            המנטור לקליניקה
            <span className="block text-mentor-accent mt-2 text-2xl md:text-4xl">
              סופרוויז׳ן רגיש לעסק — לרשותך בכל זמן ובכל מקום
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8"
          >
            ליווי AI אישי שמוביל אותך שלב־שלב למלא את הקליניקה במטופלים הנכונים —
            באותנטיות, בביטחון, ובלי להרגיש מכירתי.
          </motion.p>
          <CTAButton>אני רוצה להיות אחד מ־20</CTAButton>
          <p className="text-xs text-muted-foreground mt-4">
            ₪750 חד פעמי · גישה לתמיד · כולל כל השיפורים העתידיים
          </p>
        </div>
      </section>

      {/* PROBLEM */}
      <Section>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
          שנים של הכשרות בפסיכותרפיה.
          <br />
          אבל אף אחד לא לימד אותך את זה.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
          למדת טיפול. למדת שיטות התערבות. למדת איך להחזיק מרחב טיפולי. אבל —
        </p>
        <ul className="space-y-3 mb-6">
          {[
            "איך מוצאים מטופלים?",
            "איך מסבירים מה ייחודי בטיפול שלך כדי שאנשים ירצו להגיע דווקא אליך?",
            "איך ממלאים את הקליניקה באופן נעים ואותנטי, בלי להרגיש נזקקות ובלי להיות מכירתיים?",
            "כמה לתמחר את השעה הטיפולית שלך, ואיך להציג את המחיר בביטחון, בלי לבלוע את הרוק?",
          ].map((q, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-card border border-mentor-border rounded-xl p-4"
            >
              <HelpCircle className="w-5 h-5 text-mentor-accent shrink-0 mt-0.5" />
              <span className="text-foreground">{q}</span>
            </li>
          ))}
        </ul>
        <p className="text-lg font-semibold text-center text-foreground">
          זה לא נלמד בשום מקום. אז איך יכולת לדעת?
        </p>
      </Section>

      {/* PERSONAS */}
      <Section className="bg-mentor-surface/60 rounded-3xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">
          את החידה הזו מטפלים מנסים לפתור לבד
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          וזה לוקח הרבה זמן והרבה טעויות בדרך.
        </p>
        <ul className="space-y-3">
          {personas.map((p, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-card border border-mentor-border rounded-xl p-4"
            >
              <span className="w-6 h-6 rounded-full bg-mentor-accent/15 text-mentor-accent text-sm font-bold shrink-0 flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
        <p className="text-base md:text-lg text-foreground mt-8 leading-relaxed text-center">
          הבעיה היא לא רצון. היא לא כישרון. ואפילו לא הביטחון המקצועי.
          <br />
          <span className="font-semibold">
            מה שחסר לך — אף אחד לא לימד אותך את המיומנויות האלה. ואי אפשר לתרגל
            משהו שלא ידעת שצריך.
          </span>
        </p>
      </Section>

      {/* SOLUTION INTRO */}
      <Section>
        <h2 className="text-2xl md:text-3xl font-bold mb-5 text-center">
          מה אם היה מישהו שמחזיק אותך בדיוק שם?
        </h2>
        <div className="bg-card border border-mentor-border rounded-2xl p-6 md:p-8 space-y-4 text-foreground leading-relaxed">
          <p>לא מרצה. לא קורס. לא עוד תוכן לצרוך.</p>
          <p>
            מישהו שיושב איתך, שואל את השאלות הנכונות, ומוביל אותך לתשובה שכבר
            קיימת בתוכך — לגרסה שלך שיודעת למלא את הקליניקה בביטחון
            ובאותנטיות.
          </p>
          <p className="font-semibold text-mentor-accent">
            הכוונה אישית. מיקוד. פעולות מדויקות.
          </p>
          <p>
            הדבקת הפער בין המומחיות המקצועית שלך לבין היכולת שלך להביא מטופלים
            מתאימים לקליניקה.
          </p>
          <p className="text-lg font-bold text-foreground pt-2">
            זה המנטור לקליניקה.
          </p>
        </div>
      </Section>

      {/* STAGES */}
      <Section className="bg-mentor-surface/60 rounded-3xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center">
          מה המנטור עושה בפועל
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          הוא מלווה אותך דרך חמישה שלבים:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          {stages.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="bg-card border border-mentor-border rounded-2xl p-5 flex gap-4"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-mentor-accent/15 text-mentor-accent flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-mentor-accent mb-1">
                    שלב {i + 1}
                  </div>
                  <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {s.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 bg-card border-2 border-mentor-accent/30 rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-mentor-accent" />
            <h3 className="font-bold text-foreground">ובמקביל — הרובד הפנימי</h3>
          </div>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            הביטחון והנוכחות המקצועית. היכולת להתחבר לערך האמיתי שלך ולשדר אותו
            — כי זה מה שבאמת מעכב גם כשיש את כל הידע העסקי.
          </p>
        </div>
      </Section>

      {/* EXPERIENCE */}
      <Section>
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          איך זה נראה בפועל?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {experiencePoints.map((e, i) => {
            const Icon = e.icon;
            return (
              <div
                key={i}
                className="bg-card border border-mentor-border rounded-2xl p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-mentor-accent/15 text-mentor-accent flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{e.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {e.text}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-center text-base md:text-lg text-foreground mt-8 italic">
          כמו סופרוויז׳ן — רק שזמין תמיד, מכיר אותך לעומק, ועם סבלנות אינסופית.
        </p>
      </Section>

      {/* SOCIAL PROOF */}
      <Section className="bg-mentor-surface/60 rounded-3xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          מה קרה למטפלים שעבדו איתו
        </h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-card border border-mentor-border rounded-2xl p-6">
            <TrendingUp className="w-6 h-6 text-mentor-accent mb-3" />
            <p className="text-foreground leading-relaxed">
              מטפלת אחת העלתה מחירים — וסיפרה שלראשונה הרגישה שהיא מקבלת תגמול
              שהיא באמת ראויה לו.
            </p>
          </div>
          <div className="bg-card border border-mentor-border rounded-2xl p-6">
            <Sparkles className="w-6 h-6 text-mentor-accent mb-3" />
            <p className="text-foreground leading-relaxed">
              מטפל אחר מצא את המנטור, התנסה — וקנה מיוזמתו. עוד לפני שהצענו.
            </p>
          </div>
        </div>
      </Section>

      {/* BETA */}
      <Section>
        <div className="bg-gradient-to-br from-mentor-accent/10 via-card to-mentor-accent/5 border-2 border-mentor-accent/30 rounded-3xl p-6 md:p-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mentor-accent text-mentor-accent-foreground text-xs font-semibold mb-3">
              <Users2 className="w-3.5 h-3.5" />
              20 מקומות בלבד
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              גרסת הבטא
            </h2>
          </div>
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              כתבת "מזל" — ואכן התמזל מזלך להיות בין 20 המטפלים הראשונים שנזמין
              בתנאים מיוחדים שלא יחזרו.
            </p>
            <p>
              בתמורה — אנחנו מבקשים את המשוב הכן שלך. מה עובד, מה לא, מה חסר.
              חשוב לנו שהמנטור ייתן את המענה הטוב ביותר למטפלים כמוך, ואנחנו
              מודים לך על המשוב שעוזר לנו לבנות משהו טוב יותר.
            </p>
            <div className="bg-card border border-mentor-border rounded-xl p-5">
              <p className="font-semibold text-foreground mb-2">
                המנטור מיועד למטפלים שמוכנים לא רק לקרוא — אלא לעשות.
              </p>
              <p className="text-sm text-muted-foreground">
                כל שלב מסתיים בפעולות ליישום בעולם האמיתי. אם אתה מחפש עוד ידע
                לצבור — זה לא בשבילך. אם אתה מוכן להיות בתנועה — אנחנו כאן.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* PRICING */}
      <Section>
        <div className="bg-card border-2 border-mentor-accent rounded-3xl p-6 md:p-10 shadow-elevated text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            מה ההשקעה שלך?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            מחיר קבוע בהמשך:{" "}
            <span className="line-through">₪1,800</span>
          </p>

          <div className="inline-flex items-baseline gap-2 mb-2">
            <span className="text-5xl md:text-6xl font-bold text-mentor-accent">
              ₪750
            </span>
          </div>
          <p className="text-base text-foreground font-medium mb-6">
            תשלום חד פעמי · כולל מע״מ · למייסדי גרסת הבטא
          </p>

          <ul className="text-right max-w-md mx-auto space-y-3 mb-8">
            {[
              "גישה מלאה לתמיד",
              "כולל כל השיפורים העתידיים",
              "פחות משני מפגשי סופרוויז׳ן",
              "שלך לתמיד",
            ].map((b, i) => (
              <li key={i} className="flex items-center gap-3 text-foreground">
                <span className="w-6 h-6 rounded-full bg-mentor-accent/15 text-mentor-accent flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <CTAButton className="w-full sm:w-auto">
            אני רוצה להיות אחד מ־20
          </CTAButton>

          <p className="text-xs text-muted-foreground mt-5">
            תשלום מאובטח דרך משולם
          </p>
        </div>
      </Section>

      {/* CONTACT */}
      <Section className="text-center">
        <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          שאלות?
        </h3>
        <p className="text-muted-foreground mb-5">כתבו לאליענה ישירות.</p>
        <Button
          variant="outline"
          size="lg"
          onClick={() =>
            window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")
          }
          className="border-mentor-accent text-mentor-accent hover:bg-mentor-accent hover:text-mentor-accent-foreground"
        >
          <MessageCircle className="w-4 h-4" />
          שליחת הודעה בוואטסאפ
        </Button>
      </Section>

      {/* COMING SOON BANNER */}
      <div className="container mx-auto px-4 pb-16">
        <WebsiteComingSoonCard variant="paywall" />
      </div>
    </div>
  );
}

export default MentorSalesPage;
