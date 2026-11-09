import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  FileText,
  ListChecks,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  Send,
  Users,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

/*
 * Design aid: a clickable prototype of the "workroom" Mentor (conversation in the middle, a wide work desk
 * beside it with deliverables, dated tasks and a report-back loop). Sample data only: nothing is read or
 * saved, and it is not linked from anywhere. Real tasks would live in an owner-only table.
 */

type Kind = "whatsapp" | "email" | "phone" | "meeting" | "other";
type Outcome = "replied" | "no_reply" | "meeting_set" | "stuck";
type Status = "pending" | "done";
type DeskTab = "tasks" | "deliverables" | "notes";

interface Task {
  id: string;
  kind: Kind;
  title: string;
  name: string; // free text, stays on the screen only
  role: string; // the only thing the model would see
  message: string;
  due: Date;
  status: Status;
  outcome?: Outcome;
  note?: string;
}

interface MsgRef {
  kind: "task" | "focus";
  taskId?: string;
  title: string;
  meta?: string;
}

interface Msg {
  id: string;
  from: "eliana" | "me";
  text: string;
  divider?: string; // a day / stage marker instead of a message
  ref?: MsgRef; // a card that points at a task or deliverable the message talks about
  action?: { label: string; onClick: () => void };
}

const SERIF = "'Frank Ruhl Libre', 'Miriam Libre', serif";

const KIND_META: Record<Kind, { label: string; Icon: typeof Phone }> = {
  whatsapp: { label: "הודעת וואטסאפ", Icon: MessageCircle },
  email: { label: "מייל", Icon: Mail },
  phone: { label: "שיחת טלפון", Icon: Phone },
  meeting: { label: "פגישה", Icon: Users },
  other: { label: "משימה", Icon: ListChecks },
};

const OUTCOME_LABEL: Record<Outcome, string> = {
  replied: "ענו לי",
  no_reply: "עוד לא ענו",
  meeting_set: "נקבעה פגישה",
  stuck: "נתקעתי",
};

const STAGES = [
  { label: "נישה", state: "done" },
  { label: "תמחור", state: "done" },
  { label: "הצגה עצמית", state: "done" },
  { label: "רשת הפניות", state: "current" },
  { label: "גישור קשר", state: "todo" },
  { label: "שיחה ראשונה", state: "todo" },
] as const;

const SOURCES = [
  {
    type: "פסיכיאטר בסביבה",
    why: "הוא פוגש אחרי לידה אנשים שצריכים המשך טיפול רגשי, ואין לו למי להפנות את הקשר הזוגי.",
    message:
      "שלום ד״ר רונן, אני נועה, פסיכולוגית קלינית. אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר. אשמח להכיר ולהבין מתי הפנייה אליי תהיה נכונה עבורך. אפשר חמש דקות בטלפון השבוע?",
    followup: "אם אין תגובה, הודעה קצרה נוספת אחרי שלושה ימים.",
  },
  {
    type: "מנחה בקורס הכנה ללידה",
    why: "היא פוגשת זוגות לפני הלידה ויודעת מי ירצה תמיכה אחריה.",
    message:
      "היי מיכל, אני נועה, פסיכולוגית קלינית שעובדת עם זוגות אחרי לידה. אשמח להציג את עצמי בחמש דקות בסוף אחד המפגשים בקורס, או לשלוח לך דף קצר להעברה.",
    followup: "טלפון קצר אחרי שבוע אם לא נקבע מועד.",
  },
  {
    type: "יועצת הנקה",
    why: "הלחץ הראשון שמורגש בבית הוא אצלה, והיא רואה את הזוג מוקדם.",
    message:
      "שלום יעל, אני נועה. אני מטפלת בזוגות בתקופה שאחרי הלידה, ואני חושבת שיש בינינו הרבה נקודות מפגש. אשמח לקבוע שיחה קצרה ולהכיר.",
    followup: "הודעת תודה אחרי השיחה, עם הצעה למפגש היכרות.",
  },
  {
    type: "פיזיותרפיסטית של רצפת האגן",
    why: "הזוגות שמגיעים אליה מדברים גם על קרבה, ולא תמיד יש לה לאן להפנות.",
    message:
      "שלום, אני נועה, פסיכולוגית קלינית שמתמחה בזוגיות אחרי לידה. נשמח להכיר ולבדוק אם יש בינינו התאמה לשיתוף פעולה.",
    followup: "מעקב בטלפון אחרי שבוע.",
  },
];

