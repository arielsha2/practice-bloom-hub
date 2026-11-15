import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, Check, ImagePlus, MessageCircle, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { logToolStep } from "@/lib/toolFunnel";
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
import { downloadPdf, downloadPng, pngBlob } from "@/lib/challengeToolsExport";
import { CLIENT_WORDS, generateCard, loadLatestCard, photoToDataUrl, recordCardEvent, reflectAnswer, rememberSource, resetMyCard, saveCardEdit, shareCardImage } from "@/lib/challengeTools";
import { useShowExpertsTab } from "@/components/landing/ExpertsAdminTab";
import type { CardEdit, CardRow, ClientWord, Gender } from "@/lib/challengeTools";
import { guessGender, usableName } from "@/lib/hebrewNames";

// The first challenge tool, for real: the professional business card. Four short questions about ONE person whose
// life the therapist's work changed (who, and what happened when they reached out; what they asked for and what lay
// beneath it; what changed after a few months; what was different in the therapist's way), with Neri mirroring each
// answer in one sentence and, when an answer stays general, asking once for one concrete person. Then three versions
// of "אני עוזר ל… ל…", a card to refine, a PDF and a PNG. A few minutes in all. The therapist is never asked for
// their gender: the opening follows the account name when it is clear and is neutral otherwise, and every question
// is worded so it reads the same to anyone. Free for any signed-in therapist; the link comes as homework (?src=hw1).

const ANSWER_COUNT = 4;
// Eliana's personal WhatsApp, for feedback on the card (wa.me takes the number without the leading 0).
const ELIANA_WHATSAPP = "972523379716";
const FEEDBACK_TEXT = "היי אליענה, הכנתי את כרטיס הביקור המקצועי שלי באתגר ואשמח לפידבק ממך. הנה הכרטיס:";
const HAND = "'Gveret Levin', 'Miriam Libre', cursive";

const SINGULAR: Record<ClientWord, string> = { מטופלים: "מטופל", לקוחות: "לקוח", מתאמנים: "מתאמן" };
const WORK_NOUN: Record<ClientWord, string> = { מטופלים: "הטיפול", לקוחות: "הייעוץ", מתאמנים: "האימון" };

const firstBefore = (one: string) => (
  <div className="space-y-2">
    <p>
      לפני שעונים, כדאי לעצור לרגע ולהיזכר ב{one} אחד שהיה לך ממש טוב לעבוד איתו. מישהו שחיכית לפגישות איתו, שהרגשת שהעבודה שלך פוגשת אותו
      בדיוק במקום הנכון, ושהשינוי שעבר מילא אותך.
    </p>
    <p className="font-semibold text-primary">זה ה{one} שהיית רוצה שיגיעו אליך עוד רבים כמוהו.</p>
    <p className="text-muted-foreground">
      אפשר לחבר כמה אנשים שפגשת לדמות אחת, או לחשוב על זוג או הורה וילד כיחידה אחת. ואם עדיין לא פגשת כזה, אפשר לדמיין את מי שהיית רוצה שיגיע. בלי
      שם ובלי פרטים מזהים.
    </p>
  </div>
);

