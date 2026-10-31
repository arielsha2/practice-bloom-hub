import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Copy, Download, FolderHeart, Loader2, Pencil, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DELIVERABLE_TOOLS,
  type ContactContent,
  type Deliverable,
  type DeliverableContent,
  type DeliverableTool,
  type MissingField,
  type NicheContent,
  deliverableToText,
  generateDeliverable,
  recordDeliverableEvent,
  shownContent,
} from '@/lib/deliverables';

const TITLES: Record<DeliverableTool, { title: string; blurb: string; button: string }> = {
  'niche-finder': {
    title: 'משפט המיקוד שלך',
    blurb: 'שלוש גרסאות של משפט שאומר למי העבודה שלך מיועדת, בנוי ממה שסיפרת, וכותרת מוכנה לדף או לפרופיל.',
    button: 'הכן לי את משפט המיקוד',
  },
  'contact-finder': {
    title: 'הודעות למי שמפנה אליך',
    blurb: 'הודעה פותחת מוכנה לכל אחד משלושה סוגי מפנים, עם הודעת מעקב. אפשר לשלוח כבר היום.',
    button: 'הכן לי את ההודעות',
  },
};

function useDeliverables() {
  const { user } = useAuth();
  return useQuery<Partial<Record<DeliverableTool, Deliverable>>>({
    queryKey: ['deliverables', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('therapist_deliverables')
        .select('id, tool, version, content, edited_content, created_at')
        .order('version', { ascending: false });
      if (error) throw error;
      const latest: Partial<Record<DeliverableTool, Deliverable>> = {};
      for (const row of (data ?? []) as unknown as Deliverable[]) {
        if (!latest[row.tool]) latest[row.tool] = row;
      }
      return latest;
    },
  });
}

function CopyButton({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        onCopied();
        toast.success('הועתק');
        setTimeout(() => setDone(false), 1800);
      }}
      className="inline-flex items-center gap-1 text-xs text-mentor-accent hover:underline shrink-0"
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {done ? 'הועתק' : 'העתק'}
    </button>
  );
}

function Editable({ value, editing, onChange, rows = 2 }: { value: string; editing: boolean; onChange: (v: string) => void; rows?: number }) {
  if (!editing) return <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{value}</p>;
  return <Textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)} className="text-sm" />;
}

function DeliverableBody({
  tool,
  content,
  editing,
  setContent,
  onCopied,
}: {
  tool: DeliverableTool;
  content: DeliverableContent;
  editing: boolean;
  setContent: (c: DeliverableContent) => void;
  onCopied: () => void;
}) {
  if (tool === 'niche-finder') {
    const c = content as NicheContent;
    return (
      <div className="space-y-3">
        {c.focus_sentences.map((s, i) => (
          <div key={i} className="rounded-xl bg-background border border-mentor-border/50 p-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs text-muted-foreground">גרסה {i + 1}</span>
              <CopyButton text={s} onCopied={onCopied} />
            </div>
            <Editable
              value={s}
              editing={editing}
              onChange={(v) => setContent({ ...c, focus_sentences: c.focus_sentences.map((x, j) => (j === i ? v : x)) })}
            />
          </div>
        ))}
        <div className="rounded-xl bg-background border border-mentor-border/50 p-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs text-muted-foreground">כותרת לדף או לפרופיל</span>
            <CopyButton text={c.page_headline} onCopied={onCopied} />
          </div>
          <Editable value={c.page_headline} editing={editing} onChange={(v) => setContent({ ...c, page_headline: v })} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold">בדיקה קצרה:</span> אחרי שעמית קורא את המשפט, אפשר לשאול אותו: {c.test_with_colleague}
        </p>
      </div>
    );
  }
  const c = content as ContactContent;
  return (
    <div className="space-y-3">
      {c.referral_sources.map((r, i) => (
        <div key={i} className="rounded-xl bg-background border border-mentor-border/50 p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">{r.type}</span>
            <CopyButton text={r.message} onCopied={onCopied} />
          </div>
          <p className="text-xs text-muted-foreground">{r.why}</p>
          <Editable
            value={r.message}
            editing={editing}
            rows={4}
            onChange={(v) => setContent({ ...c, referral_sources: c.referral_sources.map((x, j) => (j === i ? { ...x, message: v } : x)) })}
          />
          <div className="flex items-start justify-between gap-3 pt-1 border-t border-mentor-border/30">
            <span className="text-xs text-muted-foreground">הודעת מעקב</span>
            <CopyButton text={r.followup} onCopied={onCopied} />
          </div>
          <Editable
            value={r.followup}
            editing={editing}
            onChange={(v) => setContent({ ...c, referral_sources: c.referral_sources.map((x, j) => (j === i ? { ...x, followup: v } : x)) })}
          />
        </div>
      ))}
    </div>
  );
}

