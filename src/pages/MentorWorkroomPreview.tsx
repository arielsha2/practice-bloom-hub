import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  Copy,
  FileText,
  History,
  ListChecks,
  Mail,
  MessageCircle,
  NotebookPen,
  Pencil,
  Phone,
  RotateCcw,
  Send,
  Users,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

/*
 * Design aid: a clickable prototype of the "workroom" Mentor (conversation in the middle, a wide work desk
 * beside it with deliverables, dated tasks and a report-back loop). Sample data only: nothing is read or
 * saved, and it is not linked from anywhere. Real tasks would live in an owner-only table.
 *
 * A therapist may come back after days or weeks, so the page re-orients them: a "where we stopped" recap
 * (computed from the data, not from memory), the previous conversation folded away, overdue tasks that can
 * be rescheduled, and message drafts that can be edited. The banner switches between the three cases.
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
  message: string; // what the therapist will send: editable
  original?: string; // what was generated, so an edit can be undone
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
  anchor?: boolean; // where the page lands when it opens: the start of today's conversation
  session?: "prev"; // belongs to the previous conversation (folded away after a long break)
  recap?: boolean; // show the "where we stopped" recap under this message
  ref?: MsgRef; // a quote that points at a task or deliverable the message talks about
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

// What was finished and when, counted back from the last visit.
const STAGE_HISTORY = [
  { label: "מציאת נישה", what: "משפט המיקוד", before: 8 },
  { label: "תמחור", what: "משפט המחיר", before: 5 },
  { label: "הצגה עצמית", what: "היכרות של 30 שניות", before: 2 },
];

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

// Whole calendar days a date is behind today (0 = today, negative = still ahead).
const daysBehind = (d: Date) => {
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};

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

const dayShort = (d: Date) => d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
const awayLabel = (days: number) => (days < 14 ? `${days} ימים` : `${Math.round(days / 7)} שבועות`);

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

const FOCUS_SENTENCE = "אני מלווה זוגות אחרי לידה ראשונה לחזור לדבר, ולמצוא שוב זמן זה לזה.";

// The same plan seen from three moments: the same day, 9 days later, 3 weeks later.
function buildScenario(away: number): { tasks: Task[]; msgs: Msg[] } {
  const due = (i: number): Date => {
    if (away === 0) return i === 0 ? soonToday() : at(i === 1 ? 1 : 3, i === 1 ? 10 : 9);
    // scheduled at the last visit: day 0 evening, the next morning, and twelve days on
    return at(-away + [0, 1, 12][i], [20, 10, 9][i]);
  };
  const tasks: Task[] = [
    {
      id: "t1",
      kind: "whatsapp",
      title: "לשלוח הודעת היכרות לפסיכיאטר",
      name: "ד״ר רונן",
      role: "פסיכיאטר",
      message: SOURCES[0].message,
      original: SOURCES[0].message,
      due: due(0),
      status: "pending",
    },
    {
      id: "t2",
      kind: "email",
      title: "לשלוח מייל למנחה בקורס ההכנה ללידה",
      name: "מיכל",
      role: "מנחה בקורס הכנה ללידה",
      message: SOURCES[1].message,
      original: SOURCES[1].message,
      due: due(1),
      status: "pending",
    },
    {
      id: "t3",
      kind: "phone",
      title: "להתקשר ליועצת ההנקה",
      name: "יעל",
      role: "יועצת הנקה",
      message: SOURCES[2].message,
      original: SOURCES[2].message,
      due: due(2),
      status: "pending",
    },
  ];

  const folded = away >= 3 ? ("prev" as const) : undefined;
  const last = at(-away, 18);
  const msgs: Msg[] = [
    {
      id: "d-last",
      from: "eliana",
      text: "",
      divider: away === 0 ? "היום · רשת הפניות" : `${dayShort(last)} · השיחה האחרונה שלנו`,
      session: folded,
    },
    {
      id: "m1",
      from: "eliana",
      session: folded,
      text: "עכשיו מוציאים את המשפט לעולם. בחרנו יחד ארבעה עמיתים לפנייה הראשונה, ושלוש הפניות הראשונות כבר מחכות לך בשולחן העבודה, עם נוסח ומועד.",
      ref: { kind: "focus", title: FOCUS_SENTENCE, meta: "משפט המיקוד · בתוצרים" },
    },
    { id: "m2", from: "me", session: folded, text: "אני קצת מתלבטת אם לפתוח עם טלפון או עם הודעה." },
    {
      id: "m3",
      from: "eliana",
      session: folded,
      text: "שאלה טובה. עם עמית שעוד לא מכיר אותך, הודעה קצרה קודמת לשיחה. הטלפון מגיע אחרי שהוא ענה, ואז יש לו כבר הקשר. בגלל זה בחרתי בהודעה לפסיכיאטר, והיא אמורה לצאת היום.",
      ref: { kind: "task", taskId: "t1", title: "לשלוח הודעת היכרות לפסיכיאטר" },
    },
  ];

  if (away >= 3) {
    // Computed from the tasks, so it stays true; the model would only phrase it.
    const overdue = tasks.filter((t) => daysBehind(t.due) >= 1).length;
    const first = [...tasks].sort((a, b) => a.due.getTime() - b.due.getTime())[0];
    msgs.push(
      { id: "d-today", from: "eliana", text: "", divider: `היום · חזרת אחרי ${awayLabel(away)}`, anchor: true },
      {
        id: "welcome",
        from: "eliana",
        recap: true,
        text: `טוב שחזרת. עברו ${awayLabel(away)} מאז שנפגשנו, ואין צורך להתחיל מחדש: כל מה שעשינו שמור. ${
          overdue > 0
            ? `כמה מהפניות עברו את המועד שקבענו, וזה קורה לכולם. נתחיל מהפנייה ל${first.role}. אם הנוסח כבר לא מרגיש נכון, אפשר לערוך אותו בשולחן העבודה, או שנעדכן אותו יחד.`
            : `הפנייה הבאה ממתינה לך.`
        } הנה התמונה המלאה:`,
      },
    );
  }
  return { tasks, msgs };
}

const NOTES_SEED = "• הפנייה לפסיכיאטר: להדגיש שאני לא מבקשת שום דבר, רק מציגה את מה שאני עושה.\n• לזכור: כל פנייה נגמרת בשאלה פתוחה אחת.";

const AWAY_OPTIONS = [
  { days: 0, label: "אותו יום" },
  { days: 9, label: "אחרי 9 ימים" },
  { days: 24, label: "אחרי 3 שבועות" },
];

function TimelineNode({ kind }: { kind: "done" | "now" | "later" }) {
  if (kind === "done")
    return (
      <span className="relative z-10 mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Check className="h-3 w-3" />
      </span>
    );
  if (kind === "now")
    return <span className="relative z-10 mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-[5px] border-mentor-accent bg-card" />;
  return <span className="relative z-10 mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 border-mentor-border bg-card" />;
}

export default function MentorWorkroomPreview() {
  const [away, setAway] = useState(9);
  const [tasks, setTasks] = useState<Task[]>(() => buildScenario(9).tasks);
  const [msgs, setMsgs] = useState<Msg[]>(() => buildScenario(9).msgs);
  const [draft, setDraft] = useState("");
  const [deskTab, setDeskTab] = useState<DeskTab>("tasks");
  const [mobilePane, setMobilePane] = useState<"chat" | "desk">("chat");
  const [showPrev, setShowPrev] = useState(false);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportOutcome, setReportOutcome] = useState<Outcome | null>(null);
  const [reportNote, setReportNote] = useState("");
  const [openMessage, setOpenMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [reDate, setReDate] = useState(dateInput(at(1, 10)));
  const [reTime, setReTime] = useState("10:00");
  const [suggestion, setSuggestion] = useState<Omit<Task, "id" | "status"> | null>(null);
  const [sugDate, setSugDate] = useState("");
  const [sugTime, setSugTime] = useState("");
  const [creating, setCreating] = useState<number | null>(null);
  const [newDate, setNewDate] = useState(dateInput(at(1, 10)));
  const [newTime, setNewTime] = useState("10:00");
  const [created, setCreated] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: true });
  const [notes, setNotes] = useState(NOTES_SEED);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const landOnAnchor = useRef(true);

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

  // Opening (or switching case) lands at the start of today's conversation; a new message scrolls to the bottom.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    if (landOnAnchor.current) {
      landOnAnchor.current = false;
      box.scrollTop = anchorRef.current ? Math.max(anchorRef.current.offsetTop - 12, 0) : box.scrollHeight;
    } else {
      box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }
  }, [msgs]);

  const pending = useMemo(
    () => tasks.filter((t) => t.status === "pending").sort((a, b) => a.due.getTime() - b.due.getTime()),
    [tasks],
  );
  const done = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);
  const next = pending[0];
  const now = new Date();
  const overdueList = pending.filter((t) => daysBehind(t.due) >= 1);
  const todayList = pending.filter((t) => daysBehind(t.due) === 0);
  const laterList = pending.filter((t) => daysBehind(t.due) < 0);

  const switchCase = (days: number) => {
    const s = buildScenario(days);
    landOnAnchor.current = true;
    setAway(days);
    setTasks(s.tasks);
    setMsgs(s.msgs);
    setShowPrev(false);
    setDraft("");
    setSuggestion(null);
    setReporting(null);
    setOpenMessage(null);
    setEditing(null);
    setRescheduling(null);
    setCreated({ 0: true, 1: true, 2: true });
    setDeskTab("tasks");
    setMobilePane("chat");
  };

  const say = (from: "eliana" | "me", text: string) =>
    setMsgs((m) => [...m, { id: `m${m.length + 1}-${Date.now()}`, from, text }]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    say("me", text);
    window.setTimeout(
      () =>
        say(
          "eliana",
          "(בגרסה האמיתית כאן נרי עונה לפי כל מה שהיא יודעת עלייך. בתצוגה הזו התשובה קבועה.)",
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

  const openDesk = (tab: DeskTab) => {
    setDeskTab(tab);
    setMobilePane("desk");
  };

  const openTask = (id: string) => {
    setOpenMessage(id);
    openDesk("tasks");
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
        onClick={() => t && openTask(t.id)}
        className="mt-3 flex w-full items-center gap-2.5 border-s-2 border-mentor-accent/60 ps-3 text-start hover:opacity-75"
      >
        <I className="h-4 w-4 shrink-0 text-mentor-accent" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-muted-foreground">
            משימה · {t ? (t.status === "done" ? "בוצעה" : daysBehind(t.due) >= 1 ? `באיחור של ${daysBehind(t.due)} ימים` : whenLabel(t.due)) : ""}
          </span>
          <span className="block truncate text-sm font-medium" style={{ fontFamily: SERIF }}>
            {r.title}
          </span>
        </span>
      </button>
    );
  };

  // "Where we stopped": a timeline of what was done, where we are now, and what comes later.
  const renderRecap = () => {
    const open = pending.slice(0, 3);
    return (
      <div className="mt-4 rounded-2xl border border-mentor-border/70 bg-mentor-bg p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
          <History className="h-3.5 w-3.5" />
          איפה עצרנו · ביקור אחרון לפני {awayLabel(away)}
        </p>
        <ol className="relative space-y-3 text-[13px] before:absolute before:bottom-2 before:top-2 before:start-[8px] before:w-px before:bg-mentor-border">
          {STAGE_HISTORY.map((h) => (
            <li key={h.label} className="flex items-start gap-3">
              <TimelineNode kind="done" />
              <p className="leading-snug">
                <span className="text-muted-foreground">{dayShort(at(-away - h.before, 12))} · </span>
                <span className="font-medium">{h.label}</span>
                <span className="text-muted-foreground"> · {h.what}</span>
              </p>
            </li>
          ))}
          <li className="flex items-start gap-3">
            <TimelineNode kind="now" />
            <div className="min-w-0 flex-1">
              <p className="leading-snug">
                <span className="font-semibold text-mentor-accent">עכשיו · </span>
                <span className="font-medium">רשת הפניות</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {done.length} מתוך {done.length + pending.length} פניות בוצעו
                  {overdueList.length > 0 ? `, ${overdueList.length} באיחור` : ""}
                </span>
              </p>
              <ul className="mt-2 space-y-1">
                {open.map((t) => {
                  const I = KIND_META[t.kind].Icon;
                  const late = daysBehind(t.due);
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => openTask(t.id)}
                        className="flex w-full items-center gap-2 rounded-lg bg-card px-2.5 py-1.5 text-start hover:bg-mentor-surface"
                      >
                        <I className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate">{t.title}</span>
                        <span className={`shrink-0 text-[11px] ${late >= 1 ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                          {late >= 1 ? `באיחור של ${late} ימים` : whenLabel(t.due)}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {open.length === 0 && <li className="text-xs text-muted-foreground">אין משימות פתוחות.</li>}
              </ul>
            </div>
          </li>
          <li className="flex items-start gap-3 text-muted-foreground">
            <TimelineNode kind="later" />
            <p className="leading-snug">בהמשך · גישור קשר, שיחה ראשונה</p>
          </li>
        </ol>
      </div>
    );
  };

  const renderMsg = (m: Msg) => {
    if (m.divider)
      return (
        <div
          key={m.id}
          ref={m.anchor ? anchorRef : undefined}
          className="flex items-center gap-3 text-[11px] text-muted-foreground/80"
        >
          <span className="h-px flex-1 bg-mentor-border/50" />
          {m.divider}
          <span className="h-px flex-1 bg-mentor-border/50" />
        </div>
      );
    if (m.from === "eliana")
      return (
        <div key={m.id} className="max-w-[94%]">
          <p className="text-[15px] leading-[1.85] text-foreground" style={{ fontFamily: SERIF }}>
            {m.text}
          </p>
          {m.ref && renderRef(m.ref)}
          {m.recap && renderRecap()}
        </div>
      );
    return (
      <div key={m.id} className="ms-auto max-w-[85%] rounded-2xl rounded-ss-sm bg-mentor-surface px-4 py-2.5 text-sm leading-relaxed">
        {m.text}
      </div>
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
    setTasks((all) => [
      ...all,
      { ...base, original: base.original ?? base.message, id: `t${all.length + 1}-${Date.now()}`, status: "pending" },
    ]);

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

  const saveEdit = (t: Task) => {
    const text = editDraft.trim();
    if (text) setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, message: text } : x)));
    setEditing(null);
  };

  const applyReschedule = (t: Task) => {
    setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, due: fromInputs(reDate, reTime) } : x)));
    setRescheduling(null);
  };

  const renderTask = (t: Task) => {
    const { Icon, label } = KIND_META[t.kind];
    const late = t.status === "pending" ? daysBehind(t.due) : 0;
    const overdue = late >= 1;
    const isToday = t.status === "pending" && late === 0;
    const expanded = openMessage === t.id;
    const isReporting = reporting === t.id;
    const isEditing = editing === t.id;
    const edited = t.original !== undefined && t.message !== t.original;
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
                {overdue ? `באיחור של ${late} ימים · נקבע ל-${dayShort(t.due)}` : whenLabel(t.due)}
              </span>
              {t.status === "done" && t.outcome && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  <Check className="h-3 w-3" />
                  {OUTCOME_LABEL[t.outcome]}
                </span>
              )}
              {edited && <span className="rounded-full bg-mentor-surface px-2 py-0.5 text-[11px] text-muted-foreground">הנוסח נערך</span>}
            </div>
            {t.status === "done" && t.note && <p className="mt-2 text-xs italic text-muted-foreground">״{t.note}״</p>}
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            onClick={() => {
              setOpenMessage(expanded ? null : t.id);
              if (expanded) setEditing(null);
            }}
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {expanded ? "הסתר את הנוסח" : "הנוסח המוכן"}
          </button>
          {t.status === "pending" && !isEditing && (
            <button
              onClick={() => {
                setOpenMessage(t.id);
                setEditing(t.id);
                setEditDraft(t.message);
              }}
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
              עריכת הנוסח
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-2 rounded-lg bg-mentor-bg p-3">
            {isEditing ? (
              <>
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={5}
                  autoFocus
                  className="w-full resize-y rounded-lg border border-mentor-border bg-card p-2.5 text-sm leading-relaxed"
                  style={{ fontFamily: SERIF }}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">אפשר לשנות כל מילה. הנוסח שלך הוא זה שיישלח.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => saveEdit(t)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    שמירת הנוסח
                  </button>
                  <button onClick={() => setEditing(null)} className="px-2 text-xs text-muted-foreground">
                    ביטול
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-foreground" style={{ fontFamily: SERIF }}>
                  {t.message}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <button
                    onClick={() => copy(`t-${t.id}`, t.message)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copied === `t-${t.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied === `t-${t.id}` ? "הועתק" : "העתקה"}
                  </button>
                  {edited && t.status === "pending" && (
                    <button
                      onClick={() => setTasks((all) => all.map((x) => (x.id === t.id ? { ...x, message: x.original ?? x.message } : x)))}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      חזרה לנוסח המקורי
                    </button>
                  )}
                </div>
              </>
            )}
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
              onClick={() => {
                setRescheduling(rescheduling === t.id ? null : t.id);
                setReDate(dateInput(at(1, 10)));
                setReTime("10:00");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                overdue
                  ? "border-primary font-medium text-primary hover:bg-primary/5"
                  : "border-mentor-border text-foreground hover:bg-mentor-surface"
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              מועד חדש
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

        {rescheduling === t.id && t.status === "pending" && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-lg bg-mentor-bg p-2.5">
            <input
              type="date"
              value={reDate}
              onChange={(e) => setReDate(e.target.value)}
              className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
            />
            <input
              type="time"
              value={reTime}
              onChange={(e) => setReTime(e.target.value)}
              className="rounded-lg border border-mentor-border bg-card px-2 py-1 text-xs"
            />
            <button
              onClick={() => applyReschedule(t)}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
            >
              לעדכן
            </button>
            <button onClick={() => setRescheduling(null)} className="px-1 text-xs text-muted-foreground">
              ביטול
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

  const prevMsgs = msgs.filter((m) => m.session === "prev");
  const restMsgs = msgs.filter((m) => m.session !== "prev");
  const returning = away >= 3;

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-20 text-foreground lg:pb-8">
      <SEOHead title="חדר עבודה (אב-טיפוס)" description="תצוגה פנימית" canonicalUrl="https://therapykeys.co.il/" noindex />

      <div className="sticky top-0 z-40 flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-neutral-900 px-4 py-2 text-xs text-white">
        <span className="font-semibold">אב-טיפוס · חדר עבודה</span>
        <span className="opacity-70">נתוני דוגמה, שום דבר לא נשמר. מתי המטפל חוזר?</span>
        {AWAY_OPTIONS.map((o) => (
          <button
            key={o.days}
            onClick={() => switchCase(o.days)}
            className={`rounded-full border px-3 py-0.5 ${
              away === o.days ? "border-white bg-white text-neutral-900" : "border-white/40 text-white hover:bg-white/10"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start">
          {/* Conversation: the heart of the room */}
          <section
            className={`${mobilePane === "chat" ? "flex" : "hidden"} min-h-[30rem] flex-col overflow-hidden rounded-3xl border border-mentor-border/70 bg-card shadow-md lg:flex lg:h-[46rem]`}
          >
            {/* Where we are, in one band: who, which stage of six, the goal, and how far */}
            <header className="bg-primary px-5 pb-4 pt-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <img src="/images/neri-avatar.png" alt="" className="h-10 w-10 rounded-full border-2 border-primary-foreground/30 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight" style={{ fontFamily: SERIF }}>
                    נרי
                  </p>
                  <p className="text-xs opacity-80">שלב 4 מתוך 6 · רשת הפניות</p>
                </div>
                {returning && (
                  <span className="shrink-0 rounded-full bg-primary-foreground/15 px-2.5 py-0.5 text-[11px]">
                    ביקור אחרון: לפני {awayLabel(away)}
                  </span>
                )}
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
                {overdueList.length > 0 ? ` · ${overdueList.length} באיחור` : ""}
              </p>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {prevMsgs.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowPrev((v) => !v)}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-mentor-border bg-mentor-bg/60 px-3.5 py-2.5 text-start hover:bg-mentor-bg"
                  >
                    <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] text-muted-foreground">השיחה הקודמת · {dayShort(at(-away, 18))}</span>
                      <span className="block text-[13px] leading-snug text-foreground">
                        ניסחנו את משפט המיקוד, בחרנו ארבעה עמיתים והכנו שלוש פניות.
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-primary">{showPrev ? "הסתרה" : "הצגה"}</span>
                  </button>
                  {showPrev && <div className="mt-5 space-y-6">{prevMsgs.map(renderMsg)}</div>}
                </div>
              )}
              {restMsgs.map(renderMsg)}
              <div ref={chatEnd} />
            </div>

            <div className="border-t border-mentor-border/60 bg-mentor-bg/60 p-3">
              {next ? (
                <button
                  onClick={() => openTask(next.id)}
                  className="mb-2 flex w-full items-center gap-2 rounded-lg bg-mentor-accent/10 px-3 py-2 text-start text-[13px] hover:bg-mentor-accent/15"
                >
                  {(() => {
                    const I = KIND_META[next.kind].Icon;
                    return <I className="h-4 w-4 shrink-0 text-mentor-accent" />;
                  })()}
                  <span className="shrink-0 text-muted-foreground">הצעד הבא:</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {next.title} · {daysBehind(next.due) >= 1 ? `באיחור של ${daysBehind(next.due)} ימים` : whenLabel(next.due)}
                  </span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ) : (
                <p className="mb-2 px-1 text-xs text-muted-foreground">אין משימות פתוחות. בואי נחליט עם נרי מה הצעד הבא.</p>
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
                  placeholder={returning ? "ספרי לי מה קרה מאז, או מה מעכב אותך" : "מה עובר עלייך עם הפנייה הראשונה?"}
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
                    ["deliverables", "תוצרים", FileText, 0],
                    ["tasks", "משימות", ListChecks, pending.length],
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

              <div className="max-h-[40rem] overflow-y-auto p-4">
                {deskTab === "tasks" && (
                  <div className="space-y-5">
                    {suggestion && (
                      <div className="rounded-xl border-2 border-dashed border-mentor-accent/60 bg-mentor-accent/5 p-3.5">
                        <p className="text-xs font-semibold text-mentor-accent">הצעה מנרי</p>
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

                    {overdueList.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-destructive">עברו את המועד ({overdueList.length})</h3>
                        <ul className="space-y-2.5">{overdueList.map(renderTask)}</ul>
                      </div>
                    )}
                    {todayList.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">להיום</h3>
                        <ul className="space-y-2.5">{todayList.map(renderTask)}</ul>
                      </div>
                    )}
                    {laterList.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-xs font-semibold text-muted-foreground">בהמשך</h3>
                        <ul className="space-y-2.5">{laterList.map(renderTask)}</ul>
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
                          {FOCUS_SENTENCE}
                        </p>
                        <button
                          onClick={() => copy("focus", FOCUS_SENTENCE)}
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

      {/* Mobile: panes instead of columns, in the same order as the desk tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-mentor-border bg-card lg:hidden">
        {(
          [
            ["chat", "שיחה", MessageCircle],
            ["deliverables", "תוצרים", FileText],
            ["tasks", "משימות", ListChecks],
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
