import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  Download,
  Image as ImageIcon,
  Lock,
  MessageCircle,
  Mic,
  Pencil,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Users,
  Wand2,
} from "lucide-react";
import {
  BusinessCard,
  CardPdfDocument,
  CardPresentationPage,
  CardSheetPage,
  InvitationPage,
  InvitationShare,
  PAGE_H,
  PAGE_W,
  THEME_LABELS,
  THEME_SWATCH,
} from "@/components/challenge-tools/ToolDocuments";
import type { CardData, CardTheme, InvitationData } from "@/components/challenge-tools/ToolDocuments";
import { downloadPdf, downloadPng } from "@/lib/challengeToolsExport";

// PROTOTYPE of the two challenge tools (the professional business card, the personal invitation).
// Sample data only, nothing is saved and no model is called: the wording of the results is fixed. The
// downloads are real (the same documents the real tools will produce). The real version computes what
// is missing in code and lets the model only phrase.

type Gender = "f" | "m" | "n";
type Tab = "card" | "invite" | "pair";

const SERIF = "'Frank Ruhl Libre', 'Miriam Libre', serif";

// What the registration name tells us. Unsure => the tool asks one short question.
const REG_NAMES: { key: string; name: string; guess: Gender | null }[] = [
  { key: "noa", name: "נועה לוי", guess: "f" },
  { key: "yuval", name: "יובל גולן", guess: null },
  { key: "avi", name: "אבי כהן", guess: "m" },
];

const GENDER_LABEL: Record<Gender, string> = { f: "בלשון נקבה", m: "בלשון זכר", n: "בניסוח ניטרלי" };

const forms = (g: Gender) => ({
  lead: g === "f" ? "אני עוזרת" : g === "m" ? "אני עוזר" : "אני מלווה",
  title: g === "f" ? "פסיכותרפיסטית זוגית ומשפחתית" : g === "m" ? "פסיכותרפיסט זוגי ומשפחתי" : "טיפול זוגי ומשפחתי",
  invite: g === "f" ? "אני מזמינה אתכם" : g === "m" ? "אני מזמין אתכם" : "אשמח לפגוש אתכם",
});

const CONTACT = ["050-000-0000", "name@example.com"];

const VARIANTS = [
  {
    tag: "לפי הקהל",
    who: "לזוגות שהפכו להורים ומרגישים שהתרחקו זה מזה,",
    change: "לבנות מחדש חיבור ושפה משותפת.",
  },
  {
    tag: "לפי הקושי",
    who: "לאמהות טריות שמרגישות לבד גם כשהבית מלא,",
    change: "לחזור להרגיש קרובות לבן הזוג ולעצמן.",
  },
  {
    tag: "לפי השינוי",
    who: "לזוגות אחרי לידה ראשונה,",
    change: "לעבור ממריבות על כל דבר קטן לשיחה שבה שניהם מרגישים שרואים אותם.",
  },
];

interface QDef {
  label: string;
  hint: string;
  sample: string;
  before?: ReactNode; // an instruction that comes BEFORE the question
  example?: string; // a concrete example, so the question is not too general
  custom?: ReactNode; // replaces the text box (e.g. marking words)
}

type Client = "f" | "m";

const PERSON_LEAD =
  "לפני שעונים: חשבו על אדם אחד, אמיתי או מדומיין, שהכי טוב לכם לעבוד איתו. לא קהל ולא כל העולם. בלי שם ובלי פרטים מזהים.";

// Tool 1. The first question describes WHO the person is (this is what defines the niche), the next two
// are what troubles him and what he hopes will change. Each one asks for a situation, not a label.
const Q1_BASE: Omit<QDef, "sample">[] = [
  {
    before: PERSON_LEAD,
    label: "מי האדם הזה?",
    hint: "תארו אותו כפי שהוא נכנס אליכם לחדר: גיל, שלב בחיים, מצב משפחתי ועבודה, ומה הוא עושה בימים רגילים. מהתיאור הזה נגדיר מי המטופל שאליו אתם רוצים לפנות, וזו הנישה שלכם.",
    example: "למשל: “אישה בת 34, אמא לתינוק בן ארבעה חודשים. חזרה לעבוד חצי משרה, נשואה, ובן הזוג שלה מגיע הביתה מאוחר.”",
  },
  {
    before: "אותו אדם שחשבתם עליו.",
    label: "מה מעסיק ומטריד אותו, עד שהוא מחליט לפנות?",
    hint: "תארו מצב ולא תווית: לא “חרדה”, אלא מה קורה לו בפועל, ומה היה הרגע שבו הבין שהגיע הזמן.",
    example: "למשל: “הם רבים על דברים קטנים, וקשה לה לספר לו איך היא מרגישה. היא הבינה שמשהו לא בסדר כשהתחילה לבכות במקלחת בלי סיבה.”",
  },
  {
    before: "אותו אדם שחשבתם עליו.",
    label: "מה הוא מקווה שישתנה בחייו בעקבות העבודה איתך?",
    hint: "איך ייראה ערב או בוקר רגיל אחרי השינוי? משהו שאפשר לראות ולשמוע.",
    example: "למשל: “שיהיה לה כוח בבוקר, ושהם יחזרו לשבת ביחד בערב ולדבר.”",
  },
];