function DeliverableBlock({ tool, deliverable }: { tool: DeliverableTool; deliverable?: Deliverable }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<MissingField[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeliverableContent | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const viewedRef = useRef<string | null>(null);
  const t = TITLES[tool];

  useEffect(() => {
    if (deliverable && viewedRef.current !== deliverable.id) {
      viewedRef.current = deliverable.id;
      void recordDeliverableEvent('viewed', tool, deliverable.id);
    }
  }, [deliverable, tool]);

  async function run(isRegeneration: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await generateDeliverable(tool, answers);
      if (res.status === 'ok') {
        setFields(null);
        setEditing(false);
        await qc.invalidateQueries({ queryKey: ['deliverables', user?.id] });
        if (isRegeneration) void recordDeliverableEvent('regenerated', tool, res.deliverable.id);
      } else if (res.status === 'needs_info') {
        setFields(res.fields);
      } else if (res.status === 'no_access') {
        setMessage('התוצרים נפתחים עם המנטור. אחרי הרכישה אפשר להכין אותם כאן.');
      } else if (res.status === 'limit') {
        setMessage('הגעת למספר הניסוחים היומי. אפשר לנסות שוב מחר.');
      } else {
        setMessage('לא הצלחנו לנסח עכשיו. אפשר לנסות שוב בעוד רגע.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!deliverable || !draft) return;
    const { error } = await supabase
      .from('therapist_deliverables')
      .update({ edited_content: draft as never, updated_at: new Date().toISOString() })
      .eq('id', deliverable.id);
    if (error) {
      toast.error('השמירה נכשלה');
      return;
    }
    setEditing(false);
    void recordDeliverableEvent('edited', tool, deliverable.id);
    await qc.invalidateQueries({ queryKey: ['deliverables', user?.id] });
    toast.success('נשמר');
  }

  function download() {
    if (!deliverable) return;
    const text = deliverableToText(tool, shownContent(deliverable));
    const url = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    void recordDeliverableEvent('downloaded', tool, deliverable.id);
  }

  return (
    <div className="rounded-2xl border border-mentor-border/60 bg-card p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-base font-serif font-semibold text-foreground">{t.title}</h3>
          {!deliverable && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.blurb}</p>}
        </div>
        {deliverable && (
          <div className="flex items-center gap-2 flex-wrap">
            {editing ? (
              <>
                <Button size="sm" onClick={saveEdit}>שמירה</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>ביטול</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setDraft(shownContent(deliverable)); setEditing(true); }}>
                  <Pencil className="w-3.5 h-3.5" />עריכה
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={download}>
                  <Download className="w-3.5 h-3.5" />הורדה
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" disabled={busy} onClick={() => run(true)}>
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}ניסוח מחדש
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {deliverable ? (
        <div className="mt-4">
          <DeliverableBody
            tool={tool}
            content={editing && draft ? draft : shownContent(deliverable)}
            editing={editing}
            setContent={setDraft as (c: DeliverableContent) => void}
            onCopied={() => void recordDeliverableEvent('copied', tool, deliverable.id)}
          />
          {deliverable.edited_content && !editing && <p className="text-xs text-muted-foreground mt-2">זו הגרסה שערכת. ניסוח מחדש יוצר גרסה חדשה ולא מוחק אותה.</p>}
        </div>
      ) : fields ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-foreground">כדי לנסח את זה בדיוק אצלך, חסר כמה פרטים:</p>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium text-foreground">{f.label}</label>
              <Textarea
                rows={2}
                className="mt-1 text-sm"
                placeholder={f.hint}
                value={answers[f.key] ?? ''}
                onChange={(e) => setAnswers({ ...answers, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <Button disabled={busy || fields.some((f) => !(answers[f.key] ?? '').trim())} onClick={() => run(false)} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}הכן
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button disabled={busy} onClick={() => run(false)} className="gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t.button}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">הכי מדויק אחרי שסיימת את הכלי המתאים במסע.</p>
        </div>
      )}

      {message && <p className="text-sm text-destructive mt-3">{message}</p>}
    </div>
  );
}

// "התיק שלי": the ready-to-use things the Mentor wrote from what the therapist said. A prominent card at the top of
// the Mentor page, so what they get from the journey is visible and one click away.
export function PortfolioCard() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const { data, isLoading } = useDeliverables();
  if (!user || !isRTL) return null;
  const count = DELIVERABLE_TOOLS.filter((t) => data?.[t]).length;

  return (
    <section dir="rtl" className="container mx-auto px-4 pb-4 max-w-6xl">
      <div className="rounded-2xl border-2 border-mentor-accent/40 bg-mentor-accent/5 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-full bg-mentor-accent/15 text-mentor-accent flex items-center justify-center shrink-0">
            <FolderHeart className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg md:text-xl font-serif font-semibold text-foreground">התיק שלי</h2>
            <p className="text-sm text-muted-foreground">
              {count > 0 ? `${count} מתוך 2 תוצרים מוכנים לשימוש` : 'דברים מוכנים לשימוש, שנכתבו ממה שסיפרת. אפשר להעתיק, לערוך ולשלוח.'}
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-mentor-accent" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 items-start">
            {DELIVERABLE_TOOLS.map((tool) => (
              <DeliverableBlock key={tool} tool={tool} deliverable={data?.[tool]} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