const at = (daysFromNow: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Sample data should read sensibly at any hour: the next half hour two hours ahead, or tomorrow morning if that is past midnight.
const soonToday = () => {
  const d = new Date(Date.now() + 2 * 3600 * 1000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return sameDay(d, new Date()) ? d : at(1, 9);
};

const pad = (n: number) => String(n).padStart(2, "0");
const dateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromInputs = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, mi, 0, 0);
};

const whenLabel = (d: Date) => {
  const day = sameDay(d, new Date())
    ? "היום"
    : sameDay(d, at(1, 0))
      ? "מחר"
      : d.toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "numeric" });
  return `${day}, ${timeInput(d)}`;
};

// Calendar file: no infrastructure needed, works with any calendar app.
const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsStamp = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
function downloadIcs(t: Task) {
  const end = new Date(t.due.getTime() + 30 * 60 * 1000);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TherapyKeys//Mentor//HE",
    "BEGIN:VEVENT",
    `UID:${t.id}@therapykeys.co.il`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(t.due)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(t.title)}`,
    `DESCRIPTION:${icsEscape(t.message)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "משימה-מהמנטור.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// The code decides what comes next; the model would only phrase it. Here the phrasing is fixed text.
function followUpFor(t: Task, outcome: Outcome): { chat: string; suggestion: Omit<Task, "id" | "status"> | null } {
  if (outcome === "stuck") {
    return {
      chat: `שמעתי שנתקעת עם ה${t.role}. זה קורה הרבה בפנייה הראשונה. ספרי לי מה עצר אותך, ונמצא ניסוח או צעד קטן יותר.`,
      suggestion: null,
    };
  }
  if (outcome === "no_reply") {
    return {
      chat: `עוד לא ענו, וזה בסדר גמור. רוב העמיתים עונים רק אחרי תזכורת. הכנתי לך הודעת מעקב קצרה ל${t.role}.`,
      suggestion: {
        kind: "whatsapp",
        title: `מעקב ל${t.role}`,
        name: t.name,
        role: t.role,
        message: "היי, חזרתי אלייך בקצרה לגבי ההודעה שלי מהשבוע. אשמח לשמוע מתי נוח לך לדבר.",
        due: at(3, 10),
      },
    };
  }
  if (outcome === "meeting_set") {
    return {
      chat: `מצוין, נקבעה פגישה עם ה${t.role}. נשאר להגיע אליה מוכנה: בואי נכין שאלה אחת ומשפט אחד על מה שאת עושה.`,
      suggestion: {
        kind: "other",
        title: `להכין פגישה עם ה${t.role}`,
        name: t.name,
        role: t.role,
        message: "משפט המיקוד שלי, ושאלה אחת: מה הכי קשה לך למצוא כשאת מפנה זוגות אחרי לידה?",
        due: at(1, 20),
      },
    };
  }
  return {
    chat: `יופי, ה${t.role} ענה. עכשיו הכי חשוב לא לתת לזה להתקרר. הצעתי משימה קצרה לתאם פגישת היכרות.`,
    suggestion: {
      kind: "phone",
      title: `לתאם פגישת היכרות עם ה${t.role}`,
      name: t.name,
      role: t.role,
      message: "תודה שענית. אשמח לקבוע שיחת היכרות של עשרים דקות, מתי נוח לך?",
      due: at(2, 11),
    },
  };
}

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    kind: "whatsapp",
    title: "לשלוח הודעת היכרות לפסיכיאטר",
    name: "ד״ר רונן",
    role: "פסיכיאטר",
    message: SOURCES[0].message,
    due: soonToday(),
    status: "pending",
  },
  {
    id: "t2",
    kind: "email",
    title: "לשלוח מייל למנחה בקורס ההכנה ללידה",
    name: "מיכל",
    role: "מנחה בקורס הכנה ללידה",
    message: SOURCES[1].message,
    due: at(1, 10),
    status: "pending",
  },
  {
    id: "t3",
    kind: "phone",
    title: "להתקשר ליועצת ההנקה",
    name: "יעל",
    role: "יועצת הנקה",
    message: SOURCES[2].message,
    due: at(3, 9),
    status: "pending",
  },
];