const SAMPLE1: Record<Client, string[]> = {
  f: [
    "אישה בת 34, אמא לתינוק בן ארבעה חודשים. חזרה לעבוד חצי משרה, נשואה, ובן הזוג שלה מגיע הביתה מאוחר.",
    "היא כל הזמן עייפה, הם רבים על דברים קטנים וקשה לה לספר לו איך היא מרגישה. היא הבינה שמשהו לא בסדר כשהתחילה לבכות במקלחת בלי סיבה.",
    "שיהיה לה כוח בבוקר, ושהם יחזרו לשבת ביחד בערב ולדבר בלי לפחד ממריבה.",
  ],
  m: [
    "גבר בן 37, אבא טרי לתינוק בן ארבעה חודשים. עובד בהייטק וחוזר הביתה בשבע בערב, נשוי, ומרגיש שהבית כבר לא שלו.",
    "הוא מרגיש מיותר, אשתו מדברת איתו רק על התינוק, והוא לא יודע איפה הוא נכנס. הוא הבין שצריך עזרה כשהתחיל להישאר במשרד עד מאוחר בכוונה.",
    "שיהיה לו שוב מקום בבית, ושהם יחזרו לשבת ביחד בערב.",
  ],
};

// The niche that comes out of the first answer (fixed here; computed and phrased in the real tool).
const NICHE_LINE = "זוגות בשנה הראשונה אחרי לידה ראשונה, שבהם אחד מבני הזוג מרגיש שהקשר התרחק.";

// Tool 2, built the NEXT day on top of the card: the difficulty in his own words, the change in daily life,
// and marking the words in yesterday's card that he would never say about himself.
const Q2_BASE: Omit<QDef, "sample" | "before" | "custom">[] = [
  {
    label: "איך הוא מתאר את הקושי? לא לאיש מקצוע, אלא לחבר, או אפילו ליומן האישי.",
    hint: "כתבו משפט אחד או שניים שמתארים איך הקושי בא לידי ביטוי בחיים שלו. במילים שלו, גם אם הן לא מקצועיות.",
    example: "למשל: “אני מותשת ואנחנו כבר לא מדברים, רק מעבירים מידע על התינוק.”",
  },
  {
    label: "איך הוא היה מתאר את השינוי שהוא מצפה לו, ואיך זה היה נראה בחיי היומיום שלו?",
    hint: "תמונה קטנה של ערב או בוקר רגיל, משהו שאפשר לראות ולשמוע.",
    example: "למשל: “שנשב בערב על הספה ונדבר על משהו שהוא לא התינוק.”",
  },
  {
    label: "סמנו בכרטיס הביקור מאתמול מילים מופשטות או מונחים מקצועיים שהוא לא היה אומר על עצמו.",
    hint: "למשל “ויסות”, “דפוסים”, “מרחב בטוח”, “העצמה”, “כלים”, “חיבור”. חלקן מקצועיות וחלקן סתם עמומות, ושתיהן מרחיקות. מילים שתסמנו לא יופיעו בפתק.",
  },
];

const SAMPLE2: Record<Client, string[]> = {
  f: [
    "אני מותשת ואנחנו כבר לא מדברים, רק מעבירים מידע על התינוק. אני מתגעגעת אליו וכועסת עליו באותו זמן.",
    "שנשב בערב על הספה, נדבר על משהו שהוא לא התינוק, ואני ארגיש שהוא רואה אותי.",
    "",
  ],
  m: [
    "אני עייף ואין לי מקום בבית. היא מדברת איתי רק על התינוק, ואני לא יודע איפה אני נכנס. אני מתגעגע אליה ומרגיש מיותר.",
    "שנשב בערב ביחד, בלי הטלפון, ושהיא תשאל אותי מה שלומי.",
    "",
  ],
};

// Words that keep a person at a distance. The code flags them in yesterday's card; the therapist confirms.
const JARGON = ["ויסות", "דפוסים", "מרחב", "העצמה", "כלים", "חיבור", "תהליך", "ליווי"];

// What the note says instead, taken from his own words (fixed samples here).
const REPLACE: Record<string, string> = {
  חיבור: "שהוא רואה אותך",
  דפוסים: "מה שחוזר כל ערב",
  כלים: "משהו שאפשר לעשות כבר הערב",
  ויסות: "להירגע אחרי יום כזה",
  העצמה: "להרגיש שיש לך מקום",
};

const REACT1 = [
  "זה בדיוק מה שאני צריכה: אדם אחד, עם גיל ועם חיים. מכאן עולה הנישה שלכם.",
  "מצב ולא תווית. זה מה שהכרטיס צריך לדעת עליו.",
  "יפה. עכשיו אני מנסחת.",
];
const REACT2 = [
  "זה הקול שלו, ואותו נשמור כמו שהוא.",
  "תמונה ברורה. זה מה שנותן לפתק את תחושת ה“וואו, זה אני”.",
  "מצוין. את המילים האלה לא נשתמש בהן, ואכתוב את הפתק מתוך המילים שלו.",
];

// The note is written TO the client in the second person, from what he or she wrote: his own words, the
// contradiction he lives in, the small picture of the change, and only then a short invitation. No
// explanation, no "this is normal", no statistics. In the real tool the code checks that his words appear.
const INVITE_LINE = "זו העבודה שלי עם זוגות. אם בא לך להתחיל משם, אשמח לשיחת היכרות קצרה.";

