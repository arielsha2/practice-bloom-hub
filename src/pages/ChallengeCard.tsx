import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Pencil, RotateCcw } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import {
  BusinessCard,
  CardPdfDocument,
  CardPresentationPage,
  CardSheetPage,
  PAGE_H,
  PAGE_W,
  THEME_LABELS,
  THEME_SWATCH,
} from "@/components/challenge-tools/ToolDocuments";
import type { CardData, CardTheme } from "@/components/challenge-tools/ToolDocuments";
import { Chips, DownloadButtons, Guided, NeriLine, SERIF, ScaledBox, useChallengeToolFonts } from "@/components/challenge-tools/ToolUI";
import type { QDef } from "@/components/challenge-tools/ToolUI";
import { MoreMentorTools } from "@/components/challenge-tools/MoreMentorTools";
import { downloadPdf, downloadPng } from "@/lib/challengeToolsExport";
import { generateCard, loadLatestCard, recordCardEvent, rememberSource, saveCardEdit } from "@/lib/challengeTools";
import type { CardEdit, CardRow, Gender, Person } from "@/lib/challengeTools";
import { guessGender, usableName } from "@/lib/hebrewNames";

// The first challenge tool, for real: the professional business card. Three questions about ONE person the
// therapist loves working with, three versions of "אני עוזר ל… ל…", a card to refine, a PDF and a PNG. Free for any
// signed-in therapist; the link comes as homework (?src=hw1). The other Mentor tools appear only after the result.

const GENDER_LABEL: Record<Gender, string> = { f: "בלשון נקבה", m: "בלשון זכר", n: "בניסוח ניטרלי" };

const PERSON_LEAD =
  "לפני שעונים: חשבו על אדם אחד, אמיתי או מדומיין, שהכי טוב לכם לעבוד איתו. לא קהל ולא כל העולם. בלי שם ובלי פרטים מזהים.";