const buildQuestions = (clientWord: ClientWord): QDef[] => [
  {
    before: firstBefore(SINGULAR[clientWord]),
    label: "מי הוא, ומה קרה בחייו ברגע שפנה אליך?",
    hint: "באיזה שלב בחיים הוא היה, מה עבר עליו באותה תקופה, ומה גרם לו לפנות דווקא אז. לא קבוצה ולא אבחנה, אלא אדם אחד ברגע מסוים בחייו.",
    example: "למשל: “אמא בת 34, ארבעה חודשים אחרי לידה ראשונה. חזרה לעבודה, ובערבים היא ובן הזוג כמעט לא מדברים. היא פנתה אחרי שמצאה את עצמה בוכה במקלחת.”",
  },
  {
    label: "מה הוא ביקש, ומה היה באמת מתחת לבקשה?",
    hint: "הבקשה היא לרוב מה שאפשר לומר בקול. מתחתיה יש משהו עמוק יותר: פחד, כמיהה, או משהו שקשה להודות בו.",
    example: "למשל: “היא ביקשה עזרה עם העייפות. מתחת לזה היה פחד שהיא מאבדת את עצמה, ושהם הופכים לשני זרים שמגדלים ילד.”",
  },
  {
    label: "מה השתנה אצלו אחרי כמה חודשים? במה הבחינו האנשים סביבו?",
    hint: "משהו שאפשר לראות ולשמוע ביום רגיל.",
    example: "למשל: “היא חזרה לצחוק. בן הזוג סיפר שהם שוב יושבים יחד בערב, ואמא שלה אמרה שהיא נשמעת כמו פעם.”",
  },
  {
    label: `אם היינו רואים רגע אחד מ${WORK_NOUN[clientWord]} הזה, איזה רגע היה עוזר לנו להבין איך זה לעבוד איתך?`,
    hint: "האם יש לך סיפור על התערבות משמעותית שעשית?",
    example: "למשל: “בפגישה החמישית היא שוב התחילה להתנצל על העייפות. עצרתי אותה וביקשתי שתגיד בקול את המשפט שהכי קשה לה להודות בו. היא בכתה, ואחר כך צחקה. באותו ערב היא סיפרה לבן הזוג.”",
  },
];

// Shown when Neri's live reflection is not available (slow reply, error).
const REACTIONS = [
  "תודה. אדם אחד, ברגע אחד בחייו. ממנו הכול מתחיל.",
  "הבקשה, ומה שמתחתיה. שם נמצא הקושי האמיתי שהמשפט צריך לגעת בו.",
  "זה לאן שהוא הגיע. נשארה שאלה אחת, על הדרך שלך.",
];