const NOTES: Record<Client, string[]> = {
  f: [
    "את מותשת, ובבית כבר לא מדברים. רק מעבירים מידע על התינוק, כמו שני עובדים שמחליפים משמרת.",
    "ובאותו רגע את מתגעגעת אליו וכועסת עליו, וקשה להגיד את שני הדברים בקול.",
    "מה שאת רוצה נשמע פשוט, וקשה כל כך: ערב אחד על הספה, שבו מדברים על משהו שהוא לא התינוק, ושאת מרגישה בו שהוא רואה אותך.",
    INVITE_LINE,
  ],
  m: [
    "אתה עייף, ואין לך מקום בבית. היא מדברת איתך רק על התינוק, ואתה לא יודע איפה אתה נכנס.",
    "ובאותו רגע אתה מתגעגע אליה ומרגיש מיותר, וקשה להגיד את שני הדברים בקול.",
    "מה שאתה רוצה נשמע פשוט, וקשה כל כך: ערב ביחד, בלי הטלפון, שבו היא שואלת אותך מה שלומך.",
    INVITE_LINE,
  ],
};

// Phrases from his own answers that must survive into the note (the real tool checks this in code).
const HIS_WORDS: Record<Client, string[]> = {
  f: ["מותשת", "מעבירים מידע על התינוק", "מתגעגעת אליו וכועסת עליו", "משהו שהוא לא התינוק"],
  m: ["עייף", "רק על התינוק", "מתגעגע אליה ומרגיש מיותר", "בלי הטלפון"],
};

const LOCKED = [
  { Icon: Search, name: "מציאת נישה", gives: "משפט מיקוד, כותרת לדף ובדיקה מול עמית" },
  { Icon: Tag, name: "תמחור", gives: "משפט מחיר ותשובה למי שמהסס" },
  { Icon: Mic, name: "הצגה עצמית", gives: "היכרות של 30 שניות ופסקה לאתר" },
  { Icon: Users, name: "רשת הפניות", gives: "הודעה פותחת לשלושה סוגי מפנים, ומעקב", next: true },
  { Icon: MessageCircle, name: "גישור קשר", gives: "הודעת פנייה לעמית שעוד לא מכיר אותך" },
  { Icon: CalendarCheck, name: "תרגול שיחה ראשונה", gives: "מבנה שיחה ותשובה לשאלה על המחיר" },
];

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Scales a fixed-size document to the width available, so a real A4 page can be previewed.
function ScaledBox({ baseWidth, baseHeight, children }: { baseWidth: number; baseHeight: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / baseWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseWidth]);
  return (
    <div ref={ref} style={{ width: "100%", height: baseHeight * scale, position: "relative", overflow: "hidden" }}>
      <div style={{ width: baseWidth, height: baseHeight, transform: `scale(${scale})`, transformOrigin: "top right", position: "absolute", top: 0, right: 0 }}>
        {children}
      </div>
    </div>
  );
}

function NeriLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <img src="/images/neri-avatar.png" alt="" className="h-9 w-9 shrink-0 rounded-full border border-mentor-border object-cover" />
      <p className="pt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function Chips<T extends string>({ value, options, onChange }: { value: T | null; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
            value === o.id ? "border-primary bg-primary text-primary-foreground" : "border-mentor-border bg-card hover:bg-mentor-surface"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// One question at a time, a short reaction between them, then a "writing it up" beat.
