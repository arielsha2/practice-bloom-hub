import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Download, Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";

// Shared pieces of the challenge tools: the guided one-question-at-a-time flow, the scaled document
// preview, the download buttons. Used by the preview page and by the real tool pages.

export const SERIF = "'Frank Ruhl Libre', 'Miriam Libre', serif";

export interface QDef {
  label: string;
  hint: string;
  sample?: string;
  before?: ReactNode; // an instruction that comes BEFORE the question
  example?: string; // a concrete example, so the question is not too general
  custom?: ReactNode; // replaces the text box (e.g. marking words)
}

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Scales a fixed-size document to the width available, so a real A4 page can be previewed.
export function ScaledBox({ baseWidth, baseHeight, children }: { baseWidth: number; baseHeight: number; children: ReactNode }) {
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

export function NeriLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <img src="/images/neri-avatar.png" alt="" className="h-9 w-9 shrink-0 rounded-full border border-mentor-border object-cover" />
      <p className="pt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange }: { value: T | null; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
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
export function Guided({
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
  showSamples = true,
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
  // May be async: while it runs the "writing" screen stays. Returning false (or throwing) brings the therapist back to the last question.
  onFinish: () => void | boolean | Promise<void | boolean>;
  showSamples?: boolean;
}) {
  const [i, setI] = useState(-1);
  const [nudged, setNudged] = useState(false);
  const [writing, setWriting] = useState(false);

  const finish = async () => {
    setWriting(true);
    const minimum = new Promise((resolve) => setTimeout(resolve, 1200));
    let ok: void | boolean = true;
    try {
      ok = await onFinish();
    } catch {
      ok = false;
    }
    await minimum;
    if (ok === false) setWriting(false);
  };

  const next = () => {
    const q = questions[i];
    const a = answers[i] ?? "";
    if (!q.custom && wordCount(a) < 7 && !nudged) {
      setNudged(true);
      return;
    }
    setNudged(false);
    if (i === questions.length - 1) {
      void finish();
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
        {!q.custom && showSamples && (
          <button
            onClick={() => {
              const filled = [...answers];
              filled[i] = q.sample ?? "";
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

export function DownloadButtons({ onPdf, onPng, pngLabel }: { onPdf: () => Promise<void>; onPng: () => Promise<void>; pngLabel: string }) {
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

// The serif and handwriting faces of the documents; loaded once, only on the pages that need them.
export function useChallengeToolFonts() {
  useEffect(() => {
    const id = "challenge-tools-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Gveret+Levin&display=swap";
    document.head.appendChild(l);
  }, []);
}
