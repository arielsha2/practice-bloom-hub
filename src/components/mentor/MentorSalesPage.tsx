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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WebsiteComingSoonCard } from "@/components/mentor/WebsiteComingSoonCard";
import { MentorTestimonialsCarousel } from "@/components/mentor/MentorTestimonialsCarousel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMentorTrialOpen } from "@/hooks/useMentorTrialOpen";
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
    badge: "גרסת בטא",
    hero: {
      title: "המנטור לקליניקה",
      subtitle: [
        "הוכשרת להחזיק חדר טיפול.",
        "אף אחד לא לימד אותך איך לבנות את הקליניקה סביבו.",
      ],
      body: "מנטור AI אישי למטפלים שבונים קליניקה פרטית — מלווה אותך, שיחה ממוקדת אחת בכל פעם, דרך הנישה שלך, המחיר שלך, מערכות ההפניה, והשפה שגורמת למטופל הנכון להרגיש: המטפלת הזו מבינה אותי. בלי הייפ, בלי סקריפטים גנריים, ובלי לבקש ממך להיות מישהי אחרת. שאלה ממוקדת אחת. פעולה קונקרטית אחת. בשפה שעדיין מרגישה כמוך.",
      cta: "✦ אני מתחילה לבנות את המיכל לקליניקה שלי",
      ctaNote: "תשלום חד־פעמי · גישה מלאה · ללא מנוי · מחיר בטא · לתשלום מאובטח",
      trialCta: "להתנסות חינם — 24 שעות, מיקוד בתמחור",
      loginPrompt: "כבר נרשמת?",
      loginLink: "התחבר/י",
    },
    problem: {
      eyebrow: "הפער",
      title: [
        "שנים של הכשרה בפסיכותרפיה.",
        "ואף אחד לא לימד אותך את זה.",
      ],
      intro:
        "למדת להקשיב. להעריך. להחזיק מורכבות. ליצור מרחב טיפולי שבו יכול לקרות משהו אמיתי. אבל אף אחד לא לימד אותך לענות על השאלות שקובעות אם אנשים בכלל ימצאו את הדרך לחדר שלך:",
      questions: [
        "איך בונים רשת הפניות כשמתחילים מאפס?",
        "איך מסבירים מה מייחד את העבודה שלך, בלי להישמע יומרנית?",
        "איך אומרים את המחיר בלי להתכווץ, להתנצל או להתמקח עם עצמך?",
        "איך כותבים פרופיל שנשמע כמוך — וגורם לאדם הנכון לרצות לפנות?",
      ],
      closing: "זה לא נלמד בשום מקום. אז איך יכולת לדעת?",
    },
    personas: {
      title: "מטפלים מנסים לפתור את החידה הזו לבד.",
      subtitle: "ולבד, זה לוקח שנים. עם הרבה עלויות שקטות בדרך.",
      list: [
        "המטפלת שמורידה מחיר בטלפון כי חוששת שהמטופלת תגיד לא — ואז כועסת על עצמה בפגישה.",
        "המטפלת שיודעת שיש לה מה להציע, אבל כשצריך להסביר את זה, המילים נעשות דקות יותר מהעבודה עצמה.",
        "המטפלת שפתחה פרופיל, פרסמה פעמיים ברשת, ונטשה את שניהם — כי זה הרגיש מזויף.",
        "המטפלת שמחכה שהקליניקה תגדל מעצמה.",
        "המטפלת שחוזרת שוב ושוב לעבודה במסגרות ציבוריות, כי לבנות קליניקה לבד זה מתיש.",
        "מי שכבר ניסה. קנתה קורסים, קראה, הבינה הכול. ואז לא עשתה כלום. כי ידע לבד לא מזיז אנשים.",
        "מי שיודעת שהיא צריכה יועץ עסקי, אבל ראתה שתוכניות כאלה עולות אלפי דולרים — וזה לא מוצדק כרגע.",
      ],
      outro1:
        "הבעיה היא לא רצון. היא לא כישרון. היא לא עומק קליני. כל צעד בבניית קליניקה נוגע במשהו רגיש: המחיר נוגע בערך. הנישה נוגעת בזהות. שיחת ההפניה נוגעת בנראוּת. הפרופיל נוגע בפחד לא להיות מובנת.",
      outro2: [
        "זו לא חולשה אופיינית. זה לא כישלון.",
        "זה מידע: חלק שלם מהדרך המקצועית שלך פשוט לא קיבל מעולם מיכל. המנטור לקליניקה נבנה כדי להיות המיכל הזה.",
      ],
    },
    interlude: "אף אחד לא לימד אותך את זה. אז איך יכולת לדעת?",
    solution: {
      title: "מה אם היה מישהו שמחזיק אותך בדיוק שם?",
      p1: "המנטור לקליניקה הוא מנטור AI אישי למטפלים שרוצים לבנות קליניקה פרטית מלאה ויציבה יותר. הוא מלווה אותך דרך החלקים שאף אחד לא לימד: בהירוּת הנישה, הבנת הערך של העבודה שלך, קביעה ואמירה של המחיר, בניית מערכות הפניה, ומציאת השפה לנוכחות המקצועית שלך.",
      p2: "קורס נותן לך מידע. המנטור נותן לך תהליך מוחזק. הוא לא מציף אותך במודולים. הוא לא נותן לך סקריפט גנרי. הוא שואל. מקשיב. זוכר.",
      p3: "שאלה ממוקדת אחת. חתיכה אחת שהתבררה. פעולה הבאה אחת. וכשאת חוזרת — הוא ממשיך משם.",
      p4: "כן, זה AI. ולא, זה לא צ׳אטבוט גנרי. הוא מאומן על שיטה ספציפית שנבנתה למטפלים בקליניקה פרטית, והוא שואל שאלות כמו שמנטור טוב היה שואל — לא עונה תשובות כמו מנוע חיפוש. ה־AI נותן את המבנה. את מביאה את שיקול הדעת.",
      cta: "המנטור מחזיק את התהליך, כדי שלא תצטרכי להחזיק אותו לבד.",
    },
    stages: {
      eyebrow: "חמשת השלבים",
      title: "מה המנטור עושה בפועל.",
      subtitle: "לא קורס להשלים. יותר כמו מסלול שחוזרים אליו — עם שאלות ממוקדות ופעולה קונקרטית אחת בכל שלב.",
      stepLabel: "שלב",
      items: [
        {
          title: "מי את כמטפלת",
          text: "רוב המטפלים מתארים את עצמם באותן מילים. כולן נכונות, אבל הן לא עוזרות למטופלת הנכונה להרגיש: המטפלת הזו רואה משהו מהחוויה שלי. המנטור עוזר לך למצוא את החוט העמוק בעבודה שלך — האופן שבו את מקשיבה, סוג הכאב שאת מבינה, הלקוחות שנוטים באופן טבעי אלייך.",
        },
        {
          title: "כמה שווה העבודה שלך",
          text: "עבור הרבה מטפלים, תמחור הוא לא רק החלטה עסקית. הוא אירוע במערכת העצבים. המנטור עוזר לך לבחון מאיפה המחיר הנוכחי שלך באמת הגיע — ולמצוא מחיר שאת יכולה לעמוד מאחוריו, שמחזיק גם את צורך הנגישות של המטופל וגם את הצורך בקליניקה בת־קיימא.",
        },
        {
          title: "מאיפה יגיעו הלקוחות",
          text: '"תשווקי את עצמך" מעורפל מדי מכדי לפעול לפיו. המנטור עוזר לך לבנות מפת הפניות מדויקת: אנשי המקצוע הספציפיים שכבר פוגשים את המטופלים העתידיים שלך. פחות רדיפה. יותר מערכות יחסים.',
        },
        {
          title: "איך לדבר עם אנשי הפניה",
          text: "כאן הרבה מטפלים נעצרים — לא כי לא הבינו את האסטרטגיה, אלא כי השיחה עצמה מרגישה חשופה. המנטור עושה איתך סימולציה של השיחה, משקף מה נשמע טבעי ומה נשמע מתנצל. את מתרגלת עד שזה כבר לא לא־נעים.",
        },
        {
          title: "איך להציג את עצמך",
          text: "כל מה שהתברר הופך לשפה: פרופיל, הצגה עצמית מקצועית, ניסוח להפניות, והמשפט שגורם לאדם להבין למה דווקא אלייך יפנה מטופל ספציפי. לא סלוגן. פתח דלת ברור מספיק, שהאדם הנכון יזהה שהחדר שלך אולי הוא המקום.",
        },
      ],
      innerLabel: "ומתחת לכל זה",
      innerTitle: "העבודה הפנימית, במקביל.",
      innerText:
        "בניית קליניקה תמיד מבקשת ממך להיעשות נראית, לנקוב בערך שלך, לסבול להיבחר, לסבול לא להיבחר, ולהפסיק לחכות לאישור. רוב הכלים העסקיים מדלגים על השכבה הזו. המנטור עובד במקביל על הצעדים המעשיים ועל העמדה הפנימית — כי אצל מטפלים, השניים כמעט לא נפרדים.",
    },
    experience: {
      eyebrow: "החוויה",
      title: "איך זה נראה בפועל?",
      items: [
        { title: "זמין מתי שמתאים לך", text: "בבוקר, בערב, בין מטופלים, אפילו בסוף יום ארוך." },
        { title: "זוכר אותך", text: "הוא זוכר מה אמרת בפגישה הקודמת וממשיך מאיפה שעצרתם." },
        {
          title: "שאלות ממקדות",
          text: "לא צ׳אט פתוח. AI שמאומן על שיטה שנבנתה למטפלים, כדי להביא תוצאות בפועל.",
        },
        {
          title: "שולח לפעולה",
          text: "פעולה קונקרטית אחת בכל פעם. הוא מחכה שתחזרי לדווח מה עבד ומה צריך המשך חידוד.",
        },
      ],
      closing: "כמו תהליך ליווי. רק שזמין תמיד, מכיר אותך לעומק, ועם סבלנות אינסופית.",
    },
    proof: {
      eyebrow: "מהשטח",
      title: "מה קרה למטפלים שעבדו איתו.",
      quotes: [
        "הייתי סקפטית, אבל החוויה הרגישה אישית להפליא — כלל לא רובוטית. אהבתי כמה שהניסוחים היו מדויקים ומעודנים.",
        "ממש אפשר להרגיש את הלב האנושי פועם מאחורי המסך.",
        "המנטור עזר לי ליישר קו לפי הרגשות האמיתיים, הערכים הקליניים והאישיות שלי. זה מה שמייחד אותו מפלטפורמות AI גנריות.",
        "העליתי מחירים — ולראשונה הרגשתי שאני מקבלת תגמול שאני באמת ראויה לו.",
        "הוא דוחף קדימה בעדינות ונותן משוב מצוין. יש לו יכולת ייחודית להיאחז בדיוק במשפט הנכון כדי לאשרר ולעודד את ההתקדמות שלך.",
      ],
    },
    beta: {
      eyebrow: "גרסת בטא",
      title: "תנאים שלא יחזרו.",
      exclusive: "בלעדי לגרסת הבטא",
      seats: "לזמן מוגבל בלבד",
      p1: "המנטור לקליניקה פתוח כעת בגרסת בטא. אפשר להתחיל היום: לחדד את הנישה, לחזק את המחיר, למפות הפניות, לתרגל שיחות, ולעצב את שפת הקליניקה שלך.",
      p2: "בתמורה למחיר המיוחד — אנחנו מבקשים את המשוב הכן שלך. מה עובד, מה חסר, איפה אפשר לדייק. כשגרסת הבטא תסתיים, גם המחיר הזה יסתיים.",
      warningTitle: "המנטור מיועד למטפלות שמוכנות לא רק לקרוא — אלא לפעול.",
      warningBody:
        "כל שלב מסתיים בפעולה ליישום במציאות. אם את מחפשת עוד ידע לצבור — זה לא בשבילך. אם את מוכנה להיות בתנועה — אנחנו כאן.",
    },
    pricing: {
      investment: "ההשקעה שלך",
      futurePrice: "מחיר רגיל:",
      futurePriceValue: "₪1,800",
      currentPrice: "₪750",
      priceNote: "תשלום חד־פעמי · כולל מע״מ · מחיר בטא · כולל כל השיפורים העתידיים",
      bullets: [
        "נישה ברורה יותר, ומחיר שאפשר לומר בלי להתנצל",
        "מפת הפניות שנותנת לך כיוון",
        "שפה מקצועית שנשמעת כמוך — ופעולה אחת קדימה, שוב ושוב",
      ],
      cta: "✦ אני רוצה את המנטור לצידי",
      secure: "תשלום מאובטח דרך משולם",
    },
    contact: {
      title: "שאלות?",
      body: "כתבו לאליענה ישירות. היא קוראת ועונה על כל הודעה.",
      whatsapp: "שליחת הודעה בוואטסאפ",
    },
  },
  en: {
    badge: "The Clinic Mentor · Beta",
    hero: {
      titleLine1: "You were trained to hold a therapy room.",
      titleLine2: "No one taught you how to build the clinic around it.",
      body: "The Mentor is a personal AI practice mentor for therapists building a private practice — guiding you, one focused conversation at a time, through your niche, your fee, your referral relationships, and the language that helps the right clients recognize: this therapist understands me. Not with hype. Not with generic marketing scripts. And not by asking you to become someone you're not. One focused question. One concrete action. In a language that still feels like you.",
      cta: "✦  Start building the container for my practice  →",
      ctaNote:
        "One-time payment · Full access · No subscription · Beta rate · Built for licensed and pre-licensed therapists",
      trialCta: "Try free for 24 hours — pricing focus",
      loginPrompt: "Already signed up?",
      loginLink: "Log in",
    },
    trustBar: [
      { Icon: Lock, text: "Secure checkout" },
      { Icon: UsersIcon, text: "For licensed & pre-licensed therapists" },
      { Icon: Star, text: "A held process, not a course" },
      { Icon: MessageCircle, text: "Questions? Message Eliana directly" },
    ],
    problem: {
      eyebrow: "The gap",
      title: [
        "Years of psychotherapy training.",
        "And no one taught you this.",
      ],
      intro:
        "You learned to listen. To assess. To hold complexity. To create a therapeutic space where something real can happen. But no one taught you how to answer the questions that decide whether people will ever find their way to your room:",
      questions: [
        "How do I build a referral network when I'm starting from scratch?",
        "How do I explain what makes my work distinct, without sounding performative?",
        "How do I state my fee without shrinking, apologizing, or negotiating against myself?",
        "How do I write a profile that sounds like me — and makes the right person want to reach out?",
      ],
      closing: "This is taught nowhere. So how could you have known?",
    },
    personas: {
      title: "Therapists try to solve this puzzle alone.",
      subtitle: "And alone, it takes years. With many quiet costs along the way.",
      list: [
        "The therapist who quotes a lower fee on the phone, afraid the client will say no. And then resents the session.",
        "The one who knows she has something real to offer, but when she needs to explain it, the words become thinner than the work itself.",
        "The one who set up a profile, posted on social media twice, and abandoned both. Because it felt fake.",
        "The one waiting for the practice to grow on its own.",
        "The one who keeps returning to institutional work, because building a practice alone is exhausting.",
        "The one who already tried. Bought courses, read, understood everything. And then did nothing with it. Because knowledge alone doesn't move people.",
        "The one who knows she needs a business consultant, but has seen those programs charge $3,000–$10,000 and can't justify it right now.",
      ],
      outro1:
        "The problem is not willingness. It is not talent. It is not clinical depth. Every step of building a practice touches something tender. The fee touches worth. The niche touches identity. The referral conversation touches visibility. The profile touches the fear of being misunderstood.",
      outro2: [
        "This is not a character flaw. This is not failure.",
        "It is information: one whole part of your professional path was never given a container. The Clinic Mentor was built to be that container.",
      ],
    },
    earlyQuote: {
      text: "You can truly feel the human heart beating behind the screen.\nIt is absolutely wonderful.",
      name: "[Name placeholder — client to replace]",
      details: "[License] · [Years in practice] · [Country placeholder]",
    },
    interlude: "No one taught you this. So how could you have known?",
    solution: {
      title: "Meet the Mentor.",
      p1: "The Mentor is a personal AI mentor for therapists who want to build a fuller, more stable private practice. It guides you through the parts most therapists were never taught: clarifying your niche, understanding the value of your work, setting and stating your fee, building referral relationships, and finding the language for your professional presence.",
      p2: "A course gives you information. The Mentor gives you a held process. It doesn't flood you with modules. It doesn't hand you a generic script. It asks. It listens. It remembers.",
      p3: "One focused question. One clarified piece. One next action. And when you come back, it continues from there.",
      p4: "The AI gives structure. You bring discernment. The Mentor holds the process, so you don't have to hold it alone.",
      aiNote:
        "Yes, it's AI. And no, it's not a generic chatbot. It's trained on a specific method built for private-practice therapists, and it asks questions the way a good mentor would — not answers the way a search engine does.",
      cta: "What would change if building your clinic had a holding environment too?",
    },
    founders: {
      eyebrow: "Who built this",
      title: "Ariel & Eliana Shapira",
      caption: "Ariel & Eliana Shapira",
      body: [
        "We are a clinical psychologist and a psychotherapist who have sat, again and again, with therapists who are deeply capable in the room — and strangely alone outside of it. Therapists who know how to hold pain, complexity, rupture, repair. But when they need to say what they do, who they help, or what they charge, something becomes quiet. Not because they have nothing to say — because no one helped them build the bridge between their clinical depth and their public language.",
        "Dr. Ariel Shapira is a clinical psychologist and supervisor with more than 12 years of experience in the public system and private practice. His work helps therapists connect to their professional value and stand more fully behind the work they do.",
        "Eliana Shapira is a psychotherapist, content strategist, and AI expert who has worked with hundreds of therapists on building clinics that are not only full, but emotionally and professionally sustainable.",
        "The Clinic Mentor grew from the meeting point between those worlds: clinical thinking, business clarity, and what AI makes possible when it is trained not to replace the human element, but to strengthen it. Because AI can give information — but the real work here is transformation: the moment a therapist begins to experience her work as clear, valuable, needed, and possible to bring into the world.",
      ],
      contactHint: "Questions? Message Eliana directly.",
      contactCta: "Send a WhatsApp message",
    },
    stages: {
      eyebrow: "The five stages",
      title: "The Mentor guides you through five stages.",
      subtitle:
        "Not a course you need to complete. More like a path you return to. Each stage gives you focused questions, reflection, language — and one concrete action, so the work doesn't stay in your head.",
      stepLabel: "Stage",
      items: [
        {
          title: "Who you are as a therapist",
          text: "Most therapists describe themselves in similar words. All true — but it doesn't yet help the right person feel: this therapist sees something about my experience. The Mentor helps you find the deeper thread in your work — the way you listen, the kind of pain you understand, the clients who naturally lean toward you. Not branding as performance. Branding as accurate witnessing.",
        },
        {
          title: "What your work is worth",
          text: "For many therapists, pricing is not only a business decision. It's a nervous-system event. The Mentor helps you examine where your current fee actually came from — and find a fee you can stand behind. One that holds two needs at once: the client's need for access, and your need for a clinic that can sustain you. Sustainability is not greed. It's the condition that lets good work continue.",
        },
        {
          title: "Where clients will come from",
          text: "\"Market yourself\" is too vague to act on. The Mentor helps you build a thoughtful referral map: the specific professionals who already meet your future clients — physicians, schools, psychiatrists, dietitians, therapists in adjacent specialties. Instead of asking, \"How do I make strangers notice me?\" you begin asking, \"Who already meets the people I'm meant to help?\" Less chasing. More relationship.",
        },
        {
          title: "How to speak with referral contacts",
          text: "This is where many therapists stop. Not because they don't understand the strategy — because the conversation itself feels exposed. The Mentor role-plays the conversation with you. It reflects what sounds natural and what sounds apologetic. You practice until it stops being uncomfortable. When you reach out, you're not \"selling yourself.\" You're creating a professional bridge.",
        },
        {
          title: "How to present yourself",
          text: "Everything you've clarified becomes language: a profile, a professional introduction, referral wording, and the sentence that helps someone understand why they'd send a specific client to you. Not a tagline. Not a performance. A clear enough doorway, so the right person can recognize that your room may be the place she was looking for.",
        },
      ],
      innerLabel: "And beneath all of this",
      innerTitle: "The inner posture, alongside the practical steps.",
      innerText:
        "Building a clinic is never only about tasks. It asks you to become visible, to name your value, to tolerate being chosen, to tolerate not being chosen, to stop waiting for permission. Most business tools skip this layer. The Clinic Mentor doesn't — because for therapists, the practical steps and the inner posture are rarely separate. The referral email is a moment of professional presence. The fee is part of the frame. The niche is the language that helps the right person feel less alone before she ever meets you.",
    },
    experience: {
      eyebrow: "A session might feel like this",
      title: "One focused question at a time.",
      items: [
        { title: "It asks", text: "One focused question that opens the piece that's actually stuck." },
        { title: "It listens", text: "It reflects your own words back — so you can hear what you're really saying." },
        { title: "It remembers", text: "When you come back, it continues from where you left off." },
        { title: "It sends you to action", text: "One concrete next step, before the conversation ends." },
      ],
      closing: "Like a mentor. Available when you need one. With infinite patience.",
      sampleLabel: "A session might feel like this",
      sample: [
        {
          who: "mentor",
          label: "The Mentor",
          text: "You said you feel your body contract when a potential client asks about your fee. Let's stay there for a moment. What do you imagine they're thinking when they hear the number?",
        },
        {
          who: "you",
          label: "You",
          text: "That it's too much. That they'll leave. That maybe I should offer less before they even ask.",
        },
        {
          who: "mentor",
          label: "The Mentor",
          text: "So the first movement is to protect the relationship by reducing your own need. That makes sense. And it may also be teaching the client something about how you hold the value of your work. If the fee were not a test of whether you're \"too much\" — what else could it be?",
        },
        { who: "you", label: "You", text: "A boundary. A structure. Maybe part of the frame." },
        {
          who: "mentor",
          label: "The Mentor",
          text: "Exactly. Let's build language from there. Not a sales sentence — a therapeutic frame for a business conversation.",
        },
      ],
    },
    proof: {
      eyebrow: "What therapists are saying",
      title: "Not testimonials about a tool that gives answers. Testimonials about feeling accompanied enough to move.",
      cards: [
        {
          quote:
            "I was skeptical, but the experience felt incredibly personal and not robotic at all. I genuinely loved how nuanced and thoughtful the phrasing was.",
        },
        { quote: "You can truly feel the human heart beating behind the screen." },
        {
          quote:
            "This Mentor helped me realign according to my true feelings, clinical values, and personality. That's what sets this tool apart from generic AI platforms.",
        },
        { quote: "I raised my prices — and for the first time felt I was receiving compensation I truly deserved." },
        {
          quote:
            "It gently pushes you forward while offering fantastic feedback. It has this unique ability to latch onto the exact right sentence to validate and encourage your progress.",
          wide: true,
        },
      ],
      placeholderName: "",
      placeholderDetails: "",
    },
    fitFor: {
      eyebrow: "Is this for you?",
      title: "The Clinic Mentor is not for every therapist. And that matters.",
      forHeading: "This is for you if:",
      forItems: [
        "You're a licensed or pre-licensed therapist building toward private practice.",
        "You want a fuller caseload, but you don't yet have a clear referral system.",
        "You know your clinical work has value — but when you try to explain that value, the words become thinner than the work.",
        "You've tried \"marketing\" — a directory profile, social media, a few networking attempts — and something in it felt foreign.",
        "You want to grow without becoming loud.",
        "You want guidance that respects your ethics, your pace, and your inner resistance — while still helping you move.",
      ],
      notHeading: "This is probably not the right fit if:",
      notItems: [
        "You're looking for clinical supervision that counts toward licensure hours.",
        "You want someone to do the work for you.",
        "You're not available to take one concrete action each week.",
        "Your practice is already full and you're looking for advanced scaling.",
        "You're looking for a formula that promises certainty.",
      ],
    },
    faq: {
      eyebrow: "Questions we hear often",
      title: "The things therapists ask before they begin.",
      items: [
        {
          q: "Is this clinical supervision?",
          a: "No — and it's important to say that clearly. The Clinic Mentor is business mentoring for therapists. It doesn't review your clinical cases, it doesn't give clinical instructions, and it doesn't count toward licensure hours. Think of it as support for the part of private practice that's usually left outside the supervision room: how you name your work, how you set your fee, how you build referral relationships, how you become visible without losing your integrity.",
        },
        {
          q: "Is this confidential? What about my clients' data?",
          a: "The Mentor works only with your business and professional development — your niche, your pricing, your referral map, your language. It does not need, ask for, or work with client details. No client data ever enters the system. Your clinical work stays entirely private.",
        },
        {
          q: "I've bought courses before and did nothing with them. How is this different?",
          a: "A course gives you information and leaves the work to you. The Mentor gives you a process. One focused question. One clarified piece. One next action. And when you come back, it continues from there. There is no module 7 gathering dust — just the next conversation, whenever you're ready.",
        },
        {
          q: "I'm not good with technology. Will I manage?",
          a: "If you can write a message, you can use the Clinic Mentor. It's a conversation. You type, it responds, you continue. No dashboards, no video modules to navigate, no need to \"understand AI.\"",
        },
        {
          q: "I'm pre-licensed or still completing supervised hours. Is this relevant for me?",
          a: "Yes — especially for you. The earlier you begin building these skills, the smoother the transition into private practice. Many of our founding members started while still completing their hours.",
        },
        {
          q: "Will it work for my specialty?",
          a: "The Mentor doesn't begin with a script. It begins with you — your field, your clients, your clinical language. A trauma therapist, a couples therapist, and a therapist working with eating disorders should not sound the same. The Mentor helps you find the sentence that belongs to your work. Not the sentence that belongs to marketing.",
        },
        {
          q: "What if it doesn't feel right for me?",
          a: "If you complete Stage 01 and Stage 02 and feel that the Clinic Mentor isn't the right guide for where you are, message Eliana directly within 14 days and we'll make it right. No homework to submit, no proof you tried, no hoops. A therapist should not have to feel trapped inside a process that doesn't serve her.",
        },
      ],
    },
    beta: {
      eyebrow: "Beta version",
      title: "Open in Beta. At a beta rate.",
      exclusive: "Exclusive to the Beta stage",
      seats: "For a limited time",
      p1: "The core process is fully built. You can begin today: clarifying your niche, strengthening your fee, mapping referral relationships, practicing conversations, shaping the language of your clinic.",
      p2: "And we're still listening — carefully. In exchange for the lower rate, we ask for your honest feedback. When the Beta period ends, so does this rate. Nothing more dramatic than that.",
      warningTitle: "How would you build your practice if you didn't feel you needed permission?",
      warningBody:
        "You don't need to decide right now. Close the tab. Sleep on it. Notice what comes back tomorrow. If the answer brings you back here, you'll know why.",
    },
    pricing: {
      investment: "Your investment",
      futurePrice: "Regular price:",
      futurePriceValue: "$600 USD (₪1,800)",
      currentPrice: "$250",
      currentPriceUnit: "USD",
      currentPriceSecondary: "(₪750)",
      priceNote: "One-time payment · Full access · No subscription · Includes VAT · Includes all future improvements",
      bullets: [
        "A clearer niche — and a fee you can say without apologizing",
        "A referral map that gives you direction",
        "A professional language that sounds like you",
        "One next action, again and again, until movement becomes natural",
      ],
      anchor:
        "At this price, you're investing less than: one private business coaching session · one continuing education workshop · two supervision sessions · two months on many therapist directories.",
      cta: "✦  I want the Mentor beside me  →",
      secure: "Secure payment via Meshulam",
    },
    contact: {
      title: "Have a question first?",
      body: "Write to me directly. I read and answer every message. — Eliana",
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
  const { trialOpen } = useMentorTrialOpen();
  const t = COPY[language];
  const isEn = language === "en";


  return (
    <div dir={isRTL ? "rtl" : "ltr"} lang={language} className="bg-background text-foreground">
      {/* ============ HERO ============ */}
      <section
        className="band band-grain relative w-full overflow-hidden"
        style={{ backgroundColor: "#2a0614", color: "hsl(var(--background))" }}
      >
        {/* Top-right login link (both languages) */}
        <div className={`absolute top-4 ${isRTL ? "left-4 md:left-6" : "right-4 md:right-6"} md:top-6 z-20 text-xs`}>
          <span style={{ color: "rgba(250,247,242,0.55)" }}>{t.hero.loginPrompt} </span>
          <Link to="/auth" className="underline underline-offset-2" style={{ color: "rgba(250,247,242,0.9)" }}>
            {t.hero.loginLink}
          </Link>
        </div>

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
            {trialOpen && (
              <div style={{ marginTop: "1rem", textAlign: "center" }}>
                <Link
                  to="/auth"
                  className="underline underline-offset-4 hover:opacity-90 transition"
                  style={{ color: "rgba(250,247,242,0.85)", fontSize: "14px" }}
                >
                  {t.hero.trialCta} →
                </Link>
              </div>
            )}
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
            <QuoteIcon className="mx-auto mb-5" style={{ color: "hsl(var(--terracotta))", width: 44, height: 44 }} />
            <p
              className="font-display italic text-foreground leading-relaxed whitespace-pre-line"
              style={{ fontSize: "20px" }}
            >
              {t.earlyQuote.text}
            </p>
            {t.earlyQuote.name && !t.earlyQuote.name.includes("[") && (
              <p className="mt-6 text-sm font-bold text-foreground">— {t.earlyQuote.name}</p>
            )}
            {t.earlyQuote.details && !t.earlyQuote.details.includes("[") && (
              <p className="text-xs text-muted-foreground mt-1">{t.earlyQuote.details}</p>
            )}
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
            {isEn && <p className="italic text-muted-foreground/90 text-base md:text-lg">{t.solution.aiNote}</p>}
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
              {t.experience.sample.map((m: { who: string; label: string; text: string }, i: number) =>
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
                {t.proof.placeholderName && !t.proof.placeholderName.includes("[") && (
                  <>
                    <div className="h-px w-12 my-5" style={{ background: "hsl(var(--terracotta))" }} />
                    <p className="font-bold text-foreground text-sm">{t.proof.placeholderName}</p>
                    {t.proof.placeholderDetails && !t.proof.placeholderDetails.includes("[") && (
                      <p className="text-xs text-muted-foreground mt-1">{t.proof.placeholderDetails}</p>
                    )}
                  </>
                )}
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
                    <Check className="w-4 h-4 mt-1.5 shrink-0" style={{ color: "#2f8a4d" }} />
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

      {/* ============ TESTIMONIALS CAROUSEL (admin-managed) ============ */}
      <MentorTestimonialsCarousel language={language === "en" ? "en" : "he"} />

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