function Guided({
  eyebrow,
  title,
  intro,
  questions,
  reactions,
  answers,
  setAnswers,
  canStart,
  gate,
  writingText,
  finishLabel,
  onFinish,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  questions: QDef[];
  reactions: string[];
  answers: string[];
  setAnswers: (a: string[]) => void;
  canStart: boolean;
  gate: ReactNode;
  writingText: string;
  finishLabel: string;
  onFinish: () => void;
}) {
  const [i, setI] = useState(-1);
  const [nudged, setNudged] = useState(false);
  const [writing, setWriting] = useState(false);

  const next = () => {
    const q = questions[i];
    const a = answers[i] ?? "";
    if (!q.custom && wordCount(a) < 7 && !nudged) {
      setNudged(true);
      return;
    }
    setNudged(false);
    if (i === questions.length - 1) {
      setWriting(true);
      setTimeout(onFinish, 1700);
    } else setI(i + 1);
  };

  if (writing) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Sparkles className="h-8 w-8 animate-pulse text-mentor-accent" />
        <p className="text-lg" style={{ fontFamily: SERIF }}>
          {writingText}
        </p>
        <p className="text-sm text-muted-foreground">זה לוקח כמה שניות.</p>
      </div>
    );
  }

  if (i < 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6 py-6">
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 className="mt-2 text-3xl leading-tight text-primary" style={{ fontFamily: SERIF }}>
            {title}
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{intro}</p>
        </div>
        {gate}
        <button
          disabled={!canStart}
          onClick={() => setI(0)}
          className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          מתחילים
        </button>
      </div>
    );
  }

  const q = questions[i];
  const a = answers[i] ?? "";
  return (
    <div className="mx-auto max-w-xl space-y-5 py-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          שאלה {i + 1} מתוך {questions.length}
        </span>
        <span className="flex gap-1.5">
          {questions.map((_, k) => (
            <span key={k} className={`h-1.5 w-8 rounded-full ${k <= i ? "bg-primary" : "bg-mentor-border"}`} />
          ))}
        </span>
      </div>
      {i > 0 && <NeriLine>{reactions[i - 1]}</NeriLine>}
      {q.before && <div className="rounded-xl border border-mentor-border bg-mentor-surface/70 p-4 text-sm leading-relaxed">{q.before}</div>}
      <h3 className="text-2xl leading-snug text-primary" style={{ fontFamily: SERIF }}>
        {q.label}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{q.hint}</p>
      {q.example && (
        <p className="border-s-2 border-mentor-accent/60 ps-3 text-sm leading-relaxed text-muted-foreground" style={{ fontFamily: SERIF }}>
          {q.example}
        </p>
      )}
      {q.custom ?? (
        <textarea
          value={a}
          onChange={(e) => {
            const next = [...answers];
            next[i] = e.target.value;
            setAnswers(next);
            setNudged(false);
          }}
          rows={4}
          placeholder="כתבו כאן…"
          className="w-full resize-none rounded-xl border border-mentor-border bg-card p-4 text-base leading-relaxed"
        />
      )}
      {nudged && !q.custom && (
        <NeriLine>אפשר להרחיב קצת? ככל שהתיאור קונקרטי יותר, כך התוצר חד יותר. אם זה מספיק לך, לחצו שוב על “הבא”.</NeriLine>
      )}
      <div className="flex items-center justify-between">
        <button onClick={next} className="rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground">
          {i === questions.length - 1 ? finishLabel : "הבא"}
        </button>
        {!q.custom && (
          <button
            onClick={() => {
              const filled = [...answers];
              filled[i] = q.sample;
              setAnswers(filled);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            <Wand2 className="h-3.5 w-3.5" />
            למלא דוגמה (לתצוגה בלבד)
          </button>
        )}
      </div>
    </div>
  );
}

function DownloadButtons({ onPdf, onPng, pngLabel }: { onPdf: () => Promise<void>; onPng: () => Promise<void>; pngLabel: string }) {
  const [busy, setBusy] = useState<"pdf" | "png" | null>(null);
  const run = (kind: "pdf" | "png", fn: () => Promise<void>) => async () => {
    setBusy(kind);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={run("pdf", onPdf)}
        disabled={!!busy}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {busy === "pdf" ? "מכינה את הקובץ…" : "הורדת PDF"}
      </button>
      <button
        onClick={run("png", onPng)}
        disabled={!!busy}
        className="inline-flex items-center gap-2 rounded-xl border border-mentor-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-mentor-surface disabled:opacity-60"
      >
        <ImageIcon className="h-4 w-4" />
        {busy === "png" ? "מכינה את התמונה…" : pngLabel}
      </button>
    </div>
  );
}

const ChallengeToolsPreview = () => {
  const [regKey, setRegKey] = useState("noa");
  const reg = REG_NAMES.find((r) => r.key === regKey)!;
  const [picked, setPicked] = useState<Gender | null>(reg.guess);
  const [tab, setTab] = useState<Tab>("card");
  const [theme, setTheme] = useState<CardTheme>("burgundy");

  const [ans1, setAns1] = useState<string[]>(["", "", ""]);
  const [done1, setDone1] = useState(false);
  const [variant, setVariant] = useState(0);
  const [editingSentence, setEditingSentence] = useState(false);
  const [sentenceEdit, setSentenceEdit] = useState<string | null>(null);

  const [ans2, setAns2] = useState<string[]>(["", "", ""]);
  const [done2, setDone2] = useState(false);
  const [cg, setCg] = useState<Client | null>(null);
  const [day, setDay] = useState<1 | 2>(1);
  const [marked, setMarked] = useState<string[] | null>(null);
  const [letterEdit, setLetterEdit] = useState<string | null>(null);

  useEffect(() => {
    // Preview-only fonts; the real pages would load them once.
    const id = "challenge-tools-fonts";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Gveret+Levin&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  const switchReg = (key: string) => {
    setRegKey(key);
    setPicked(REG_NAMES.find((r) => r.key === key)!.guess);
    setSentenceEdit(null);
    setLetterEdit(null);
    setMarked(null);
  };

  // Day 2 simulates that the card was filled in yesterday, so the note can be built on top of it.
  const switchDay = (d: 1 | 2) => {
    setDay(d);
    if (d === 1) {
      setTab("card");
      return;
    }
    const gg = cg ?? "f";
    setCg(gg);
    if (!done1) {
      setAns1(SAMPLE1[gg]);
      setDone1(true);
    }
    setTab("invite");
  };

  const g: Gender = picked ?? "n";
  const f = forms(g);
  const v = VARIANTS[variant];

  const cardData: CardData = useMemo(
    () => ({
      name: reg.name,
      title: f.title,
      lead: sentenceEdit ? "" : f.lead,
      who: sentenceEdit ?? v.who,
      change: sentenceEdit ? "" : v.change,
      contact: CONTACT,
      theme,
    }),
    [reg.name, f.title, f.lead, v, sentenceEdit, theme],
  );

  const cardSentence = sentenceEdit ?? `${f.lead} ${v.who} ${v.change}`;
  const cleanTok = (t: string) => t.replace(/[.,;:!?“”"]/g, "");
  const tokens = cardSentence.split(/\s+/).filter(Boolean);
  const autoMarked = tokens.map(cleanTok).filter((t) => JARGON.some((j) => t.includes(j)));
  const effMarked = marked ?? autoMarked;
  const toggleMark = (w: string) => setMarked(effMarked.includes(w) ? effMarked.filter((x) => x !== w) : [...effMarked, w]);
  const y1 = ans1.some((x) => x.trim()) ? ans1 : SAMPLE1[cg ?? "f"];

  const noteText = letterEdit ?? NOTES[cg ?? "f"].join("\n\n");
  const noteParts = noteText.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  const invData: InvitationData = {
    headline: noteParts[0] ?? "",
    paragraphs: noteParts.slice(1),
    name: reg.name,
    title: f.title,
    contact: CONTACT,
  };
  const markNode = (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-1 gap-y-2 rounded-xl border border-mentor-border bg-card p-4" style={{ fontFamily: SERIF }}>
        {tokens.map((tk, k) => {
          const w = cleanTok(tk);
          const on = effMarked.includes(w);
          return (
            <button
              key={k}
              onClick={() => toggleMark(w)}
              className={`rounded-md px-1.5 py-0.5 text-xl transition-colors ${
                on ? "bg-mentor-accent/20 text-mentor-accent line-through decoration-2" : "hover:bg-mentor-surface"
              }`}
            >
              {tk}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {autoMarked.length > 0
          ? `זיהינו אוטומטית ${autoMarked.length === 1 ? "מילה אחת שמרחיקה" : `${autoMarked.length} מילים שמרחיקות`}. אפשר ללחוץ על כל מילה כדי להוסיף או להסיר.`
          : "לא זיהינו אוטומטית מילים כאלה. אפשר ללחוץ על כל מילה שאתם חושבים שהוא לא היה אומר."}
      </p>
    </div>
  );

  const q1: QDef[] = Q1_BASE.map((q, i) => ({ ...q, sample: SAMPLE1[cg ?? "f"][i] }));
  const q2: QDef[] = Q2_BASE.map((q, i) => ({
    ...q,
    sample: SAMPLE2[cg ?? "f"][i],
    before:
      i === 0 ? (
        <>
          אתמול כתבתם על מה שמעסיק אותו: <span style={{ fontFamily: SERIF }}>“{y1[1]}”</span>. עכשיו נכתוב איך הוא עצמו היה אומר את זה.
        </>
      ) : undefined,
    custom: i === 2 ? markNode : undefined,
  }));
  const diary = ans2[0] || SAMPLE2[cg ?? "f"][0];

  const yesterday = (
    <div className="space-y-3 rounded-xl border border-mentor-border bg-card p-4">
      <p className="text-sm font-semibold text-primary">מה כבר יש לכם מאתמול</p>
      <div className="rounded-lg bg-[#f3ece1] p-3">
        <ScaledBox baseWidth={640} baseHeight={356}>
          <BusinessCard data={cardData} width={640} />
        </ScaledBox>
      </div>
      <ul className="space-y-1.5 text-sm leading-relaxed">
        <li>
          <span className="text-muted-foreground">מי הוא: </span>
          {y1[0]}
        </li>
        <li>
          <span className="text-muted-foreground">מה מעסיק אותו: </span>
          {y1[1]}
        </li>
        <li>
          <span className="text-muted-foreground">מה הוא מקווה: </span>
          {y1[2]}
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">היום עוברים מהשפה שלכם לשפה שלו. אפשר להוסיף ולשנות את מה שכתבתם אתמול דרך השאלות.</p>
    </div>
  );

  const clientGate = (
    <div className="space-y-2.5 rounded-xl border border-mentor-border bg-mentor-surface/60 p-4 text-sm">
      <p className="leading-relaxed">שאלה אחת: מי האדם שחשבתם עליו?</p>
      <Chips<Client>
        value={cg}
        options={[
          { id: "f", label: "אישה" },
          { id: "m", label: "גבר" },
        ]}
        onChange={(c) => {
          setCg(c);
          setLetterEdit(null);
        }}
      />
      <p className="text-xs text-muted-foreground">הפתק פונה אליו בגוף שני, ולכן צריך לדעת. בגרסה האמיתית נזהה את זה מהתיאור שלכם, ונשאל רק כשזה לא ברור.</p>
    </div>
  );

  const showMore = (tab === "card" && done1) || (tab === "invite" && done2) || tab === "pair";


  const genderGate = (
    <div className="rounded-xl border border-mentor-border bg-mentor-surface/60 p-4 text-sm">
      <p className="text-xs text-muted-foreground">השם ברישום: {reg.name}</p>
      {picked ? (
        <p className="mt-1.5 leading-relaxed">
          כתבנו עלייך {GENDER_LABEL[picked]}, לפי השם. לא מתאים?{" "}
          <button className="text-primary underline underline-offset-2" onClick={() => setPicked(null)}>
            שינוי
          </button>
        </p>
      ) : (
        <div className="mt-1.5 space-y-2.5">
          <p className="leading-relaxed">שאלה אחת לפני שמתחילים: איך נכון לכתוב עלייך בכרטיס ובפתק?</p>
          <Chips<Gender>
            value={picked}
            options={[
              { id: "f", label: "בלשון נקבה" },
              { id: "m", label: "בלשון זכר" },
              { id: "n", label: "ניסוח ניטרלי" },
            ]}
            onChange={setPicked}
          />
        </div>
      )}
    </div>
  );

  const tabs: { id: Tab; label: string; sub: string }[] =
    day === 1
      ? [{ id: "card", label: "כרטיס הביקור", sub: "כלי 1" }]
      : [
          { id: "card", label: "כרטיס הביקור", sub: "כלי 1 · אתמול" },
          { id: "invite", label: "הפתק האישי", sub: "כלי 2 · היום" },
          { id: "pair", label: "אותו אדם, שני קולות", sub: "שניהם יחד" },
        ];

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-20 font-body text-foreground">
      <SEOHead title="כלי האתגר (אב-טיפוס)" description="תצוגה פנימית" canonicalUrl="https://therapykeys.co.il/" noindex />

      <div className="sticky top-0 z-20 bg-[#1e1a18] px-4 py-2.5 text-xs text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold">אב-טיפוס · נתוני דמה · הניסוח קבוע, וההורדות אמיתיות</span>
          <span className="flex items-center gap-1.5">
            <span className="opacity-70">השם ברישום:</span>
            {REG_NAMES.map((r) => (
              <button
                key={r.key}
                onClick={() => switchReg(r.key)}
                className={`rounded-full px-3 py-1 ${regKey === r.key ? "bg-white text-[#1e1a18]" : "bg-white/10 hover:bg-white/20"}`}
              >
                {r.name}
              </button>
            ))}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="opacity-70">היום באתגר:</span>
            {([1, 2] as const).map((d) => (
              <button
                key={d}
                onClick={() => switchDay(d)}
                className={`rounded-full px-3 py-1 ${day === d ? "bg-white text-[#1e1a18]" : "bg-white/10 hover:bg-white/20"}`}
              >
                יום {d}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        {tabs.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-mentor-border pb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2.5 text-start transition-colors ${
                tab === t.id ? "bg-primary text-primary-foreground" : "border border-mentor-border bg-card hover:bg-mentor-surface"
              }`}
            >
              <span className="block text-[11px] opacity-70">{t.sub}</span>
              <span className="block text-sm font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
        )}

        {/* ------------------------------------------------------------------ tool 1 */}
        {tab === "card" && !done1 && (
          <Guided
            key="g1"
            eyebrow="כלי 1 · כרטיס הביקור המקצועי"
            title="המומחה שהמטופל שלי צריך"
            intro="שלוש שאלות על אדם אחד: מי הוא, מה מטריד אותו ומה הוא מקווה שישתנה. מהן נבנה משפט אחד במבנה של כרטיס ביקור: למי אתם עוזרים, ומה משתנה אצלו. בדרך תגדירו גם מי המטופל שאליו אתם רוצים לפנות, כלומר את הנישה שלכם."
            questions={q1}
            reactions={REACT1}
            answers={ans1}
            setAnswers={setAns1}
            canStart={!!picked && !!cg}
            gate={
              <div className="space-y-4">
                {genderGate}
                {clientGate}
              </div>
            }
            writingText="כותבת את הגרסאות…"
            finishLabel="לכתוב את הגרסאות"
            onFinish={() => setDone1(true)}
          />
        )}

        {tab === "card" && done1 && (
          <div className="grid gap-8 py-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-6">
              <div>
                <p className="section-eyebrow">התוצר הראשון</p>
                <h2 className="mt-1 text-3xl text-primary" style={{ fontFamily: SERIF }}>
                  כרטיס הביקור שלך
                </h2>
              </div>
              <NeriLine>כתבתי שלוש גרסאות לכרטיס, כל אחת מזווית אחרת. בחרו את זו שהכי נשמעת כמו שאתם מדברים, ואפשר גם לערוך אותה.</NeriLine>

              <div className="rounded-xl border border-mentor-border bg-card p-4 text-sm leading-relaxed">
                <p className="text-xs font-semibold text-primary">מי האדם שהגדרתם, והנישה שעולה ממנו</p>
                <p className="mt-2">
                  <span className="text-muted-foreground">האדם: </span>
                  {y1[0]}
                </p>
                <p className="mt-1.5">
                  <span className="text-muted-foreground">הנישה: </span>
                  {NICHE_LINE}
                </p>
              </div>

              <div className="space-y-2.5">
                {VARIANTS.map((vr, k) => {
                  const on = variant === k && !sentenceEdit;
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setVariant(k);
                        setSentenceEdit(null);
                        setEditingSentence(false);
                      }}
                      className={`block w-full rounded-xl border p-4 text-start transition-colors ${
                        on ? "border-primary bg-card shadow-sm" : "border-mentor-border bg-card/60 hover:bg-card"
                      }`}
                    >
                      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
                        {vr.tag}
                        {on && <Check className="h-4 w-4 text-primary" />}
                      </span>
                      <span className="mt-1 block leading-relaxed" style={{ fontFamily: SERIF, fontSize: 17 }}>
                        {forms(g).lead} {vr.who} {vr.change}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div>
                {editingSentence ? (
                  <div className="space-y-2">
                    <textarea
                      value={sentenceEdit ?? `${f.lead} ${v.who} ${v.change}`}
                      onChange={(e) => setSentenceEdit(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-mentor-border bg-card p-3 text-base leading-relaxed"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditingSentence(false)} className="rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground">
                        שמירה
                      </button>
                      <button
                        onClick={() => {
                          setSentenceEdit(null);
                          setEditingSentence(false);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-mentor-border px-3 py-1.5 text-sm"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        חזרה למקור
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSentenceEdit(sentenceEdit ?? `${f.lead} ${v.who} ${v.change}`);
                      setEditingSentence(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {sentenceEdit ? "עריכת הנוסח שלי" : "עריכת הנוסח"}
                  </button>
                )}
                {sentenceEdit && !editingSentence && <span className="ms-3 rounded-full bg-mentor-surface px-2.5 py-0.5 text-[11px] text-muted-foreground">הנוסח נערך</span>}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl bg-[#f3ece1] p-5 sm:p-8">
                <ScaledBox baseWidth={640} baseHeight={356}>
                  <BusinessCard data={cardData} width={640} />
                </ScaledBox>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-muted-foreground">צבע:</span>
                {(Object.keys(THEME_LABELS) as CardTheme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${theme === t ? "border-primary bg-card" : "border-mentor-border hover:bg-card"}`}
                  >
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: THEME_SWATCH[t] }} />
                    {THEME_LABELS[t]}
                  </button>
                ))}
              </div>

              <DownloadButtons
                pngLabel="הורדת הכרטיס כתמונה"
                onPdf={() => downloadPdf(<CardPdfDocument data={cardData} />, PAGE_W, "business-card.pdf")}
                onPng={() => downloadPng(<BusinessCard data={cardData} width={640} />, 640, "business-card.png", 3)}
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-primary">מה יש בקובץ ה-PDF</p>
                <div className="grid grid-cols-2 gap-3">
                  {[<CardPresentationPage key="p1" data={cardData} />, <CardSheetPage key="p2" data={cardData} />].map((p, k) => (
                    <div key={k} className="overflow-hidden rounded-lg border border-mentor-border bg-white shadow-sm">
                      <ScaledBox baseWidth={PAGE_W} baseHeight={PAGE_H}>
                        {p}
                      </ScaledBox>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">עמוד 1: הכרטיס ואיפה משתמשים בו. עמוד 2: גיליון של 10 כרטיסים להדפסה, בגודל אמיתי.</p>
              </div>

              {day === 2 ? (
                <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-4">
                  <p className="text-sm font-semibold">היום: אותו אדם, הפעם בקולו</p>
                  <p className="mt-1 text-sm text-muted-foreground">הכרטיס מתאר אותו בשפה שלך. הפתק ייכתב בשפה שלו.</p>
                  <button onClick={() => setTab("invite")} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                    לפתק האישי <ArrowLeft className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-4">
                  <p className="text-sm font-semibold">מחר: הפתק האישי</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    מחר תקבלו קישור לכלי השני. הוא ייבנה על מה שכתבתם היום: אותו אדם, הפעם בשפה שלו.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ tool 2 */}
        {tab === "invite" && !done2 && (
          <Guided
            key="g2"
            eyebrow="כלי 2 · הפתק האישי"
            title="המומחה שהמטופל שלי רוצה"
            intro="אתמול הגדרתם אדם אחד, והיום נכתוב אותו בקולו. שלוש שאלות: איך הוא מתאר את הקושי, איך ייראה השינוי, ואילו מילים בכרטיס שלכם הוא לא היה אומר. בסוף תקבלו פתק קצר שנקרא כאילו קראתם את היומן שלו."
            questions={q2}
            reactions={REACT2}
            answers={ans2}
            setAnswers={setAns2}
            canStart={!!picked}
            gate={
              <div className="space-y-4">
                {yesterday}
                {!picked && genderGate}
              </div>
            }
            writingText="כותבת את הפתק…"
            finishLabel="לכתוב את הפתק"
            onFinish={() => setDone2(true)}
          />
        )}

        {tab === "invite" && done2 && (
          <div className="grid gap-8 py-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="mx-auto w-full max-w-md">
              <div className="overflow-hidden rounded-lg border border-mentor-border bg-white shadow-md">
                <ScaledBox baseWidth={PAGE_W} baseHeight={PAGE_H}>
                  <InvitationPage data={invData} />
                </ScaledBox>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="section-eyebrow">התוצר השני</p>
                <h2 className="mt-1 text-3xl text-primary" style={{ fontFamily: SERIF }}>
                  הפתק האישי שלך
                </h2>
              </div>
              <NeriLine>
                כתבתי את הפתק בשפה שלו, כמו מי שקרא את היומן שלו: בלי הסברים ובלי “זה נורמלי”, רק מה שהוא מרגיש, במילים שלו. בסוף הזמנה קצרה. אפשר לערוך הכול.
              </NeriLine>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-primary">נוסח הפתק</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setLetterEdit(e.target.value)}
                  rows={11}
                  className="w-full resize-none rounded-xl border border-mentor-border bg-card p-3 text-base leading-relaxed"
                  style={{ fontFamily: SERIF }}
                />
                <p className="text-xs text-muted-foreground">הפסקה הראשונה היא הכותרת הגדולה של הפתק. פסקאות מופרדות בשורה ריקה.</p>
                {letterEdit !== null && (
                  <button onClick={() => setLetterEdit(null)} className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline">
                    <RotateCcw className="h-3.5 w-3.5" />
                    חזרה לנוסח המקורי
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-mentor-border bg-card p-4">
                <p className="text-sm font-semibold text-primary">המילים שלו שנכנסו לפתק</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {HIS_WORDS[cg ?? "f"].map((w) => {
                    const kept = noteText.includes(w);
                    return (
                      <li key={w} className={`flex items-center gap-2 ${kept ? "" : "text-muted-foreground line-through"}`}>
                        <Check className={`h-4 w-4 shrink-0 ${kept ? "text-primary" : "opacity-30"}`} />
                        <span style={{ fontFamily: SERIF }}>{w}</span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-xs text-muted-foreground">
                  הקוד בודק שמילים מהתשובות שלו מופיעות בפתק כלשונן. אם מחקתם אחת מהן, היא תסומן כאן.
                </p>
              </div>

              {effMarked.length > 0 && (
                <div className="rounded-xl border border-mentor-border bg-card p-4">
                  <p className="text-sm font-semibold text-primary">מילים שסימנתם בכרטיס</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {effMarked.map((w) => {
                      const gone = !noteText.includes(w);
                      return (
                        <li key={w} className={`flex items-center gap-2 ${gone ? "" : "text-destructive"}`}>
                          <Check className={`h-4 w-4 shrink-0 ${gone ? "text-primary" : "opacity-30"}`} />
                          <span>
                            <span style={{ fontFamily: SERIF }}>“{w}”</span> {gone ? "לא מופיעה בפתק" : "חזרה לפתק, כדאי להחליף"}
                            {REPLACE[w] && gone ? <span className="text-muted-foreground"> · במקומה: “{REPLACE[w]}”</span> : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <DownloadButtons
                pngLabel="הורדה כתמונה לשיתוף"
                onPdf={() => downloadPdf(<InvitationPage data={invData} />, PAGE_W, "personal-note.pdf")}
                onPng={() => downloadPng(<InvitationShare data={invData} size={540} />, 540, "personal-note.png", 2)}
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-primary">התמונה לשיתוף (פוסט, סטורי, קבוצה)</p>
                <div className="w-48 overflow-hidden rounded-lg border border-mentor-border shadow-sm">
                  <ScaledBox baseWidth={540} baseHeight={540}>
                    <InvitationShare data={invData} size={540} />
                  </ScaledBox>
                </div>
              </div>

              <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-4">
                <p className="text-sm font-semibold">עכשיו אפשר לראות את שני הקולות ביחד</p>
                <button onClick={() => setTab("pair")} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">
                  אותו אדם, שני קולות <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ both */}
        {tab === "pair" && (
          <div className="py-8">
            {!(done1 && done2) && (
              <div className="mb-6 rounded-xl border border-dashed border-mentor-border bg-card/60 p-4 text-sm text-muted-foreground">
                כך זה ייראה אחרי ששני הכלים מולאו. בתצוגה הזו הוצגו נתוני הדוגמה.
              </div>
            )}
            <p className="section-eyebrow">שני הכלים ביחד</p>
            <h2 className="mt-1 text-3xl text-primary" style={{ fontFamily: SERIF }}>
              אותו אדם, שני קולות
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-mentor-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold text-primary">בשפה שלך</p>
                <div className="rounded-xl bg-[#f3ece1] p-4">
                  <ScaledBox baseWidth={640} baseHeight={356}>
                    <BusinessCard data={cardData} width={640} />
                  </ScaledBox>
                </div>
              </div>
              <div className="rounded-2xl border border-mentor-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold text-primary">בשפה שלו</p>
                <div className="rounded-xl bg-[#4b0b24] p-6 text-[#faf7f2]">
                  <p className="text-xl leading-relaxed" style={{ fontFamily: SERIF }}>
                    “{diary}”
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-mentor-accent/40 bg-mentor-accent/5 p-5">
              <NeriLine>
                שימו לב לפער בין שתי השפות: הכרטיס מדבר על קהל, והפתק מדבר בקולו של אדם אחד. ככל שהמשפט שלך קרוב לשפה שלו, כך קל לו לזהות את עצמו ולפנות אליך.
              </NeriLine>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ the rest of the Mentor */}
        {showMore && (
        <section className="mt-12 border-t border-mentor-border pt-10">
          <p className="section-eyebrow">במנטור</p>
          <h2 className="mt-1 text-2xl text-primary" style={{ fontFamily: SERIF }}>
            ועוד שישה כלים שמייצרים תוצרים כאלה
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            שני הכלים האלה הם חלק קטן ממה שהמנטור עושה. לכל כלי נוסף יש תוצר מוכן לשימוש, והצעד הבא אחרי הכרטיס הוא למצוא למי לשלוח אותו.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOCKED.map(({ Icon, name, gives, next }) => (
              <div key={name} className={`relative rounded-xl border p-4 ${next ? "border-mentor-accent bg-mentor-accent/5" : "border-mentor-border bg-card/70"}`}>
                {next && <span className="absolute -top-2.5 start-4 rounded-full bg-mentor-accent px-2.5 py-0.5 text-[11px] text-white">הצעד הבא אחרי הכרטיס</span>}
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mentor-surface text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center justify-between font-semibold" style={{ fontFamily: SERIF }}>
                      {name}
                      <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">תוצר: {gives}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link to="/mentor" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">
            לפרטים על המנטור <ArrowLeft className="h-4 w-4" />
          </Link>
        </section>
        )}
      </div>
    </div>
  );
};

export default ChallengeToolsPreview;
