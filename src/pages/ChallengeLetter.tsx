import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUp, Check, Copy, FileDown, MessageCircle, MessagesSquare, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { LETTER_TOOL, logToolStep } from "@/lib/toolFunnel";
import { NeriBubble, SERIF, useChallengeToolFonts } from "@/components/challenge-tools/ToolUI";
import { LetterPdfDocument } from "@/components/challenge-tools/LetterDocument";
import { PAGE_W } from "@/components/challenge-tools/ToolDocuments";
import { downloadPdf } from "@/lib/challengeToolsExport";
import { MoreMentorTools } from "@/components/challenge-tools/MoreMentorTools";
import { useShowExpertsTab } from "@/components/landing/ExpertsAdminTab";
import { rememberSource } from "@/lib/challengeTools";
import type { Gender } from "@/lib/challengeTools";
import { firstNameOf, guessGender, usableName } from "@/lib/hebrewNames";
import {
  finishLetter,
  hasCard,
  loadChat,
  loadLatestLetter,
  recordLetterEvent,
  resetMyLetter,
  saveChat,
  saveLetterEdit,
  sendChat,
} from "@/lib/challengeLetter";
import type { ChatMsg, LetterRow } from "@/lib/challengeLetter";

// The second challenge tool (day 2): a conversation with Neri that turns yesterday's card (or a fresh start from one
// person) into "the four lines" (the moment, what lies beneath, the change, the belief) and a personal letter to one
// person, then sums the day up: the four lines, the letter, one "אני עוזר/ת ל…" sentence, three of the client's own
// words and the task for day 3. The opening message is written here (never by the model) and, like every question,
// reads the same to anyone: the therapist is never asked for their gender. Link sent as homework (?src=hw2).

const ELIANA_WHATSAPP = "972523379716";

const opening = (name: string, withCard: boolean) =>
  [
    `שלום${name ? ` ${name}` : ""}, אני נרי.`,
    withCard ? "אתמול כתבת את כרטיס הביקור שלך. היום נכתוב מכתב למטופל או המטופלת שהיית הכי רוצה לעבוד איתו ולעזור לו. מכתב שכשהוא יקרא אותו, ירגיש שמדברים בדיוק עליו: שמכירים אותו ומבינים מה עובר עליו, ולכן גם יכולים לעזור לו." : "היום נכתוב מכתב למטופל או המטופלת שהיית הכי רוצה לעבוד איתו ולעזור לו. מכתב שכשהוא יקרא אותו, ירגיש שמדברים בדיוק עליו: שמכירים אותו ומבינים מה עובר עליו, ולכן גם יכולים לעזור לו.",
    "נתחיל מארבע שורות קצרות שמתארות את העבודה שלך, ומהן נבנה את המכתב.",
    withCard
      ? "על מי נכתוב? על האדם שתיארת אתמול בכרטיס, או על מישהו אחר?"
      : "על מי נכתוב? כדאי לחשוב על אדם אחד מסוים, אמיתי או כזה שמורכב מכמה אנשים, בלי שם ובלי פרטים מזהים: בן כמה הוא, מה הוא עושה בחיים, מאיזה רקע הוא בא, ומה קורה לו עכשיו שבגללו הוא פונה אליך.",
  ].join("\n\n");

const START_CHOICES = ["על האדם מהכרטיס", "על מישהו אחר"];

// Neri writes plain text with an occasional **bold**; nothing else is interpreted.
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {para.split(/(\*\*[^*]+\*\*)/g).map((part, k) =>
            part.startsWith("**") && part.endsWith("**") ? <strong key={k}>{part.slice(2, -2)}</strong> : <Fragment key={k}>{part}</Fragment>,
          )}
        </p>
      ))}
    </div>
  );
}

function UserBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-start ps-10 sm:ps-16">
      <div className="ms-auto max-w-full rounded-2xl rounded-tl-sm bg-primary/10 px-4 py-3 leading-relaxed text-foreground whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function CopyButton({ text, label, onCopied }: { text: string; label: string; onCopied?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard
          .writeText(text)
          .then(() => {
            setDone(true);
            onCopied?.();
            setTimeout(() => setDone(false), 1800);
          })
          .catch(() => toast.error("ההעתקה לא הצליחה. אפשר לסמן את הטקסט ולהעתיק."));
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-mentor-border bg-card px-3 py-1.5 text-sm hover:bg-mentor-surface"
    >
      {done ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      {done ? "הועתק" : label}
    </button>
  );
}

// ------------------------------------------------------------------------------------------------ result
function LetterResult({ row, onBackToChat }: { row: LetterRow; onBackToChat: (() => void) | null }) {
  const { content } = row;
  const [letter, setLetter] = useState(row.edited_content?.letter ?? content.letter);
  const lastSaved = useRef(letter);
  const editedLogged = useRef(false);

  useEffect(() => {
    void recordLetterEvent("viewed", row.id);
  }, [row.id]);

  useEffect(() => {
    if (letter === lastSaved.current) return;
    const t = setTimeout(() => {
      saveLetterEdit(row.id, { letter })
        .then(() => {
          lastSaved.current = letter;
          if (!editedLogged.current) {
            editedLogged.current = true;
            void recordLetterEvent("edited", row.id);
          }
        })
        .catch(() => toast.error("השינוי לא נשמר. נסו שוב בעוד רגע."));
    }, 900);
    return () => clearTimeout(t);
  }, [letter, row.id]);

  const fourText = content.four_lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
  const waText = `היי אליענה, כתבתי את המכתב האישי באתגר ואשמח לפידבק ממך:\n\n${letter}`;
  const waHref = `https://wa.me/${ELIANA_WHATSAPP}?text=${encodeURIComponent(waText)}`;
  const copied = () => void recordLetterEvent("copied", row.id);
  const [pdfBusy, setPdfBusy] = useState(false);
  const downloadLetterPdf = async () => {
    setPdfBusy(true);
    try {
      await downloadPdf(<LetterPdfDocument letter={letter} />, PAGE_W, "personal-letter.pdf");
      void recordLetterEvent("downloaded", row.id);
      trackEvent("challenge_letter_downloaded", {});
    } catch {
      toast.error("ההורדה לא הצליחה. נסו שוב בעוד רגע.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="text-sm font-medium text-primary">יום 2 · התוצרים שלך</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: SERIF }}>
          המכתב שלך
        </h1>
      </div>

      <section className="rounded-2xl border border-mentor-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold" style={{ fontFamily: SERIF }}>
            המכתב האישי
          </h2>
          <CopyButton text={letter} label="העתקת המכתב" onCopied={copied} />
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          {content.reader ? `למי: ${content.reader}. ` : ""}זו טיוטה, ואפשר לתקן כאן ישירות. מה שנכתב נשמר.
        </p>
        <textarea
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
          dir="rtl"
          rows={Math.min(24, Math.max(10, letter.split("\n").length + 6))}
          className="w-full resize-y rounded-xl border border-mentor-border bg-mentor-bg/40 p-4 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontFamily: SERIF }}
        />
        <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => void downloadLetterPdf()}
          disabled={pdfBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          <FileDown className="h-5 w-5" />
          {pdfBusy ? "מכינה את הקובץ…" : "הורדת המכתב כ־PDF"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            trackEvent("challenge_letter_whatsapp_click", {});
            logToolStep("whatsapp_click", LETTER_TOOL);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 font-semibold text-white shadow-sm hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
          שליחת המכתב לאליענה לפידבק
        </a>
        </div>
      </section>

      <section className="rounded-2xl border border-mentor-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold" style={{ fontFamily: SERIF }}>
              ארבע השורות
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">תיאור קצר של העבודה שלך, שקל לחזור עליו ולספר עליו הלאה.</p>
          </div>
          <CopyButton text={fourText} label="העתקה" onCopied={copied} />
        </div>
        <ol className="space-y-3">
          {content.four_lines.map((l, i) => (
            <li key={i} className="flex gap-3 leading-relaxed">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
              <span className="text-lg">{l}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-mentor-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">המשפט שלך, בשפת הלקוח</p>
          <p className="mt-2 text-lg leading-relaxed" style={{ fontFamily: SERIF }}>
            {content.sentence}
          </p>
          <div className="mt-3">
            <CopyButton text={content.sentence} label="העתקה" onCopied={copied} />
          </div>
        </div>
        <div className="rounded-2xl border border-mentor-border bg-card p-5">
          <p className="text-sm font-medium text-muted-foreground">מילים של הלקוח, להשתמש בהן שוב ושוב</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {content.client_words.map((w) => (
              <span key={w} className="rounded-full border border-mentor-accent/50 bg-mentor-accent/10 px-3 py-1.5">
                “{w}”
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-mentor-accent/40 bg-mentor-accent/5 p-5">
        <p className="text-base font-semibold">הבדיקה החשובה ביותר</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          כדאי לשלוח את המכתב או את ארבע השורות לאדם אחד מהקהל שלך ולשאול: “איך היית מספר עליי למישהו?” התשובה תראה בדיוק מה עבר ומה לא, ושום טיוטה
          לא מחליפה אותה.
        </p>
        <p className="mt-4 text-base font-semibold">מחר, יום 3</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          לקחת את המכתב או את ארבע השורות ולהקליט 30 שניות, או לכתוב פוסט קצר.
        </p>
      </div>

      {onBackToChat && (
        <button onClick={onBackToChat} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
          <MessagesSquare className="h-3.5 w-3.5" />
          חזרה לשיחה עם נרי
        </button>
      )}

      <MoreMentorTools afterTool="note" onClick={() => trackEvent("challenge_letter_mentor_click", {})} />
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ chat
function LetterChat({
  messages,
  draft,
  pending,
  finishing,
  onSend,
  onFinish,
  onRestart,
  showChoices,
}: {
  messages: ChatMsg[];
  draft: boolean;
  pending: boolean;
  finishing: boolean;
  onSend: (text: string) => Promise<boolean>;
  onFinish: () => void;
  onRestart: () => void;
  showChoices: boolean;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (messages.length <= 1) return;
    }
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending]);

  const send = (t: string) => {
    const v = t.trim();
    if (!v || pending) return;
    setText("");
    void onSend(v).then((ok) => {
      if (!ok) setText((cur) => cur || v); // not answered: the words come back into the box
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-primary">כלי 2 · יום 2 באתגר</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl" style={{ fontFamily: SERIF }}>
          מכתב לאדם אחד
        </h1>
      </div>

      <div className="space-y-5">
        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <NeriBubble key={i} name={i === 0 || messages[i - 1]?.role !== "assistant"}>
              <RichText text={m.content} />
            </NeriBubble>
          ) : (
            <UserBubble key={i}>{m.content}</UserBubble>
          ),
        )}
        {pending && (
          <NeriBubble name={false}>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
            </span>
          </NeriBubble>
        )}
        {showChoices && !pending && (
          <div className="flex flex-wrap gap-2 ps-16">
            {START_CHOICES.map((c) => (
              <button
                key={c}
                onClick={() => send(c)}
                className="rounded-full border border-primary/40 bg-card px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {draft && (
        <div className="mt-8 rounded-2xl border border-mentor-accent/50 bg-mentor-accent/5 p-4 text-center">
          <p className="text-sm text-muted-foreground">אפשר להמשיך לדייק עם נרי. כשהמכתב מרגיש נכון:</p>
          <button
            onClick={onFinish}
            disabled={finishing || pending}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            {finishing ? "מסכמת את התוצרים…" : "לסכם את התוצרים של היום"}
          </button>
        </div>
      )}

      {/* While the two starting choices are on screen there is nothing to type yet. */}
      {!showChoices && (
      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-mentor-bg via-mentor-bg to-transparent pb-4 pt-4">
        <div className="flex items-end gap-2 rounded-2xl border border-mentor-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
                e.preventDefault();
                send(text);
              }
            }}
            rows={Math.min(8, Math.max(2, text.split("\n").length))}
            placeholder="התשובה שלך…"
            dir="rtl"
            className="min-h-[3rem] flex-1 resize-none bg-transparent px-2 py-1.5 leading-relaxed focus:outline-none"
          />
          <button
            onClick={() => send(text)}
            disabled={pending || !text.trim()}
            aria-label="שליחה"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>בלי שמות ופרטים מזהים של מטופלים.</span>
          {messages.length > 1 && (
            <button onClick={onRestart} className="inline-flex items-center gap-1 hover:underline">
              <RotateCcw className="h-3 w-3" />
              להתחיל שיחה חדשה
            </button>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ page
const ChallengeLetter = () => {
  useChallengeToolFonts();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const source = useMemo(() => rememberSource(window.location.search), []);
  const isAdmin = useShowExpertsTab();

  const accountName = usableName((user?.user_metadata as { full_name?: string } | undefined)?.full_name);
  const firstName = firstNameOf(accountName);
  const gender: Gender = useMemo(() => guessGender(accountName) ?? "n", [accountName]);

  const card = useQuery({ queryKey: ["challenge-card-exists", user?.id], enabled: !!user, retry: false, queryFn: hasCard });
  const latest = useQuery({ queryKey: ["challenge-letter", user?.id], enabled: !!user, staleTime: 0, retry: false, queryFn: loadLatestLetter });

  const [messages, setMessages] = useState<ChatMsg[] | null>(null);
  const [draft, setDraft] = useState(false);
  const [pending, setPending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [row, setRow] = useState<LetterRow | null>(null);
  const [mode, setMode] = useState<"chat" | "result" | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!authLoading) logToolStep(user ? "landed_signed_in" : "landed_signed_out", LETTER_TOOL);
  }, [authLoading, user]);

  // First load: a conversation in progress on this browser is restored; otherwise a saved result is shown; otherwise
  // a new conversation starts with the opening message.
  useEffect(() => {
    if (mode !== null || !user || card.isLoading || latest.isLoading) return;
    const saved = loadChat(user.id);
    const fresh = [{ role: "assistant" as const, content: opening(firstName, !!card.data) }];
    setMessages(saved?.messages?.length ? saved.messages : fresh);
    setDraft(!!saved?.draft);
    if (latest.data) {
      setRow(latest.data);
      setMode("result");
    } else {
      setMode("chat");
    }
  }, [mode, user, card.isLoading, card.data, latest.isLoading, latest.data, firstName]);

  useEffect(() => {
    if (mode === "chat") logToolStep("questions_shown", LETTER_TOOL);
  }, [mode]);

  useEffect(() => {
    if (user && messages && messages.length > 1) saveChat(user.id, { messages, draft });
  }, [user, messages, draft]);

  if (!authLoading && !user) return <Navigate to="/auth?next=challenge-letter&mode=signup" replace />;

  const send = async (textIn: string): Promise<boolean> => {
    if (!messages || pending) return false;
    const next = [...messages, { role: "user" as const, content: textIn }];
    setMessages(next);
    setPending(true);
    if (next.filter((m) => m.role === "user").length === 1) {
      logToolStep("chat_started", LETTER_TOOL);
      trackEvent("challenge_letter_started", source ? { src: source } : {});
    }
    const res = await sendChat(next, gender, firstName);
    setPending(false);
    if (res.status === "ok") {
      setMessages([...next, { role: "assistant", content: res.reply }]);
      if (res.draft && !draft) {
        setDraft(true);
        logToolStep("draft_written", LETTER_TOOL);
      }
      return true;
    }
    // Not answered: the message is taken out of the conversation and its words go back into the box.
    setMessages(messages);
    toast.error(res.status === "limit" ? "הגעת למספר ההודעות המקסימלי להיום. אפשר להמשיך מחר." : "נרי לא הצליחה לענות עכשיו. אפשר לשלוח שוב בעוד רגע.");
    return false;
  };

  const finish = async () => {
    if (!messages) return;
    setFinishing(true);
    const res = await finishLetter(messages, gender, source);
    setFinishing(false);
    if (res.status === "ok") {
      trackEvent("challenge_letter_finished", source ? { src: source } : {});
      logToolStep("tool_done", LETTER_TOOL);
      setRow(res.row);
      queryClient.setQueryData(["challenge-letter", user?.id], res.row);
      setMode("result");
      window.scrollTo({ top: 0 });
      return;
    }
    toast.error(
      res.status === "no_letter"
        ? "עוד לא נכתב מכתב בשיחה. כדאי להמשיך עם נרי עד שהיא כותבת את הטיוטה."
        : res.status === "limit"
          ? "הגעת למספר הסיכומים המקסימלי להיום. אפשר לחזור מחר."
          : "לא הצלחנו לסכם עכשיו. נסו שוב בעוד רגע.",
    );
  };

  const restart = () => {
    if (!user) return;
    if (!window.confirm("להתחיל שיחה חדשה? השיחה הנוכחית תימחק מהמסך (תוצרים שכבר סוכמו נשמרים).")) return;
    saveChat(user.id, null);
    setMessages([{ role: "assistant", content: opening(firstName, !!card.data) }]);
    setDraft(false);
    void recordLetterEvent("regenerated", row?.id ?? null);
    setMode("chat");
    window.scrollTo({ top: 0 });
  };

  const adminReset = async () => {
    if (!user || !window.confirm("למחוק את כל מה שנכתב בתרגיל הזה בחשבון שלך (התוצרים והשיחה) ולהתחיל מההתחלה? אי אפשר לשחזר.")) return;
    setResetting(true);
    const ok = await resetMyLetter();
    setResetting(false);
    if (!ok) {
      toast.error("המחיקה לא הצליחה. נסו שוב בעוד רגע.");
      return;
    }
    saveChat(user.id, null);
    queryClient.setQueryData(["challenge-letter", user.id], null);
    setRow(null);
    setMessages([{ role: "assistant", content: opening(firstName, !!card.data) }]);
    setDraft(false);
    setMode("chat");
    window.scrollTo({ top: 0 });
    toast.success("התרגיל נמחק. אפשר להתחיל מחדש.");
  };

  const userTurns = messages?.filter((m) => m.role === "user").length ?? 0;

  return (
    <div dir="rtl" className="min-h-screen bg-mentor-bg pb-10 font-body text-foreground">
      <SEOHead title="מכתב לאדם אחד" description="כלי מתוך האתגר" canonicalUrl="/challenge-tools/letter" noindex />
      <div className="mx-auto max-w-3xl px-4 pt-8">
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

        {mode === "chat" && messages && (
          <LetterChat
            messages={messages}
            draft={draft}
            pending={pending}
            finishing={finishing}
            onSend={send}
            onFinish={() => void finish()}
            onRestart={restart}
            showChoices={!!card.data && userTurns === 0}
          />
        )}

        {mode === "result" && row && (
          <>
            <LetterResult key={row.id} row={row} onBackToChat={messages && messages.length > 1 ? () => setMode("chat") : null} />
            <div className="mt-6 text-center">
              <button onClick={restart} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-2 hover:underline">
                <RotateCcw className="h-3.5 w-3.5" />
                לכתוב מכתב חדש, לאדם אחר
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChallengeLetter;