const FOCUS_SENTENCE = "אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר, ולמצוא שוב זמן זה לזה.";

const INITIAL_MSGS: Msg[] = [
  { id: "d1", from: "eliana", text: "", divider: "אתמול · מציאת נישה" },
  {
    id: "m0",
    from: "eliana",
    text: "ניסחנו יחד את משפט המיקוד שלך, ובדקנו אותו מול עמית דמיוני. זה מה שיצא:",
    ref: { kind: "focus", title: FOCUS_SENTENCE, meta: "משפט המיקוד · בתוצרים" },
  },
  { id: "d2", from: "eliana", text: "", divider: "היום · רשת הפניות" },
  {
    id: "m1",
    from: "eliana",
    text: "עכשיו מוציאים את המשפט לעולם. בחרנו יחד ארבעה עמיתים לפנייה הראשונה, ושלוש הפניות הראשונות כבר מחכות לך בשולחן העבודה, עם נוסח ומועד.",
  },
  { id: "m2", from: "me", text: "אני קצת מתלבטת אם לפתוח עם טלפון או עם הודעה." },
  {
    id: "m3",
    from: "eliana",
    text: "שאלה טובה. עם עמית שעוד לא מכיר אותך, הודעה קצרה קודמת לשיחה. הטלפון מגיע אחרי שהוא ענה, ואז יש לו כבר הקשר. בגלל זה בחרתי בהודעה לפסיכיאטר, והיא אמורה לצאת היום.",
    ref: { kind: "task", taskId: "t1", title: "לשלוח הודעת היכרות לפסיכיאטר" },
  },
];

const NOTES_SEED = "• הפנייה לפסיכיאטר: להדגיש שאני לא מבקשת שום דבר, רק מציגה את מה שאני עושה.\n• לזכור: כל פנייה נגמרת בשאלה פתוחה אחת.";