const defaultEdit = (name: string): CardEdit => ({ variant: 0, sentence: null, theme: "burgundy", name, title: "", phone: "", site: "", showWay: true });

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
  const spoken = sentence ?? `${v.lead} ${v.who} ${v.change}`;
  // Cards made before 2026-11-15 have no professional niche and keep the sentence card.
  const niches = content.card_niches ?? [];
  const professional = niches.length > 0;
  const n = niches[Math.min(edit.niche ?? 0, Math.max(niches.length - 1, 0))];
  const nicheTitle = edit.nicheTitle ?? n?.title ?? "";
  const nicheDetail = edit.nicheDetail ?? n?.detail ?? "";
  const nicheEdited = edit.nicheTitle != null || edit.nicheDetail != null;
  const [editingNiche, setEditingNiche] = useState(false);
  const cardData: CardData = useMemo(
    () => ({
      name: edit.name,
      title: edit.title,
      lead: sentence ? "" : v.lead,
      who: sentence ?? v.who,
      change: sentence ? "" : v.change,
      way: !professional && edit.showWay !== false && content.way_line ? content.way_line : "",
      niche: professional ? { title: nicheTitle, detail: nicheDetail } : undefined,
      pitch: professional ? spoken : undefined,
      photo: professional && edit.photo ? edit.photo : undefined,
      contact: [edit.phone.trim(), edit.site.trim()].filter(Boolean),
      theme: edit.theme,
    }),
    [edit.name, edit.title, edit.phone, edit.site, edit.theme, edit.showWay, edit.photo, content.way_line, sentence, v, professional, nicheTitle, nicheDetail, spoken],
  );

  const input = "w-full rounded-lg border border-mentor-border bg-card px-3 py-2 text-sm";

  // What still makes the card incomplete (the photo is optional).
  const completeness = [
    { label: "שם", done: !!edit.name.trim() },
    { label: "הכשרה ותואר", done: !!edit.title.trim() },
    { label: "פרטי קשר", done: !!(edit.phone.trim() || edit.site.trim()) },
    { label: "תמונה (רשות)", done: !!edit.photo },
  ];
  const missing = completeness.filter((c) => !c.done && !c.label.includes("רשות")).map((c) => c.label);

  const need = (empty: boolean) => (professional && empty ? "border-[hsl(var(--terracotta))] ring-2 ring-[hsl(var(--terracotta)/0.25)]" : "");

  // WhatsApp links cannot carry a file, so the card image is uploaded and its link goes into the message
  // (WhatsApp shows the picture in the chat). The upload happens AHEAD of the click, a few seconds after the
  // card stops changing: preparing it inside the click failed on phones, where opening WhatsApp sends the page
  // to the background and the browser pauses it, so the image was never uploaded and no link was ever sent.
  // The button is then an ordinary link with the image link already inside.
  const [shareLink, setShareLink] = useState<{ key: string; url: string | null } | null>(null);
  const cardKey = useMemo(() => JSON.stringify(cardData), [cardData]);
  useEffect(() => {
    if (!professional) return;
    let stale = false;
    const t = window.setTimeout(async () => {
      let url: string | null = null;
      try {
        url = await shareCardImage(await pngBlob(<BusinessCard data={cardData} width={640} />, 640, 2));
      } catch {
        url = null;
      }
      if (!stale) setShareLink({ key: cardKey, url });
    }, 2500);
    return () => {
      stale = true;
      window.clearTimeout(t);
    };
    // cardKey stands for cardData
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, professional]);
  const shareReady = shareLink?.key === cardKey;
  const shareText = shareReady && shareLink?.url ? `${FEEDBACK_TEXT}\n${shareLink.url}` : FEEDBACK_TEXT;
  const shareHref = `https://wa.me/${ELIANA_WHATSAPP}?text=${encodeURIComponent(shareText)}`;
  const downloadCardPdf = async () => {
    await downloadPdf(<CardPdfDocument data={cardData} />, PAGE_W, "business-card.pdf");
    void recordCardEvent("downloaded", row.id, { kind: "pdf" });
  };
  const downloadCardPng = async () => {
    await downloadPng(<BusinessCard data={cardData} width={640} />, 640, "business-card.png", 3);
    void recordCardEvent("downloaded", row.id, { kind: "png" });
  };

  return (
    <div className="py-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="section-eyebrow">התוצר הראשון</p>
        <h2 className="mt-1 text-3xl text-primary sm:text-4xl" style={{ fontFamily: SERIF }}>
          כרטיס הביקור שלך
        </h2>
      </div>

      {/* The card itself, centred and large: what the whole exercise was for. */}
      <div className="mx-auto mt-6 max-w-3xl space-y-5">
        <div className="rounded-3xl bg-[#f3ece1] p-5 shadow-sm sm:p-10">
          <div className="mx-auto max-w-[640px]">
            <ScaledBox baseWidth={640} baseHeight={356}>
              <BusinessCard data={cardData} width={640} />
            </ScaledBox>
          </div>
        </div>

        {professional && missing.length > 0 && (
          <div className="rounded-2xl border-2 border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta)/0.08)] p-5 text-center">
            <p className="text-xl font-semibold text-primary sm:text-2xl" style={{ fontFamily: SERIF }}>
              עוד צעד קטן: הכרטיס עדיין לא שלם
            </p>
            <p className="mt-1.5 text-sm text-foreground/80">כדי שאפשר יהיה להדפיס ולשלוח אותו, חסרים על הכרטיס:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {missing.map((m) => (
                <span key={m} className="rounded-full bg-[hsl(var(--terracotta))] px-3 py-1 text-sm font-medium text-white">
                  {m}
                </span>
              ))}
            </div>
            <a
              href="#complete-card"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 font-medium text-primary-foreground shadow-sm hover:opacity-90"
            >
              להשלמת הפרטים
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        )}
        {professional && missing.length === 0 && (
          <p className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
            <Check className="h-4 w-4" />
            הכרטיס שלם ומוכן להורדה ולשליחה.
          </p>
        )}

        {content.way_line && !professional && (
          <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={edit.showWay !== false} onChange={(e) => update({ showWay: e.target.checked })} />
            להציג בכרטיס גם את הדרך שלך
          </label>
        )}

        <div className="flex justify-center">
          <DownloadButtons pngLabel="הורדת הכרטיס כתמונה" onPdf={downloadCardPdf} onPng={downloadCardPng} />
        </div>

        {professional && (
          <div className="rounded-2xl border border-[#25D366]/40 bg-[#25D366]/[0.06] p-5 text-center">
            <p className="text-lg font-semibold text-primary" style={{ fontFamily: SERIF }}>
              רוצה פידבק אישי על הכרטיס?
            </p>
            <p className="mx-auto mt-1.5 max-w-lg text-sm leading-relaxed text-foreground/80">
              בלחיצה אחת הכרטיס נשלח לאליענה בווטסאפ, והיא תסתכל עליו ותחזיר אליך פידבק אישי.
            </p>
            <a
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!shareReady}
              onClick={(e) => {
                if (!shareReady) {
                  e.preventDefault();
                  return;
                }
                trackEvent("challenge_card_feedback_whatsapp", { with_image: !!shareLink?.url });
                logToolStep("whatsapp_click");
              }}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-7 py-3 text-base font-semibold text-white shadow-md transition-transform hover:scale-[1.02] hover:bg-[#1fb857] ${shareReady ? "" : "pointer-events-none opacity-70"}`}
            >
              <MessageCircle className="h-5 w-5" />
              {shareReady ? "שליחת הכרטיס לאליענה" : "מכינה את הכרטיס לשליחה…"}
            </a>
            {shareReady && !shareLink?.url && (
              <p className="mt-2 text-xs text-muted-foreground">לא הצלחנו לצרף את תמונת הכרטיס להודעה. אפשר להוריד את הכרטיס ולצרף אותו בווטסאפ.</p>
            )}
            {missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">כדאי להשלים קודם את הפרטים, כדי שאליענה תראה את הכרטיס המלא.</p>}
          </div>
        )}
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <NeriLine>
            {professional
              ? "מתוך מה שסיפרת התגבשה נישה. על הכרטיס היא מופיעה בשפה מקצועית, לצד השם, ההכשרה ופרטי הקשר שלך. בחרו את הניסוח המדויק ביותר, ואפשר גם לערוך אותו."
              : "מתוך מה שסיפרת התגבשה נישה, וממנה כתבתי שלוש גרסאות לכרטיס, כל אחת מזווית אחרת. בחרו את זו שהכי נשמעת כמו שאתם מדברים, ואפשר גם לערוך אותה."}
          </NeriLine>

          <div className="rounded-xl border border-mentor-border bg-card p-4 text-sm leading-relaxed">
            <p className="text-xs font-semibold text-primary">הנישה שהתגבשה</p>
            <p className="mt-2">
              <span className="text-muted-foreground">האדם: </span>
              {content.person_summary}
            </p>
            <p className="mt-1.5">
              <span className="text-muted-foreground">הנישה: </span>
              {content.niche_line}
            </p>
            {content.way_line && (
              <p className="mt-1.5">
                <span className="text-muted-foreground">הדרך שלך: </span>
                {content.way_line}
              </p>
            )}
          </div>

          {professional && (
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-primary">הנישה על הכרטיס</p>
              {niches.map((nc, k) => {
                const on = (edit.niche ?? 0) === k && !nicheEdited;
                return (
                  <button
                    key={k}
                    onClick={() => {
                      update({ niche: k, nicheTitle: null, nicheDetail: null });
                      setEditingNiche(false);
                    }}
                    className={`block w-full rounded-xl border p-4 text-start transition-colors ${on ? "border-primary bg-card shadow-sm" : "border-mentor-border bg-card/60 hover:bg-card"}`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="block leading-snug text-primary" style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700 }}>
                        {nc.title}
                      </span>
                      {on && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-foreground/80">{nc.detail}</span>
                  </button>
                );
              })}
              {editingNiche ? (
                <div className="space-y-2 rounded-xl border border-mentor-border bg-card p-3">
                  <input
                    className="w-full rounded-lg border border-mentor-border bg-card px-3 py-2 text-base font-semibold"
                    value={nicheTitle}
                    onChange={(e) => update({ nicheTitle: e.target.value, nicheDetail })}
                    maxLength={70}
                  />
                  <input
                    className="w-full rounded-lg border border-mentor-border bg-card px-3 py-2 text-sm"
                    value={nicheDetail}
                    onChange={(e) => update({ nicheDetail: e.target.value, nicheTitle })}
                    maxLength={110}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditingNiche(false)} className="rounded-lg bg-primary px-4 py-1.5 text-sm text-primary-foreground">
                      שמירה
                    </button>
                    <button
                      onClick={() => {
                        update({ nicheTitle: null, nicheDetail: null });
                        setEditingNiche(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-mentor-border px-3 py-1.5 text-sm"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      חזרה למקור
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    onClick={() => setEditingNiche(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-2 hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    עריכת הנישה בכרטיס
                  </button>
                  {nicheEdited && <span className="ms-3 rounded-full bg-mentor-surface px-2.5 py-0.5 text-[11px] text-muted-foreground">הנוסח נערך</span>}
                </div>
              )}
            </div>
          )}

          {professional && (
            <div className="pt-2">
              <p className="text-sm font-semibold text-primary">המשפט שלך, לומר בעל פה</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                כשמישהו שואל במה העבודה שלך: משפט אחד בשפה של יום יום, למי העבודה שלך מיועדת ומה משתנה. הוא לא מופיע על הכרטיס, אבל נכנס לעמוד הראשון בקובץ ה-PDF.
              </p>
            </div>
          )}

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
          <div
            id="complete-card"
            className={`scroll-mt-6 space-y-4 rounded-2xl border-2 p-4 sm:p-5 ${professional && missing.length ? "border-[hsl(var(--terracotta))] bg-[hsl(var(--terracotta)/0.05)]" : "border-mentor-border bg-card/60"}`}
          >
            <div>
              <p className="text-lg font-semibold text-primary" style={{ fontFamily: SERIF }}>
                השלמת הכרטיס
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {professional ? "השם, ההכשרה, פרטי הקשר והתמונה מופיעים על הכרטיס עצמו. כל מה שממלאים כאן מתעדכן בכרטיס מיד." : "הפרטים כאן מופיעים על הכרטיס."}
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-mentor-border bg-card p-4">
              <p className="text-sm font-semibold text-primary">{professional ? "1. הפרטים שלך" : "פרטי הכרטיס"}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  שם
                  <input className={`${input} ${need(!edit.name.trim())}`} value={edit.name} onChange={(e) => update({ name: e.target.value })} placeholder="השם כפי שיופיע בכרטיס" maxLength={60} />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  {professional ? "הכשרה ותואר" : "כותרת מקצועית"}
                  <input
                    className={`${input} ${need(!edit.title.trim())}`}
                    value={edit.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder={professional ? "למשל: עובדת סוציאלית קלינית, M.S.W" : "למשל: פסיכותרפיסטית זוגית ומשפחתית"}
                    maxLength={70}
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  טלפון
                  <input className={`${input} ${need(!edit.phone.trim() && !edit.site.trim())}`} dir="ltr" value={edit.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="050-000-0000" maxLength={30} />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  אימייל או אתר
                  <input className={`${input} ${need(!edit.phone.trim() && !edit.site.trim())}`} dir="ltr" value={edit.site} onChange={(e) => update({ site: e.target.value })} placeholder="name@example.com" maxLength={60} />
                </label>
              </div>
            </div>

            {professional && (
              <div className="rounded-xl border border-dashed border-mentor-accent/60 bg-card p-4">
                <p className="mb-2 text-sm font-semibold text-primary">2. תמונה</p>
                <div className="flex items-center gap-4">
                  {edit.photo ? (
                    <img src={edit.photo} alt="" className="h-16 w-16 shrink-0 rounded-full border-2 border-mentor-accent/60 object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-mentor-surface text-mentor-accent">
                      <ImagePlus className="h-6 w-6" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl leading-tight text-primary" style={{ fontFamily: HAND }}>
                      {edit.photo ? "איזה כיף, עכשיו רואים אותך בכרטיס" : "מוזמנים להוסיף תמונה שלכם לכרטיס הביקור"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                      <label className="cursor-pointer rounded-lg border border-mentor-border bg-card px-3 py-1.5 hover:bg-mentor-surface">
                        {edit.photo ? "החלפת התמונה" : "בחירת תמונה"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            try {
                              update({ photo: await photoToDataUrl(file) });
                              trackEvent("challenge_card_photo_added", {});
                            } catch {
                              toast.error("לא הצלחנו לקרוא את התמונה. אפשר לנסות קובץ JPG או PNG אחר.");
                            }
                          }}
                        />
                      </label>
                      {edit.photo && (
                        <button onClick={() => update({ photo: null })} className="text-muted-foreground underline-offset-2 hover:underline">
                          הסרה
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-mentor-border bg-card p-4">
              <p className="mb-2 text-sm font-semibold text-primary">{professional ? "3. צבע הכרטיס" : "צבע הכרטיס"}</p>
              <div className="flex flex-wrap items-center gap-3">
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
            </div>
          </div>

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
        </div>
      </div>

      {/* What comes next: centred under the card, not in one of the columns. */}
      <div className="mx-auto mt-10 max-w-2xl space-y-4 text-center">
        <div className="rounded-xl border border-primary/30 bg-card p-5">
          <p className="text-base font-semibold text-primary">משימת בדיקה לשבוע הקרוב</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            למי אפשר לומר את המשפט השבוע? סקרנות ושאלה כמו “איך זה עובד אצלך?” הן סימן טוב. גבה מורמת פירושה שכדאי לדייק, ולחזור לכאן לנסח מחדש.
          </p>
        </div>

        <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-5">
          <p className="text-base font-semibold">מחר: הפתק האישי</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">מחר יגיע קישור לכלי השני. הוא ייבנה על מה שנכתב היום: אותו אדם, הפעם בשפה שלו.</p>
        </div>

        <button onClick={onRestart} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
          <RotateCcw className="h-3.5 w-3.5" />
          לנסח מחדש עם אדם אחר או עם תשובות אחרות
        </button>
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
  // Never asked: the name says it when it is clear, otherwise the card opens in neutral wording ("אני כאן כדי לעזור").
  const gender: Gender = useMemo(() => guessGender(accountName) ?? "n", [accountName]);

  const [answers, setAnswers] = useState<string[]>(() => Array(ANSWER_COUNT).fill(""));
  const [clientWord, setClientWord] = useState<ClientWord>("מטופלים");
  const isAdmin = useShowExpertsTab();
  const [resetting, setResetting] = useState(false);
  const [formKey, setFormKey] = useState(0);
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

  useEffect(() => {
    if (!authLoading) logToolStep(user ? "landed_signed_in" : "landed_signed_out");
  }, [authLoading, user]);
  useEffect(() => {
    if (mode === "form") logToolStep("questions_shown");
  }, [mode]);

  if (!authLoading && !user) return <Navigate to="/auth?next=challenge-card&mode=signup" replace />;

  const restart = () => {
    const prev = row?.inputs;
    if (prev?.answers?.length === ANSWER_COUNT) setAnswers(prev.answers);
    if (prev?.client_word) setClientWord(prev.client_word);
    void recordCardEvent("regenerated", row?.id ?? null);
    setMode("form");
  };

  const adminReset = async () => {
    if (!window.confirm("למחוק את כל מה שנכתב בתרגיל הזה בחשבון שלך (כל הגרסאות של הכרטיס) ולהתחיל מההתחלה? אי אפשר לשחזר.")) return;
    setResetting(true);
    const ok = await resetMyCard();
    setResetting(false);
    if (!ok) {
      toast.error("המחיקה לא הצליחה. נסו שוב בעוד רגע.");
      return;
    }
    queryClient.setQueryData(["challenge-card", user?.id], null);
    setRow(null);
    setAnswers(Array(ANSWER_COUNT).fill(""));
    setClientWord("מטופלים");
    setFormKey((k) => k + 1);
    setMode("form");
    window.scrollTo({ top: 0 });
    toast.success("התרגיל נמחק. אפשר להתחיל מחדש.");
  };

  const onFinish = async (): Promise<boolean> => {
    const res = await generateCard({ answers, gender, clientWord, source });
    if (res.status === "ok") {
      trackEvent("challenge_card_generated", source ? { src: source } : {});
      logToolStep("tool_done");
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

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-20 font-body text-foreground">
      <SEOHead title="כרטיס הביקור המקצועי" description="כלי מתוך האתגר" canonicalUrl="/challenge-tools/card" noindex />
      <div className="mx-auto max-w-5xl px-4 pt-8">
        {isAdmin && mode !== null && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-primary/40 bg-card px-4 py-2.5 text-sm">
            <span className="text-muted-foreground">
              <span className="me-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">אדמין</span>
              מחיקה של התוכן שלך בתרגיל, כדי לעבור אותו שוב מההתחלה.
            </span>
            <button
              onClick={() => void adminReset()}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-destructive hover:bg-destructive/5 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {resetting ? "מוחקת…" : "מחיקה והתחלה מחדש"}
            </button>
          </div>
        )}
        {mode === null && <p className="py-20 text-center text-sm text-muted-foreground">טוענת…</p>}

        {mode === "form" && (
          <Guided
            key={`card-form-${formKey}`}
            eyebrow="כלי 1 · כרטיס הביקור המקצועי"
            title="המשפט שמציג אותך"
            intro={
              <div className="space-y-3 leading-relaxed">
                <p className="text-lg text-foreground/90">
                  אני מזמינה אותך לעצור לכמה דקות ולענות על ארבע שאלות קצרות, על אדם אחד שהעבודה שלך שינתה את חייו.
                </p>
                <p className="text-muted-foreground">
                  מהתשובות ננסח יחד את כרטיס הביקור המקצועי שלך, כך שאנשים יידעו בדיוק למי העבודה שלך עוזרת, את מי כדאי להפנות אליך, ויזכרו אותך כשמישהו
                  יצטרך אותך.
                </p>
                <p className="text-sm text-muted-foreground">זה ניסוי ולא מבחן, ואין כאן תשובה נכונה. כחמש דקות.</p>
              </div>
            }
            questions={buildQuestions(clientWord)}
            reactions={REACTIONS}
            answers={answers}
            setAnswers={(a) => {
              if (!started.current) {
                started.current = true;
                trackEvent("challenge_card_started", source ? { src: source } : {});
              }
              setAnswers(a);
            }}
            canStart
            gate={
              <div className="space-y-2.5 rounded-xl border border-mentor-border bg-mentor-surface/60 p-4 text-sm">
                <p className="leading-relaxed">איך נכון לקרוא לאנשים שמגיעים אליך?</p>
                <Chips<ClientWord> value={clientWord} options={CLIENT_WORDS.map((w) => ({ id: w, label: w }))} onChange={setClientWord} />
              </div>
            }
            reflect={(step, a) => reflectAnswer(step, a, clientWord)}
            conversational
            writingText="מנסחת את המשפט שלך…"
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
