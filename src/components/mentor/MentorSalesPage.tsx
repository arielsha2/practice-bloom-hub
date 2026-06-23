import { motion } from "framer-motion";
import { Link } from "react-router-dom";
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
  Lock,
  Users as UsersIcon,
  Star,
  Quote as QuoteIcon,
  Circle as CircleIcon,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";
import { useLanguage } from "@/contexts/LanguageContext";
import arielElianaPhoto from "@/assets/ariel-eliana.jpg.asset.json";

const PAYMENT_URL_HE = "https://meshulam.co.il/quick_payment?b=692abdd2459224a95d57aef700a015ab";
const PAYMENT_URL_EN = "https://meshulam.co.il/s/184c5865-65a4-10bb-33f5-5c6c966d83d3";
const WHATSAPP_URL = "https://api.whatsapp.com/send/?phone=972523379716&text&type=phone_number&app_absent=0";

function openPaymentFor(language: string) {
  const url = language === "en" ? PAYMENT_URL_EN : PAYMENT_URL_HE;
  window.open(url, "_blank", "noopener,noreferrer");
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

// NOTE: Hebrew COPY left exactly as-is. English COPY restructured for the new sales page spec.
const COPY: any = {
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
        {
          title: "מי אתה כמטפל",
          text: "לא תיאור קליני. הייחוד שלך. מה אתה עושה שאחרים לא עושים. מה גורם למטופלים לרצות דווקא אותך.",
        },
        { title: "כמה הערך של העבודה איתך", text: "לא מספר שרירותי. מחיר שנובע מערך אמיתי, ושאפשר לומר בלי להתנצל." },
        {
          title: "מאיפה יגיעו הלקוחות",
          text: 'בחירת אנשי קשר ספציפיים שימליצו עליך, במקום "לירות בכל הכיוונים" ולא להבין למה אנשים לא פונים.',
        },
        { title: "איך מדברים עם אנשי קשר", text: "תרגול אמיתי, שיחה אמיתית, משוב מיידי." },
        { title: "איך להציג את עצמך", text: "המשפט שגורם לאנשים לרצות לשלוח אליך לקוחות." },
      ],
      innerLabel: "הרובד הפנימי",
      innerTitle: "ובמקביל, העבודה שמתחת לפני השטח.",
      innerText:
        "הביטחון והנוכחות המקצועית. היכולת להתחבר לערך האמיתי שלך ולשדר אותו. כי זה מה שבאמת מעכב גם כשיש את כל הידע העסקי.",
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
      warningBody:
        "כל שלב מסתיים בפעולות ליישום בעולם האמיתי. אם אתה מחפש עוד ידע לצבור, זה לא בשבילך. אם אתה מוכן להיות בתנועה, אנחנו כאן.",
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
    badge: "The Clinic Mentor",
    hero: {
      titleLine1: "You became a therapist to help people.",
      titleLine2: "Let's make sure enough people can find you.",
      body:
        "An AI personal guide that leads you step by step — identifying your niche, setting your fee, and building referral relationships. Authentically. At your own pace.",
      cta: "✦  Start building my full practice  →",
      ctaNote: "One-time payment · Lifetime access · No subscription · 20 founding seats available",
      loginPrompt: "Already signed up?",
      loginLink: "Log in",
    },
    trustBar: [
      { Icon: Lock, text: "Secure checkout" },
      { Icon: UsersIcon, text: "Built for licensed therapists" },
      { Icon: Star, text: "Trusted by therapists worldwide" },
      { Icon: MessageCircle, text: "Questions? Message us directly" },
    ],
    problem: {
      eyebrow: "The gap",
      title: ["Years of psychotherapy training.", "But no one ever taught you this."],
      intro:
        "You learned therapy. You learned intervention methods. You learned how to hold a therapeutic space. But essential questions were left unanswered:",
      questions: [
        "How do you build a referral network when you're starting from scratch?",
        "How do you explain what makes your therapy unique so people want to come specifically to you?",
        "How do you fill your practice authentically — without feeling desperate or salesy?",
        "How do you price your sessions and state your fee with confidence?",
        "How do you write a profile — on Psychology Today, your website, or anywhere online — that actually sounds like you and makes clients want to reach out?",
      ],
      closing: "This is never taught anywhere. So how could you have known?",
    },
    personas: {
      title: "Therapists try to solve this puzzle alone.",
      subtitle: "And it takes a long time, with many mistakes along the way.",
      list: [
        "Who quotes a lower fee on the phone because they're afraid the client will say no — and then resents the session.",
        "Who knows they have something to offer — but when they need to explain it, the words get stuck.",
        "Who sets up a profile online, posts on social media twice, and then abandons both because it feels fake.",
        "Who waits for the practice to grow on its own.",
        "Who keeps going back to institutional work because building a practice alone is exhausting.",
        "Who already tried. Bought courses, read, understood. And then did nothing with it. Because knowledge alone doesn't move people.",
        "Who knows they need a business coach or consultant — but has seen those programs charge $3,000–$10,000 and can't justify it right now.",
      ],
      outro1: "The problem isn't willingness. It isn't talent. It isn't even professional confidence.",
      outro2: [
        "What's missing is that no one ever taught you these skills.",
        "And you can't practice something you didn't know you needed.",
      ],
    },
    earlyQuote: {
      text: "You can truly feel the human heart beating behind the screen.\nIt is absolutely wonderful.",
      name: "[Name placeholder — client to replace]",
      details: "[License] · [Years in practice] · [Country placeholder]",
    },
    interlude: "No one ever taught you this. So how could you have known?",
    solution: {
      title: "What if someone held you right there?",
      p1: "Not a lecturer. Not a course. Not knowledge that sits on a shelf. Not theories — but practical guidance.",
      p2:
        "Someone who sits with you, asks the right questions, and leads you to the answer that already exists within you.",
      p3: "Personal guidance. Focus. Precise actions.",
      p4: "Bridging the gap between your expertise and your ability to bring the right clients.",
      aiNote:
        "Yes, it's AI. But it's not a generic chatbot. It's trained on a specific method, built for private practice therapists, and it asks questions the way a great supervisor would — not answers the way a search engine would.",
      cta: "This is the Clinic Mentor.",
    },
    founders: {
      eyebrow: "Who built this",
      title: "Built by therapists who saw this problem up close.",
      caption: "Ariel & Eliana Shapira",
      body: [
        "We're Ariel and Eliana Shapira — a clinical psychologist and a psychotherapist who built this because we kept watching the same thing happen: extraordinary clinicians who couldn't fill their practice. Not because they weren't good enough, but because no one had ever taught them the skills to do it.",
        "Dr. Ariel Shapira is a clinical psychologist and supervisor with 12+ years of experience in the public system and private practice. He developed a model that helps therapists connect to their value and build genuine professional confidence.",
        "Eliana Shapira is a psychotherapist and content and AI expert. She built the practical 'how' — and the Clinic Mentor is her answer to the question she heard from hundreds of therapists: 'I know I need to do this, but I don't know where to start.'",
        "The Clinic Mentor is what we wish every therapist we've ever worked with had access to from day one.",
      ],
      contactHint: "Questions? Message Eliana directly.",
      contactCta: "Send a WhatsApp message",
    },
    stages: {
      eyebrow: "The five stages",
      title: "What the Mentor actually does.",
      subtitle: "It guides you through five precise stages.",
      stepLabel: "Stage",
      items: [
        {
          title: "Who you are as a therapist",
          text:
            "Most therapists describe themselves the same way: 'I work with anxiety, depression, and life transitions.' The Mentor guides you to find what's genuinely unique about how you work — the thing that makes a specific client think 'I want this person specifically.' This becomes the foundation for everything else.",
        },
        {
          title: "What your work is worth",
          text:
            "A price that comes from real value — not from fear of losing the client. The Mentor helps you examine where your current fee came from and guides you to a number you can state with confidence, on the phone, without apologizing.",
        },
        {
          title: "Where clients will come from",
          text:
            "Specific referral contacts — instead of shooting in all directions. The Mentor helps you identify the exact professionals who already serve your ideal client, so you can build relationships that consistently send you the right people.",
        },
        {
          title: "How to talk to referral contacts",
          text:
            "This is the stage most therapists skip — because it feels awkward. The Mentor role-plays the conversation with you, gives immediate feedback, and helps you find language that feels natural. You practice until it's not uncomfortable anymore.",
        },
        {
          title: "How to present yourself",
          text:
            "The sentence that makes people want to send you clients. Not an elevator pitch. Not a tagline. The real description of your work that lands — because it's specific, true, and yours.",
        },
      ],
      innerLabel: "And alongside all of this",
      innerTitle: "The work beneath the surface.",
      innerText:
        "The Mentor works on what's beneath the surface — confidence, professional presence, and the ability to connect with your real value.",
    },
    experience: {
      eyebrow: "The experience",
      title: "What does it actually look like?",
      items: [
        {
          title: "Available when it suits you",
          text: "You come when it suits you — morning, evening, between clients.",
        },
        { title: "Remembers you", text: "It remembers what you said in the previous session." },
        {
          title: "Focused questions",
          text: "It asks focused questions — not open-ended chat. AI trained on our method.",
        },
        {
          title: "Sends you to action",
          text: "It sends you to one specific action. And waits for you to identify what worked.",
        },
      ],
      closing: "Like supervision — only always available, with infinite patience.",
      sampleLabel: "This is what a session actually feels like",
      sample: [
        {
          who: "mentor",
          label: "The Mentor",
          text:
            "You've mentioned feeling stuck when a client asks about your fee. Let's stay there. What do you imagine the client is thinking when they ask?",
        },
        { who: "you", label: "You", text: "That I'm too expensive. That they'll leave." },
        {
          who: "mentor",
          label: "The Mentor",
          text:
            "That's an important assumption to examine. Where did that belief come from — a specific experience, or more of a background fear?",
        },
      ],
    },
    proof: {
      eyebrow: "From the field",
      title: "What happened to therapists who worked with it.",
      cards: [
        { quote: "I raised my prices — and for the first time felt I was receiving compensation I truly deserved." },
        {
          quote: "I found the Mentor, tried it — and bought on my own initiative. Before it was even offered to me.",
        },
        {
          quote:
            "This Mentor helped me realign according to my true feelings, clinical values, and personality. That's what sets this tool apart from generic AI platforms.",
        },
        {
          quote:
            "I was skeptical, but the experience felt incredibly personal and not 'robotic' at all. I genuinely loved how nuanced and thoughtful the phrasing was.",
        },
        { quote: "You can truly feel the human heart beating behind the screen. It is absolutely wonderful." },
        {
          quote:
            "The platform is incredibly high-caliber. The capabilities, sophistication, and clinical precision of the AI far exceeded my expectations. Truly groundbreaking work.",
        },
        {
          quote:
            "It's been incredible. It gently pushes you forward while offering fantastic feedback. It has this unique ability to latch onto the exact right sentence to validate and encourage your progress.",
          wide: true,
        },
      ],
      placeholderName: "[Name placeholder]",
      placeholderDetails: "[License] · [Years in practice] · [Country]",
    },
    fitFor: {
      eyebrow: "Is this for you?",
      title: "The Clinic Mentor is built for a specific kind of therapist.",
      forHeading: "This IS for you if:",
      forItems: [
        "You're a licensed or pre-licensed therapist building toward private practice",
        "You want a full caseload but don't know where to start building referrals",
        'You\'ve tried "doing marketing" — online profiles, social media, networking emails — and it felt inauthentic or just didn\'t work',
        "You know your clinical work is strong. It's the business side that feels foreign.",
        "You want guidance that respects your pace and your professional ethics",
      ],
      notHeading: "This is probably not the right fit if:",
      notItems: [
        "You're looking for clinical case supervision that counts toward licensure hours",
        "You're not currently able to take one concrete action per week",
        "Your caseload is already full and you need advanced practice scaling",
        "You're looking for someone to do the marketing for you",
      ],
    },
    faq: {
      eyebrow: "Questions",
      title: "We've heard these before.",
      items: [
        {
          q: "Is this the same as clinical supervision?",
          a:
            "No — and it's important to be clear about that. The Clinic Mentor is business mentoring, not clinical supervision. It won't count toward your licensure hours and it doesn't review your casework. Think of it as the business side of the supervision experience — the part your clinical supervisor probably doesn't have time or training to cover.",
        },
        {
          q: "Is this confidential? What happens to my data?",
          a:
            "The Mentor never receives information about your clients. It works only on your business — your niche, your pricing, your referral relationships. No client data ever enters the system. Your clinical work stays entirely private.",
        },
        {
          q: "I've bought courses before and never finished them. How is this different?",
          a:
            "A course gives you information and leaves the work to you. The Mentor gives you one action at a time and waits for you to return before moving forward. There's no module 7 gathering dust. There's just the next conversation, whenever you're ready.",
        },
        {
          q: "I'm not tech-savvy. Is this complicated to use?",
          a:
            "If you can send a text message, you can use the Mentor. It's a conversation interface — you type, it responds. No dashboards, no complex logins, no video modules to navigate.",
        },
        {
          q: "I'm pre-licensed or still completing supervised hours. Is this relevant for me?",
          a:
            "Yes — especially for you. The earlier you start building these skills, the smoother the transition to private practice. Many of our founding members started while still completing their supervised hours.",
        },
        {
          q: "Will this work for my specialty? I work with trauma / couples / eating disorders / etc.",
          a:
            "The Mentor doesn't teach a generic script. It starts with your specific specialty and works outward from there. Stage 01 is entirely dedicated to articulating what makes you unique as a specialist.",
        },
        {
          q: "What if it doesn't work for me?",
          a:
            "If you complete Stage 01 and Stage 02 and feel the Mentor isn't the right guide for where you are, message Eliana directly within 14 days and we'll make it right.",
        },
      ],
    },
    beta: {
      eyebrow: "Founding members",
      title: "Founding members — 20 seats only",
      exclusive: "Exclusive to founders",
      seats: "20 seats only",
      p1: "In exchange for the special price — we ask for your honest feedback.",
      p2:
        "What works, what doesn't, what's missing. It matters to us that the Mentor delivers the best possible support for therapists like you.",
      warningTitle: "The Clinic Mentor is for therapists ready not just to read — but to act.",
      warningBody: "If you're ready to move — we're here.",
    },
    pricing: {
      investment: "Your investment",
      futurePrice: "Regular price:",
      futurePriceValue: "$600 USD (₪1,800)",
      currentPrice: "$249",
      currentPriceUnit: "USD",
      currentPriceSecondary: "(₪750)",
      priceNote: "One-time payment · incl. VAT",
      bullets: [
        "Lifetime full access",
        "Including all future improvements",
        "Less than two supervision sessions",
        "Yours forever",
      ],
      anchor:
        "At this price, you're investing less than: one hour of private business coaching · one continuing education workshop · two months on a therapist directory",
      cta: "I want one of the 20 founding seats",
      secure: "Secure payment via Meshulam",
    },
    contact: {
      title: "Questions?",
      body: "Message Eliana directly.",
      whatsapp: "Send a WhatsApp message",
    },
  },
};

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
  const isEn = language === "en";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} lang={language} className="bg-background text-foreground">
      {/* ============ HERO ============ */}
      <section
        className="band band-grain relative w-full overflow-hidden"
        style={{ backgroundColor: "#2a0614", color: "hsl(var(--background))" }}
      >
        {/* EN-only top-right login link */}
        {isEn && (
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20 text-xs">
            <span style={{ color: "rgba(250,247,242,0.55)" }}>{t.hero.loginPrompt} </span>
            <Link
              to="/auth"
              className="underline underline-offset-2"
              style={{ color: "rgba(250,247,242,0.9)" }}
            >
              {t.hero.loginLink}
            </Link>
          </div>
        )}

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

          {isEn ? (
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display text-3xl md:text-5xl lg:text-6xl leading-[1.1] tracking-tight mb-6"
              style={{ textShadow: "0 2px 12px rgba(75,11,36,0.5)" }}
            >
              {t.hero.titleLine1}
              <span className="block mt-3" style={{ color: "hsl(var(--terracotta))" }}>
                {t.hero.titleLine2}
              </span>
            </motion.h1>
          ) : (
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
          )}

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
              onClick={() => openPaymentFor(language)}
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
                color: "rgba(250,247,242,0.6)",
                marginTop: "0.85rem",
                textAlign: "center",
              }}
            >
              {t.hero.ctaNote}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ EN — TRUST BAR ============ */}
      {isEn && (
        <section className="band band-cream band-grain">
          <div className="container mx-auto px-4 max-w-5xl py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {t.trustBar.map((item: { Icon: any; text: string }, i: number) => {
                const Icon = item.Icon;
                return (
                  <div key={i} className="flex flex-col items-center text-center gap-3">
                    <span className="icon-chip" style={{ width: 44, height: 44 }}>
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-sm md:text-base text-foreground leading-snug">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">{t.problem.intro}</p>
        </motion.div>

        <motion.ul {...fadeUp} className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {t.problem.questions.map((q: string, i: number) => (
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
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.personas.title}</h2>
          <Divider />
          <p className="text-background/80 text-base md:text-lg mb-10">{t.personas.subtitle}</p>
        </motion.div>

        <motion.ul {...fadeUp} className="flex flex-col gap-3 max-w-3xl mx-auto">
          {t.personas.list.map((p: string, i: number) => (
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
          <p className="text-base md:text-lg leading-relaxed text-background/85">{t.personas.outro1}</p>
          <p className="text-lg md:text-xl font-semibold leading-relaxed text-background mt-3">
            {t.personas.outro2[0]}
            <br />
            {t.personas.outro2[1]}
          </p>
        </motion.div>
      </Band>

      {/* ============ EN — EARLY PULL QUOTE (cream) ============ */}
      {isEn && (
        <Band tone="cream" className="!py-16">
          <motion.div {...fadeUp} className="max-w-[700px] mx-auto text-center">
            <QuoteIcon
              className="mx-auto mb-5"
              style={{ color: "hsl(var(--terracotta))", width: 44, height: 44 }}
            />
            <p
              className="font-display italic text-foreground leading-relaxed whitespace-pre-line"
              style={{ fontSize: "20px" }}
            >
              {t.earlyQuote.text}
            </p>
            <p className="mt-6 text-sm font-bold text-foreground">— {t.earlyQuote.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.earlyQuote.details}</p>
          </motion.div>
        </Band>
      )}

      {/* ============ INTERLUDE ============ */}
      <InterludeBanner text={t.interlude} />

      {/* ============ SOLUTION INTRO — CREAM ============ */}
      <Band tone="cream">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.solution.title}</h2>
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
            {isEn && (
              <p className="italic text-muted-foreground/90 text-base md:text-lg">{t.solution.aiNote}</p>
            )}
            <p className="text-2xl md:text-3xl font-display pt-3 text-primary">{t.solution.cta}</p>
          </div>
        </motion.div>
      </Band>

      {/* ============ EN — FOUNDERS (cream) ============ */}
      {isEn && (
        <Band tone="cream">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <Eyebrow>{t.founders.eyebrow}</Eyebrow>
            <Divider />
          </motion.div>

          <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-10 items-center max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <img
                src={arielElianaPhoto.url}
                alt="Ariel and Eliana Shapira"
                className="w-full aspect-[4/3] max-w-sm rounded-2xl border border-border object-cover shadow-soft"
                loading="lazy"
              />
              <p className="mt-3 text-sm text-muted-foreground italic">{t.founders.caption}</p>
            </div>



            <div>
              <h3 className="font-display text-2xl md:text-3xl text-foreground mb-5 leading-snug">
                {t.founders.title}
              </h3>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                {t.founders.body.map((p: string, i: number) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              <div className="mt-7">
                <p className="text-sm text-muted-foreground mb-3">{t.founders.contactHint}</p>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => window.open(WHATSAPP_URL, "_blank", "noopener,noreferrer")}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {t.founders.contactCta}
                </Button>
              </div>
            </div>
          </motion.div>
        </Band>
      )}

      {/* ============ STAGES — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>{t.stages.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.stages.title}</h2>
          <Divider />
          <p className="text-background/75 text-base md:text-lg mb-12">{t.stages.subtitle}</p>
        </motion.div>

        <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {t.stages.items.map((s: { title: string; text: string }, i: number) => {
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
                    <div className="step-numeral mb-1.5">
                      {t.stages.stepLabel} {String(i + 1).padStart(2, "0")}
                    </div>
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
          {t.experience.items.map((e: { title: string; text: string }, i: number) => {
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

        {/* EN — sample conversation */}
        {isEn && (
          <motion.div
            {...fadeUp}
            className="mt-14 mx-auto max-w-[680px] bg-card border border-border rounded-3xl p-8 md:p-10 shadow-soft"
          >
            <div className="section-eyebrow text-center mb-6" style={{ color: "hsl(var(--terracotta))" }}>
              {t.experience.sampleLabel}
            </div>
            <div className="flex flex-col gap-5">
              {t.experience.sample.map(
                (m: { who: string; label: string; text: string }, i: number) =>
                  m.who === "mentor" ? (
                    <div key={i} className="self-start max-w-[88%]">
                      <div
                        className="text-[11px] font-semibold mb-1.5 tracking-wide uppercase"
                        style={{ color: "hsl(var(--terracotta))" }}
                      >
                        {m.label}
                      </div>
                      <div
                        className="rounded-2xl rounded-tl-sm px-5 py-4 leading-relaxed"
                        style={{ background: "#2a0614", color: "#faf7f2" }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="self-end max-w-[88%]">
                      <div className="text-[11px] font-semibold mb-1.5 tracking-wide uppercase text-muted-foreground text-right">
                        {m.label}
                      </div>
                      <div className="rounded-2xl rounded-tr-sm px-5 py-4 leading-relaxed bg-secondary/70 border border-border text-foreground">
                        {m.text}
                      </div>
                    </div>
                  ),
              )}
            </div>
          </motion.div>
        )}
      </Band>

      {/* ============ SOCIAL PROOF — BURGUNDY ============ */}
      <Band tone="burgundy">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
          <Eyebrow>{t.proof.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.proof.title}</h2>
          <Divider />
        </motion.div>

        {isEn ? (
          <motion.div {...fadeUp} className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.proof.cards.map((c: { quote: string; wide?: boolean }, i: number) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 md:p-8 bg-card border border-border shadow-soft ${
                  c.wide ? "md:col-span-3 md:max-w-3xl md:mx-auto" : ""
                }`}
              >
                <QuoteIcon
                  className="absolute top-5 left-5 opacity-90"
                  style={{ color: "hsl(var(--terracotta))", width: 28, height: 28 }}
                />
                <p className="italic text-foreground leading-relaxed pt-8">{c.quote}</p>
                <div
                  className="h-px w-12 my-5"
                  style={{ background: "hsl(var(--terracotta))" }}
                />
                <p className="font-bold text-foreground text-sm">{t.proof.placeholderName}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.proof.placeholderDetails}</p>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {t.proof.quotes.map((q: string, i: number) => (
              <div key={i} className="relative rounded-2xl p-8 border border-background/15 bg-background/[0.06]">
                <p className="pull-quote relative text-background leading-relaxed text-lg">{q}</p>
              </div>
            ))}
          </motion.div>
        )}
      </Band>

      {/* ============ EN — IS THIS FOR YOU (cream) ============ */}
      {isEn && (
        <Band tone="cream">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <Eyebrow>{t.fitFor.eyebrow}</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.fitFor.title}</h2>
            <Divider />
          </motion.div>

          <motion.div
            {...fadeUp}
            className="grid md:grid-cols-2 gap-10 md:gap-12 max-w-4xl mx-auto md:divide-x md:divide-border"
          >
            <div className="md:pr-10">
              <h3 className="font-display text-xl text-foreground mb-5 flex items-center gap-2">
                <Check className="w-5 h-5" style={{ color: "#2f8a4d" }} />
                {t.fitFor.forHeading}
              </h3>
              <ul className="space-y-3">
                {t.fitFor.forItems.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                    <Check
                      className="w-4 h-4 mt-1.5 shrink-0"
                      style={{ color: "#2f8a4d" }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:pl-10">
              <h3 className="font-display text-xl text-foreground mb-5 flex items-center gap-2">
                <CircleIcon className="w-5 h-5 text-muted-foreground" />
                {t.fitFor.notHeading}
              </h3>
              <ul className="space-y-3">
                {t.fitFor.notItems.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground leading-relaxed">
                    <CircleIcon className="w-3 h-3 mt-2 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </Band>
      )}

      {/* ============ EN — FAQ (charcoal) ============ */}
      {isEn && (
        <Band tone="charcoal">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <Eyebrow>{t.faq.eyebrow}</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.faq.title}</h2>
            <Divider />
          </motion.div>

          <motion.div {...fadeUp} className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {t.faq.items.map((item: { q: string; a: string }, i: number) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-l-4 data-[state=open]:border-l-accent"
                >
                  <AccordionTrigger className="text-left text-base md:text-lg font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </Band>
      )}

      {/* ============ BETA + PRICING — CHARCOAL ============ */}
      <Band tone="charcoal">
        <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto mb-12">
          <Eyebrow>{t.beta.eyebrow}</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight leading-tight mb-4">{t.beta.title}</h2>
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

          {isEn ? (
            <div className="mb-3">
              <div className="inline-flex items-baseline gap-2">
                <span className="font-display text-6xl md:text-7xl tnum" style={{ color: "hsl(var(--accent))" }}>
                  {t.pricing.currentPrice}
                </span>
                <span className="font-display text-2xl md:text-3xl" style={{ color: "hsl(var(--accent))" }}>
                  {t.pricing.currentPriceUnit}
                </span>
              </div>
              <div className="text-base md:text-lg text-muted-foreground mt-1 tnum">
                {t.pricing.currentPriceSecondary}
              </div>
            </div>
          ) : (
            <div className="inline-flex items-baseline gap-2 mb-3">
              <span className="font-display text-6xl md:text-7xl tnum" style={{ color: "hsl(var(--accent))" }}>
                {t.pricing.currentPrice}
              </span>
            </div>
          )}

          <p className="text-base md:text-lg text-foreground font-medium mb-8">{t.pricing.priceNote}</p>
          <ul className="text-start max-w-md mx-auto space-y-3 mb-6">
            {t.pricing.bullets.map((b: string, i: number) => (
              <li key={i} className="flex items-center gap-3 text-foreground">
                <span className="icon-chip shrink-0" style={{ width: 32, height: 32 }}>
                  <Check className="w-4 h-4" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {isEn && (
            <p className="italic text-xs md:text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
              {t.pricing.anchor}
            </p>
          )}

          <div className="py-3">
            <button
              onClick={() => openPaymentFor(language)}
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