const QUESTIONS: QDef[] = [
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

const REACTIONS = [
  "זה בדיוק מה שאני צריכה: אדם אחד, עם גיל ועם חיים. מכאן עולה הנישה שלכם.",
  "מצב ולא תווית. זה מה שהכרטיס צריך לדעת עליו.",
  "יפה. עכשיו אני מנסחת.",
];

const defaultEdit = (name: string): CardEdit => ({ variant: 0, sentence: null, theme: "burgundy", name, title: "", phone: "", site: "" });

// ------------------------------------------------------------------------------------------------ result
function CardResult({ row, accountName, source, onRestart }: { row: CardRow; accountName: string; source: string | null; onRestart: () => void }) {
  const { content } = row;
  const [edit, setEdit] = useState<CardEdit>(() => ({ ...defaultEdit(accountName), ...(row.edited_content ?? {}) }));
  const [editingSentence, setEditingSentence] = useState(false);
  const dirty = useRef(false);
  const lastSaved = useRef(JSON.stringify(row.edited_content ?? null));
  const editedLogged = useRef(false);

  const update = (patch: Partial<CardEdit>) => {
    dirty.current = true;
    setEdit((e) => ({ ...e, ...patch }));
  };

  useEffect(() => {
    void recordCardEvent("viewed", row.id, source ? { src: source } : {});
  }, [row.id, source]);

  // What the therapist chooses and types is kept on the row, a moment after the last change.
  useEffect(() => {
    if (!dirty.current) return;
    const snapshot = JSON.stringify(edit);
    if (snapshot === lastSaved.current) return;
    const t = setTimeout(() => {
      saveCardEdit(row.id, edit)
        .then(() => {
          lastSaved.current = snapshot;
          if (!editedLogged.current) {
            editedLogged.current = true;
            void recordCardEvent("edited", row.id);
          }
        })
        .catch((e) => console.error("saving the card failed", e));
    }, 800);
    return () => clearTimeout(t);
  }, [edit, row.id]);

  const v = content.variants[Math.min(edit.variant, content.variants.length - 1)];
  const sentence = edit.sentence;
  const cardData: CardData = useMemo(
    () => ({
      name: edit.name,
      title: edit.title,
      lead: sentence ? "" : v.lead,
      who: sentence ?? v.who,
      change: sentence ? "" : v.change,
      contact: [edit.phone.trim(), edit.site.trim()].filter(Boolean),
      theme: edit.theme,
    }),
    [edit.name, edit.title, edit.phone, edit.site, edit.theme, sentence, v],
  );

  const input = "w-full rounded-lg border border-mentor-border bg-card px-3 py-2 text-sm";

  return (
    <div className="py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
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
              {content.person_summary}
            </p>
            <p className="mt-1.5">
              <span className="text-muted-foreground">הנישה: </span>
              {content.niche_line}
            </p>
          </div>

          <div className="space-y-2.5">
            {content.variants.map((vr, k) => {
              const on = edit.variant === k && !sentence;
              return (
                <button
                  key={k}
                  onClick={() => {
                    update({ variant: k, sentence: null });
                    setEditingSentence(false);
                  }}
                  className={`block w-full rounded-xl border p-4 text-start transition-colors ${on ? "border-primary bg-card shadow-sm" : "border-mentor-border bg-card/60 hover:bg-card"}`}
                >
                  <span className="flex items-center justify-between text-[11px] text-muted-foreground">
                    {vr.tag}
                    {on && <Check className="h-4 w-4 text-primary" />}
                  </span>
                  <span className="mt-1 block leading-relaxed" style={{ fontFamily: SERIF, fontSize: 17 }}>
                    {vr.lead} {vr.who} {vr.change}
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            {editingSentence ? (
              <div className="space-y-2">
                <textarea
                  value={sentence ?? `${v.lead} ${v.who} ${v.change}`}
                  onChange={(e) => update({ sentence: e.target.value })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-mentor-border bg-card p-3 text-base leading-relaxed"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingSentence(false)} className="rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground">
                    שמירה
                  </button>
                  <button
                    onClick={() => {
                      update({ sentence: null });
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
                  update({ sentence: sentence ?? `${v.lead} ${v.who} ${v.change}` });
                  setEditingSentence(true);
                }}
                className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
              >
                <Pencil className="h-3.5 w-3.5" />
                {sentence ? "עריכת הנוסח שלי" : "עריכת הנוסח"}
              </button>
            )}
            {sentence && !editingSentence && <span className="ms-3 rounded-full bg-mentor-surface px-2.5 py-0.5 text-[11px] text-muted-foreground">הנוסח נערך</span>}
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
                onClick={() => update({ theme: t })}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${edit.theme === t ? "border-primary bg-card" : "border-mentor-border hover:bg-card"}`}
              >
                <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: THEME_SWATCH[t] }} />
                {THEME_LABELS[t]}
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border border-mentor-border bg-card p-4">
            <p className="text-sm font-semibold text-primary">פרטי הכרטיס</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                שם
                <input className={input} value={edit.name} onChange={(e) => update({ name: e.target.value })} maxLength={60} />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                כותרת מקצועית
                <input
                  className={input}
                  value={edit.title}
                  onChange={(e) => update({ title: e.target.value })}
                  placeholder="למשל: פסיכותרפיסטית זוגית ומשפחתית"
                  maxLength={60}
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                טלפון
                <input className={input} dir="ltr" value={edit.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="050-000-0000" maxLength={30} />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                אימייל או אתר
                <input className={input} dir="ltr" value={edit.site} onChange={(e) => update({ site: e.target.value })} placeholder="name@example.com" maxLength={60} />
              </label>
            </div>
            {!edit.title.trim() && <p className="text-xs text-muted-foreground">כדאי להוסיף כותרת מקצועית, כדי שהכרטיס יהיה שלם.</p>}
          </div>

          <DownloadButtons
            pngLabel="הורדת הכרטיס כתמונה"
            onPdf={async () => {
              await downloadPdf(<CardPdfDocument data={cardData} />, PAGE_W, "business-card.pdf");
              void recordCardEvent("downloaded", row.id, { kind: "pdf" });
            }}
            onPng={async () => {
              await downloadPng(<BusinessCard data={cardData} width={640} />, 640, "business-card.png", 3);
              void recordCardEvent("downloaded", row.id, { kind: "png" });
            }}
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

          <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-4">
            <p className="text-sm font-semibold">מחר: הפתק האישי</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">מחר תקבלו קישור לכלי השני. הוא ייבנה על מה שכתבתם היום: אותו אדם, הפעם בשפה שלו.</p>
          </div>

          <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
            <RotateCcw className="h-3.5 w-3.5" />
            לנסח מחדש עם אדם אחר או עם תשובות אחרות
          </button>
        </div>
      </div>

      <MoreMentorTools afterTool="card" onClick={() => trackEvent("challenge_card_mentor_click", {})} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ page
const ChallengeCard = () => {
  useChallengeToolFonts();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const source = useMemo(() => rememberSource(window.location.search), []);

  const accountName = usableName((user?.user_metadata as { full_name?: string } | undefined)?.full_name);
  const guess = useMemo(() => guessGender(accountName), [accountName]);
  const [genderPick, setGenderPick] = useState<Gender | null | undefined>(undefined); // undefined: use the guess
  const gender = genderPick === undefined ? guess : genderPick;
  const [person, setPerson] = useState<Person | null>(null);

  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [row, setRow] = useState<CardRow | null>(null);
  const [mode, setMode] = useState<"form" | "result" | null>(null);
  const started = useRef(false);

  const latest = useQuery({
    queryKey: ["challenge-card", user?.id],
    enabled: !!user,
    staleTime: 0,
    retry: false,
    queryFn: loadLatestCard,
  });

  useEffect(() => {
    if (mode !== null || latest.isLoading || !user) return;
    if (latest.data) {
      setRow(latest.data);
      setMode("result");
    } else {
      setMode("form");
    }
  }, [latest.data, latest.isLoading, mode, user]);

  if (!authLoading && !user) return <Navigate to="/auth?next=challenge-card&mode=signup" replace />;

  const restart = () => {
    const prev = row?.inputs;
    if (prev?.answers?.length === 3) setAnswers(prev.answers);
    if (prev?.person) setPerson(prev.person);
    void recordCardEvent("regenerated", row?.id ?? null);
    setMode("form");
  };

  const onFinish = async (): Promise<boolean> => {
    if (!gender || !person) return false;
    const res = await generateCard({ answers, gender, person, source });
    if (res.status === "ok") {
      trackEvent("challenge_card_generated", source ? { src: source } : {});
      setRow(res.row);
      queryClient.setQueryData(["challenge-card", user?.id], res.row);
      setMode("result");
      window.scrollTo({ top: 0 });
      return true;
    }
    if (res.status === "needs_info") {
      toast.error(res.missing[0]?.hint ?? "אפשר להרחיב קצת את התשובות?");
    } else if (res.status === "limit") {
      toast.error("הגעתם למספר הניסוחים המקסימלי להיום. אפשר לחזור מחר.");
    } else {
      toast.error("לא הצלחנו לנסח עכשיו. נסו שוב בעוד רגע.");
    }
    return false;
  };

  const genderGate = (
    <div className="rounded-xl border border-mentor-border bg-mentor-surface/60 p-4 text-sm">
      {accountName && <p className="text-xs text-muted-foreground">השם בחשבון: {accountName}</p>}
      {gender ? (
        <p className="mt-1.5 leading-relaxed">
          כתבנו עלייך {GENDER_LABEL[gender]}{genderPick === undefined ? ", לפי השם" : ""}. לא מתאים?{" "}
          <button className="text-primary underline underline-offset-2" onClick={() => setGenderPick(null)}>
            שינוי
          </button>
        </p>
      ) : (
        <div className="mt-1.5 space-y-2.5">
          <p className="leading-relaxed">שאלה אחת לפני שמתחילים: איך נכון לכתוב עלייך בכרטיס?</p>
          <Chips<Gender>
            value={gender}
            options={[
              { id: "f", label: "בלשון נקבה" },
              { id: "m", label: "בלשון זכר" },
              { id: "n", label: "ניסוח ניטרלי" },
            ]}
            onChange={(g) => setGenderPick(g)}
          />
        </div>
      )}
    </div>
  );

  const personGate = (
    <div className="space-y-2.5 rounded-xl border border-mentor-border bg-mentor-surface/60 p-4 text-sm">
      <p className="leading-relaxed">ועוד אחת: מי האדם שחשבתם עליו?</p>
      <Chips<Person>
        value={person}
        options={[
          { id: "f", label: "אישה" },
          { id: "m", label: "גבר" },
        ]}
        onChange={setPerson}
      />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-20 font-body text-foreground">
      <SEOHead title="כרטיס הביקור המקצועי" description="כלי מתוך האתגר" canonicalUrl="/challenge-tools/card" noindex />
      <div className="mx-auto max-w-5xl px-4 pt-8">
        {mode === null && <p className="py-20 text-center text-sm text-muted-foreground">טוענת…</p>}

        {mode === "form" && (
          <Guided
            key="card-form"
            eyebrow="כלי 1 · כרטיס הביקור המקצועי"
            title="המומחה שהמטופל שלי צריך"
            intro="שלוש שאלות על אדם אחד: מי הוא, מה מטריד אותו ומה הוא מקווה שישתנה. מהן נבנה משפט אחד במבנה של כרטיס ביקור: למי אתם עוזרים, ומה משתנה אצלו. בדרך תגדירו גם מי המטופל שאליו אתם רוצים לפנות, כלומר את הנישה שלכם."
            questions={QUESTIONS}
            reactions={REACTIONS}
            answers={answers}
            setAnswers={(a) => {
              if (!started.current) {
                started.current = true;
                trackEvent("challenge_card_started", source ? { src: source } : {});
              }
              setAnswers(a);
            }}
            canStart={!!gender && !!person}
            gate={
              <div className="space-y-4">
                {genderGate}
                {personGate}
              </div>
            }
            writingText="כותבת את הגרסאות…"
            finishLabel="לכתוב את הגרסאות"
            onFinish={onFinish}
            showSamples={false}
          />
        )}

        {mode === "result" && row && <CardResult key={row.id} row={row} accountName={accountName} source={source} onRestart={restart} />}
      </div>
    </div>
  );
};

export default ChallengeCard;