export default function MentorWorkroomPreview() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL_MSGS);
  const [draft, setDraft] = useState("");
  const [deskTab, setDeskTab] = useState<DeskTab>("tasks");
  const [mobilePane, setMobilePane] = useState<"chat" | "desk">("chat");
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportOutcome, setReportOutcome] = useState<Outcome | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Omit<Task, "id" | "status"> | null>(null);
  const [sugDate, setSugDate] = useState("");
  const [sugTime, setSugTime] = useState("");
  const [creating, setCreating] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(dateInput(at(1, 10)));
  const [newTime, setNewTime] = useState("10:00");
  const [created, setCreated] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [notes, setNotes] = useState(NOTES_SEED);
  const [copied, setCopied] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Preview-only font; the real page would load it once for the whole Mentor.
    const id = "workroom-fonts";
    if (!document.getElementById(id)) {
      const l = document.createElement("link");
      l.id = id;
      l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&display=swap";
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs]);

  const pending = useMemo(
    () => tasks.filter((t) => t.status === "pending").sort((a, b) => a.due.getTime() - b.due.getTime()),
    [tasks],
  );
  const done = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);
  const next = pending[0];
  const now = new Date();

  const say = (from: "eliana" | "me", text: string, action?: Msg["action"]) =>
    setMsgs((m) => [...m, { id: `m${m.length + 1}-${Date.now()}`, from, text, action }]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    say("me", text);
    window.setTimeout(
      () =>
        say(
          "eliana",
          "(בגרסה האמיתית כאן אליענה עונה לפי כל מה שהיא יודעת עלייך. בתצוגה הזו התשובה קבועה.)",
        ),
      600,
    );
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard may be blocked in a preview */
    }
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1500);
  };

  // A quiet quote inside a message that points at the task or deliverable it talks about.
  const renderRef = (r: MsgRef) => {
    if (r.kind === "focus") {
      return (
        <button
          onClick={() => openDesk("deliverables")}
          className="mt-3 block w-full border-s-2 border-mentor-accent/60 ps-3 text-start hover:opacity-75"
        >
          <span className="block text-[11px] text-muted-foreground">{r.meta}</span>
          <span className="block text-base leading-snug text-primary" style={{ fontFamily: SERIF }}>
            {r.title}
          </span>
        </button>
      );
    }
    const t = tasks.find((x) => x.id === r.taskId);
    const I = t ? KIND_META[t.kind].Icon : ListChecks;
    return (
      <button
        onClick={() => {
          if (t) setOpenMessage(t.id);
          openDesk("tasks");
        }}
        className="mt-3 flex w-full items-center gap-2.5 border-s-2 border-mentor-accent/60 ps-3 text-start hover:opacity-75"
      >
        <I className="h-4 w-4 shrink-0 text-mentor-accent" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-muted-foreground">
            משימה · {t ? (t.status === "done" ? "בוצעה" : whenLabel(t.due)) : ""}
          </span>
          <span className="block truncate text-sm font-medium" style={{ fontFamily: SERIF }}>
            {r.title}
          </span>
        </span>
      </button>
    );
  };

  const submitReport = (t: Task) => {
    if (!reportOutcome) return;
    setTasks((all) =>
      all.map((x) => (x.id === t.id ? { ...x, status: "done", outcome: reportOutcome, note: reportNote.trim() } : x)),
    );
    const fu = followUpFor(t, reportOutcome);
    say("eliana", fu.chat);
    if (fu.suggestion) {
      setSuggestion(fu.suggestion);
      setSugDate(dateInput(fu.suggestion.due));
      setSugTime(timeInput(fu.suggestion.due));
      setDeskTab("tasks");
    }
    setReporting(null);
    setReportOutcome(null);
    setReportNote("");
  };

  const addTask = (base: Omit<Task, "id" | "status">) =>
    setTasks((all) => [...all, { ...base, id: `t${all.length + 1}-${Date.now()}`, status: "pending" }]);

  const acceptSuggestion = () => {
    if (!suggestion) return;
    addTask({ ...suggestion, due: fromInputs(sugDate, sugTime) });
    say("eliana", "נכנס לרשימה. אני אשאל אותך עליו ביום שקבעת.");
    setSuggestion(null);
  };

  const createFromSource = (idx: number) => {
    const s = SOURCES[idx];
    addTask({
      kind: "whatsapp",
      title: `לפנות אל ${s.type}`,
      name: "",
      role: s.type,
      message: s.message,
      due: fromInputs(newDate, newTime),
    });
    setCreated((c) => ({ ...c, [idx]: true }));
    setCreating(null);
    setDeskTab("tasks");
  };

  const openDesk = (tab: DeskTab) => {
    setDeskTab(tab);
    setMobilePane("desk");
  };

  const renderTask = (t: Task) => {
    const { Icon, label } = KIND_META[t.kind];
    const overdue = t.status === "pending" && t.due < now;
    const isToday = sameDay(t.due, now);
    const expanded = openMessage === t.id;
    const isReporting = reporting === t.id;
    return (
      <li key={t.id} className="rounded-xl border border-mentor-border/70 bg-card p-3.5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mentor-surface text-primary">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-foreground">{t.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {label}
              {t.name ? ` · ${t.name}` : ""} · {t.role}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                  overdue
                    ? "bg-destructive/10 text-destructive"
                    : isToday
                      ? "bg-mentor-accent/15 text-mentor-accent"
                      : "bg-mentor-surface text-muted-foreground"
                }`}
              >
                <Clock className="h-3 w-3" />
                {overdue ? "באיחור · " : ""}
                {whenLabel(t.due)}
              </span>
              {t.status === "done" && t.outcome && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Check className="h-3 w-3" />
                  {OUTCOME_LABEL[t.outcome]}
                </span>
              )}
            </div>
            {t.status === "done" && t.note && <p className="mt-2 text-xs italic text-muted-foreground">״{t.note}״</p>}
          </div>
        </div>

        <button
          onClick={() => setOpenMessage(expanded ? null : t.id)}
          className="mt-2.5 flex items-center gap-1 text-xs font-medium text-primary"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "הסתר את הנוסח" : "הנוסח המוכן"}
        </button>
        {expanded && (
          <div className="mt-2 rounded-lg bg-mentor-bg p-3">
            <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: SERIF }}>
              {t.message}
            </p>
            <button
              onClick={() => copy(`t-${t.id}`, t.message)}
              className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied === `t-${t.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === `t-${t.id}` ? "הועתק" : "העתקה"}
            </button>
          </div>
        )}

        {t.status === "pending" && !isReporting && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setReporting(t.id);
                setReportOutcome(null);
                setReportNote("");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              <Check className="h-3.5 w-3.5" />
              ביצעתי
            </button>
            <button
              onClick={() => downloadIcs(t)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-mentor-border px-3 py-1.5 text-xs text-foreground hover:bg-mentor-surface"
            >
              <Calendar className="h-3.5 w-3.5" />
              הוספה ליומן
            </button>
          </div>
        )}

        {isReporting && (
          <div className="mt-3 rounded-lg border border-mentor-accent/40 bg-mentor-accent/5 p-3">
            <p className="text-sm font-medium text-foreground">איך זה הלך?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setReportOutcome(o)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    reportOutcome === o
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-mentor-border bg-card text-foreground hover:bg-mentor-surface"
                  }`}
                >
                  {OUTCOME_LABEL[o]}
                </button>
              ))}
            </div>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              rows={2}
              placeholder="שורה אחת על מה קרה (לא חובה)"
              className="mt-2 w-full resize-none rounded-lg border border-mentor-border bg-card p-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button
                disabled={!reportOutcome}
                onClick={() => submitReport(t)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
              >
                שמירה והצעד הבא
              </button>
              <button onClick={() => setReporting(null)} className="px-2 text-xs text-muted-foreground">
                ביטול
              </button>
            </div>
          </div>
        )}
      </li>
    );
  };

  const today = pending.filter((t) => t.due < now || sameDay(t.due, now));
  const later = pending.filter((t) => !(t.due < now || sameDay(t.due, now)));

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-20 text-foreground lg:pb-8">
      <SEOHead title="חדר עבודה (אב-טיפוס)" description="תצוגה פנימית" canonicalUrl="https://therapykeys.co.il/" noindex />

      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-1 bg-neutral-900 px-4 py-2 text-xs text-white">
        <span className="font-semibold">אב-טיפוס · חדר עבודה</span>
        <span className="opacity-70">נתוני דוגמה: שום דבר לא נשמר, והתשובות של אליענה קבועות. השם של הנמען מופיע רק במסך, ובשיחה אליענה מכירה רק את התפקיד.</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start">
          {/* Conversation: the heart of the room */}
          <section
            className={`${mobilePane === "chat" ? "flex" : "hidden"} min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-mentor-border/70 bg-card shadow-md lg:flex lg:h-[40rem]`}
          >
            {/* Where we are, in one band: who, which stage of six, the goal, and how far */}
            <header className="bg-primary px-5 pb-4 pt-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <img src="/images/eliana-avatar.png" alt="" className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight" style={{ fontFamily: SERIF }}>
                    אליענה
                  </p>
                  <p className="text-xs opacity-80">שלב 4 מתוך 6 · רשת הפניות</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1" role="img" aria-label="שלב 4 מתוך 6">
                {STAGES.map((st) => (
                  <span
                    key={st.label}
                    title={st.label}
                    className={`h-1.5 flex-1 rounded-full ${
                      st.state === "done"
                        ? "bg-primary-foreground"
                        : st.state === "current"
                          ? "bg-mentor-accent"
                          : "bg-primary-foreground/25"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2.5 text-[13px] leading-snug opacity-90">
                המטרה: שלוש פניות ראשונות לעמיתים · {done.length} מתוך {done.length + pending.length} בוצעו
              </p>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {msgs.map((m) =>
                m.divider ? (
                  <div key={m.id} className="flex items-center gap-3 text-[11px] text-muted-foreground/80">
                    <span className="h-px flex-1 bg-mentor-border/50" />
                    {m.divider}
                    <span className="h-px flex-1 bg-mentor-border/50" />
                  </div>
                ) : m.from === "eliana" ? (
                  <div key={m.id} className="max-w-[92%]">
                    <p className="text-[15px] leading-[1.85] text-foreground" style={{ fontFamily: SERIF }}>
                      {m.text}
                    </p>
                    {m.ref && renderRef(m.ref)}
                    {m.action && (
                      <button onClick={m.action.onClick} className="mt-1.5 text-xs font-medium text-primary underline">
                        {m.action.label}
                      </button>
                    )}
                  </div>
                ) : (
                  <div key={m.id} className="ms-auto max-w-[85%] rounded-2xl rounded-ss-sm bg-mentor-surface px-4 py-2.5 text-sm leading-relaxed">
                    {m.text}
                  </div>
                ),
              )}
              <div ref={chatEnd} />
            </div>

            <div className="border-t border-mentor-border/60 bg-mentor-bg/60 p-3">
              {next ? (
                <button
                  onClick={() => {
                    setOpenMessage(next.id);
                    openDesk("tasks");
                  }}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg bg-mentor-accent/10 px-3 py-2 text-start text-[13px] hover:bg-mentor-accent/15"
                >
                  {(() => {
                    const I = KIND_META[next.kind].Icon;
                    return <I className="h-4 w-4 shrink-0 text-mentor-accent" />;
                  })()}
                  <span className="shrink-0 text-muted-foreground">הצעד הבא:</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {next.title} · {whenLabel(next.due)}
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <p className="mb-2 px-1 text-xs text-muted-foreground">אין משימות פתוחות. בואי נחליט עם אליענה מה הצעד הבא.</p>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={2}
                  placeholder="מה עובר עלייך עם הפנייה הראשונה?"
                  className="flex-1 resize-none rounded-xl border border-mentor-border bg-card p-3 text-sm"
                />
                <button
                  onClick={send}
                  aria-label="שליחה"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                >
                  <Send className="h-4 w-4 -scale-x-100" />
                </button>
              </div>
            </div>
          </section>

          {/* The work desk */}
          <aside className={`${mobilePane === "desk" ? "block" : "hidden"} lg:block`}>
            <div className="overflow-hidden rounded-3xl border border-mentor-border/70 bg-card shadow-md">
              <div className="flex border-b border-mentor-border/60 bg-mentor-surface">
                {(
                  [
                    ["tasks", "משימות", ListChecks, pending.length],
                    ["deliverables", "תוצרים", FileText, 0],
                    ["notes", "פנקס", NotebookPen, 0],
                  ] as const
                ).map(([key, label, I, count]) => (
                  <button
                    key={key}
                    onClick={() => setDeskTab(key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm ${
                      deskTab === key
                        ? "border-b-2 border-primary bg-card font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <I className="h-4 w-4" />
                    {label}
                    {count > 0 && (
                      <span className="rounded-full bg-mentor-accent px-1.5 text-[11px] text-mentor-accent-foreground">{count}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="max-h-[36rem] overflow-y-auto p-4">
                {deskTab === "tasks" && (
                  <div className="space-y-5">
                    {suggestion && (
                      <div className="rounded-xl border-2 border-dashed border-mentor-accent/60 bg-mentor-accent/5 p-3.5">
                        <p className="text-xs font-semibold text-mentor-accent">הצעה מאליענה</p>
                        <p className="mt-1 text-sm font-semibold" style={{ fontFamily: SERIF }}>
                          {suggestion.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{suggestion.message}</p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={sugDate}
                            onChange={(e) => setSugDate(e.target.value)}
                            className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
                          />
                          <input
                            type="time"
                            value={sugTime}
                            onChange={(e) => setSugTime(e.target.value)}
                            className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
                          />
                        </div>
                        <div className="mt-2.5 flex gap-2">
                          <button onClick={acceptSuggestion} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                            להוסיף למשימות
                          </button>
                          <button onClick={() => setSuggestion(null)} className="px-2 text-xs text-muted-foreground">
                            לא עכשיו
                          </button>
                        </div>
                      </div>
                    )}

                    {today.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">להיום</h3>
                        <ul className="space-y-2.5">{today.map(renderTask)}</ul>
                      </div>
                    )}
                    {later.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">בהמשך</h3>
                        <ul className="space-y-2.5">{later.map(renderTask)}</ul>
                      </div>
                    )}
                    {pending.length === 0 && !suggestion && (
                      <p className="py-6 text-center text-sm text-muted-foreground">הכול בוצע. יפה.</p>
                    )}
                    {done.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">בוצעו ({done.length})</h3>
                        <ul className="space-y-2.5 opacity-80">{done.map(renderTask)}</ul>
                      </div>
                    )}
                  </div>
                )}

                {deskTab === "deliverables" && (
                  <div className="space-y-6">
                    <section>
                      <p className="text-xs font-semibold text-muted-foreground">הנישה שלי · גרסה 2</p>
                      <div className="mt-2 rounded-xl bg-mentor-bg p-4">
                        <p className="text-xs text-muted-foreground">משפט המיקוד</p>
                        <p className="mt-1 text-lg leading-snug text-primary" style={{ fontFamily: SERIF }}>
                          אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר, ולמצוא שוב זמן זה לזה.
                        </p>
                        <button
                          onClick={() => copy("focus", "אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר, ולמצוא שוב זמן זה לזה.")}
                          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {copied === "focus" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {copied === "focus" ? "הועתק" : "העתקה"}
                        </button>
                      </div>
                    </section>

                    <section>
                      <p className="text-xs font-semibold text-muted-foreground">מקורות הפניה · ארבע פניות מוכנות</p>
                      <ul className="mt-2 space-y-3">
                        {SOURCES.map((s, i) => (
                          <li key={s.type} className="rounded-xl border border-mentor-border/70 p-3.5">
                            <p className="text-sm font-semibold" style={{ fontFamily: SERIF }}>
                              {s.type}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.why}</p>
                            <p className="mt-2 rounded-lg bg-mentor-bg p-2.5 text-sm leading-relaxed" style={{ fontFamily: SERIF }}>
                              {s.message}
                            </p>
                            <p className="mt-1.5 text-xs text-muted-foreground">מעקב: {s.followup}</p>

                            {created[i] ? (
                              <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary">
                                <Check className="h-3.5 w-3.5" />
                                נוצרה משימה
                              </p>
                            ) : creating === i ? (
                              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                <input
                                  type="date"
                                  value={newDate}
                                  onChange={(e) => setNewDate(e.target.value)}
                                  className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
                                />
                                <input
                                  type="time"
                                  value={newTime}
                                  onChange={(e) => setNewTime(e.target.value)}
                                  className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
                                />
                                <button
                                  onClick={() => createFromSource(i)}
                                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                                >
                                  לקבוע
                                </button>
                                <button onClick={() => setCreating(null)} className="px-1 text-xs text-muted-foreground">
                                  ביטול
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setCreating(i)}
                                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                              >
                                <ListChecks className="h-3.5 w-3.5" />
                                להפוך למשימה עם מועד
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                )}

                {deskTab === "notes" && (
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">הפנקס האישי שלך. נשמר אוטומטית בגרסה האמיתית.</p>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={12}
                      className="w-full resize-none rounded-xl border border-mentor-border bg-mentor-bg p-3 text-[15px] leading-relaxed"
                      style={{ fontFamily: SERIF }}
                    />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile: three panes instead of three columns */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-mentor-border bg-card lg:hidden">
        {(
          [
            ["chat", "שיחה", MessageCircle],
            ["tasks", "משימות", ListChecks],
            ["deliverables", "תוצרים", FileText],
            ["notes", "פנקס", NotebookPen],
          ] as const
        ).map(([key, label, I]) => {
          const active = key === "chat" ? mobilePane === "chat" : mobilePane === "desk" && deskTab === key;
          return (
            <button
              key={key}
              onClick={() => (key === "chat" ? setMobilePane("chat") : openDesk(key))}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${active ? "font-semibold text-primary" : "text-muted-foreground"}`}
            >
              <I className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
