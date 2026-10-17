import { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TOOLS: Array<{ key: string; label: string }> = [
  { key: 'niche-finder', label: 'מציאת הנישה' },
  { key: 'pricing-calculator', label: 'מחשבון התמחור' },
  { key: 'self-presentation', label: 'הצגה עצמית' },
  { key: 'contact-finder', label: 'מציאת אנשי קשר להפניות' },
  { key: 'connection-bridge', label: 'גשר הקשר' },
  { key: 'first-call-practice', label: 'תרגול שיחת הטלפון הראשונה' },
];
const labelOf = (key: string) => TOOLS.find((t) => t.key === key)?.label ?? key;

const ERROR_LABELS: Record<string, string> = {
  forbidden: 'אין הרשאת מנהל',
  unauthorized: 'ההתחברות פגה, צריך להתחבר מחדש',
  invalid_email: 'כתובת האימייל אינה תקינה',
  invalid_bot_keys: 'בחירת כלים לא תקינה',
  invalid_id: 'מזהה לא תקין',
  internal: 'שגיאה בשרת',
};

interface PendingGrant { id: string; email: string; bot_key: string; created_at: string; applied_at: string | null }

async function callFn(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-grant-tool-access', { body });
  if (error) {
    let code = '';
    try {
      code = (await (error as unknown as { context?: Response }).context?.json())?.error ?? '';
    } catch { /* keep the generic message */ }
    throw new Error(ERROR_LABELS[code] ?? code ?? error.message);
  }
  if (data?.error) throw new Error(ERROR_LABELS[data.error] ?? data.error);
  return data;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Grants tool access to an EMAIL, for someone who has not signed up yet: the grant waits and is applied by a
// database trigger the moment a profile with that email is created. If the email already has an account the
// access is granted right away (same as the per-user "grant tools" dialog).
export function PreGrantToolAccessDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingGrant[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setPending((await callFn({ action: 'pre_list' })).pending as PendingGrant[]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'שגיאה בטעינה');
    }
  }, []);

  useEffect(() => {
    if (open) {
      setEmail('');
      setSelected(new Set());
      setSendEmail(true);
      setPending(null);
      void load();
    }
  }, [open, load]);

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const grant = async () => {
    setBusy(true);
    try {
      const data = await callFn({ action: 'pre_grant', email: email.trim(), bot_keys: [...selected], send_email: sendEmail });
      const done = (data.mode === 'direct' ? data.granted : data.pending) as string[];
      let msg: string;
      if (done.length === 0) msg = 'לא נוסף דבר: הכלים שנבחרו כבר היו שמורים או קיימים אצלו';
      else if (data.mode === 'direct') msg = `לאימייל הזה כבר יש חשבון: הוענקו ${done.length} כלים מיד`;
      else msg = `נשמרו ${done.length} כלים. הם יופעלו כשיירשם עם ${email.trim().toLowerCase()}`;
      if (data.email?.requested) msg += data.email.sent ? '. נשלח אימייל.' : `. האימייל לא נשלח (${data.email.error}).`;
      if (data.email?.requested && !data.email.sent) toast.warning(msg);
      else toast.success(msg);
      setSelected(new Set());
      setEmail('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'השמירה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (g: PendingGrant) => {
    if (!window.confirm(`להסיר את "${labelOf(g.bot_key)}" שממתין ל-${g.email}?`)) return;
    setBusy(true);
    try {
      await callFn({ action: 'pre_revoke', id: g.id });
      toast.success('ההענקה הממתינה הוסרה');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ההסרה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const open_ = (pending ?? []).filter((g) => !g.applied_at);
  const applied = (pending ?? []).filter((g) => g.applied_at);
  // group the waiting grants by email so one person with three tools is one row
  const byEmail = open_.reduce<Record<string, PendingGrant[]>>((acc, g) => ((acc[g.email] ??= []).push(g), acc), {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הענקת כלים לפי אימייל</DialogTitle>
          <DialogDescription className="text-right">
            לאדם שעוד לא נרשם. ההענקה שמורה, ונפתחת מעצמה ברגע שיירשם עם האימייל הזה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">כתובת אימייל</label>
            <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" disabled={busy} />
          </div>

          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">להעניק גישה ל:</div>
            <div className="space-y-2">
              {TOOLS.map((t) => (
                <label key={t.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selected.has(t.key)} disabled={busy} onCheckedChange={() => toggle(t.key)} />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-2.5 bg-muted/30">
            <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} className="mt-0.5" />
            <span>
              לשלוח לו אימייל עם הסבר וקישור להרשמה
              <span className="block text-xs text-muted-foreground">
                האימייל אומר שהוענקה לו גישה ומבקש להירשם עם האימייל הזה. אם כבר יש לו חשבון, יישלח אישור רגיל עם קישור לכלים.
              </span>
            </span>
          </label>

          <div className="border-t pt-3 space-y-3">
            <div className="text-xs font-semibold text-muted-foreground">ממתינים להרשמה</div>
            {loadError && <p className="text-sm text-destructive">{loadError}</p>}
            {!pending && !loadError && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            {pending && Object.keys(byEmail).length === 0 && <p className="text-sm text-muted-foreground">אין הענקות שממתינות.</p>}
            {Object.entries(byEmail).map(([addr, grants]) => (
              <div key={addr} className="rounded-md border p-2.5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-sm" dir="ltr" style={{ justifyContent: 'flex-end' }}>
                  <span>{addr}</span>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                </div>
                {grants.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-sm">
                    <span>
                      {labelOf(g.bot_key)}
                      <span className="text-xs text-muted-foreground mr-2">{new Date(g.created_at).toLocaleDateString('he-IL')}</span>
                    </span>
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void revoke(g)} className="text-destructive hover:text-destructive h-7 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ))}
            {applied.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">הופעלו לאחרונה (נרשמו)</div>
                {applied.map((g) => (
                  <div key={g.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span dir="ltr">{g.email}</span>
                    <span>{labelOf(g.bot_key)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגירה
          </Button>
          <Button onClick={() => void grant()} disabled={busy || !emailLooksValid || selected.size === 0}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
            {selected.size > 0 ? `שמור ${selected.size} ${selected.size === 1 ? 'כלי' : 'כלים'}` : 'בחר כלים'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
