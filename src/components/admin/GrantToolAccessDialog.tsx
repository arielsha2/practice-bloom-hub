import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// The six Mentor tools that can be granted one by one (the free diagnosis is open to everyone).
const TOOLS: Array<{ key: string; label: string }> = [
  { key: 'niche-finder', label: 'מציאת הנישה' },
  { key: 'pricing-calculator', label: 'מחשבון התמחור' },
  { key: 'self-presentation', label: 'הצגה עצמית' },
  { key: 'contact-finder', label: 'מציאת אנשי קשר להפניות' },
  { key: 'connection-bridge', label: 'גשר הקשר' },
  { key: 'first-call-practice', label: 'תרגול שיחת הטלפון הראשונה' },
];

const SOURCE_LABELS: Record<string, string> = {
  grow_single_tool: 'נרכש (Grow)',
  paypal_single_tool: 'נרכש (PayPal)',
  manual_admin: 'הוענק ידנית',
};

const ERROR_LABELS: Record<string, string> = {
  forbidden: 'אין הרשאת מנהל',
  unauthorized: 'ההתחברות פגה, צריך להתחבר מחדש',
  user_not_found: 'המשתמש לא נמצא',
  invalid_bot_keys: 'בחירת כלים לא תקינה',
  internal: 'שגיאה בשרת',
};

interface Grant { bot_key: string; source: string; granted_at: string }

interface Props {
  user: { id: string; email: string | null; display_name: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function callGrantFunction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('admin-grant-tool-access', { body });
  if (error) {
    // supabase-js hides the JSON error body of a non-2xx response inside error.context
    let code = '';
    try {
      const payload = await (error as unknown as { context?: Response }).context?.json();
      code = payload?.error ?? '';
    } catch { /* keep the generic message */ }
    throw new Error(ERROR_LABELS[code] ?? code ?? error.message);
  }
  if (data?.error) throw new Error(ERROR_LABELS[data.error] ?? data.error);
  return data;
}

export function GrantToolAccessDialog({ user, open, onOpenChange }: Props) {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoadError(null);
    try {
      const data = await callGrantFunction({ action: 'list', user_id: user.id });
      setGrants(data.grants as Grant[]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'שגיאה בטעינה');
    }
  }, [user]);

  useEffect(() => {
    if (open && user) {
      setGrants(null);
      setSelected(new Set());
      setSendEmail(true);
      void load();
    }
  }, [open, user, load]);

  const owned = new Set((grants ?? []).map((g) => g.bot_key));
  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const grant = async () => {
    if (!user || selected.size === 0) return;
    setBusy(true);
    try {
      const data = await callGrantFunction({ action: 'grant', user_id: user.id, bot_keys: [...selected], send_email: sendEmail });
      const n = (data.granted as string[]).length;
      let msg = n === 0 ? 'לא נוסף דבר: כל הכלים שנבחרו כבר היו אצלו' : `הוענקו ${n} כלים`;
      if (data.email?.requested) msg += data.email.sent ? '. אימייל אישור נשלח.' : `. הגישה ניתנה אבל האימייל לא נשלח (${data.email.error}).`;
      if (data.email?.requested && !data.email.sent) toast.warning(msg);
      else toast.success(msg);
      setSelected(new Set());
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ההענקה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (key: string, label: string) => {
    if (!user) return;
    if (!window.confirm(`להסיר את הגישה לכלי "${label}" מ-${user.email ?? 'המשתמש'}?`)) return;
    setBusy(true);
    try {
      await callGrantFunction({ action: 'revoke', user_id: user.id, bot_key: key });
      toast.success('הגישה הוסרה');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'ההסרה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const labelOf = (key: string) => TOOLS.find((t) => t.key === key)?.label ?? key;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הענקת גישה לכלים</DialogTitle>
          <DialogDescription className="text-right">
            <span dir="ltr">{user?.email ?? '—'}</span>
            {user?.display_name ? ` · ${user.display_name}` : ''}
          </DialogDescription>
        </DialogHeader>

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {!grants && !loadError && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {grants && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">הכלים שיש לו כבר</div>
              {grants.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין הענקות של כלים בודדים. (מנוי מלא פותח את כל הכלים בנפרד, מעמודת "התנסות חינם".)</p>
              ) : (
                <div className="space-y-1.5">
                  {grants.map((g) => (
                    <div key={g.bot_key} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {labelOf(g.bot_key)}
                        <span className="text-xs text-muted-foreground">
                          {SOURCE_LABELS[g.source] ?? g.source}, {new Date(g.granted_at).toLocaleDateString('he-IL')}
                        </span>
                      </span>
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void revoke(g.bot_key, labelOf(g.bot_key))} className="text-destructive hover:text-destructive h-7 px-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">להעניק גישה ל:</div>
              <div className="space-y-2">
                {TOOLS.map((t) => {
                  const has = owned.has(t.key);
                  return (
                    <label key={t.key} className={`flex items-center gap-2 text-sm ${has ? 'opacity-50' : 'cursor-pointer'}`}>
                      <Checkbox checked={has || selected.has(t.key)} disabled={has || busy} onCheckedChange={() => toggle(t.key)} />
                      {t.label}
                      {has && <span className="text-xs text-muted-foreground">(כבר יש)</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer rounded-md border p-2.5 bg-muted/30">
              <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} className="mt-0.5" />
              <span>
                לשלוח לו אימייל אישור עם הקישור לכלים
                <span className="block text-xs text-muted-foreground">
                  נשלח לכתובת שבפרופיל. האימייל כולל רק כלים שהוענקו עכשיו, לא כאלה שכבר היו אצלו.
                </span>
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            סגירה
          </Button>
          <Button onClick={() => void grant()} disabled={busy || selected.size === 0}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
            {selected.size > 0 ? `הענק ${selected.size} ${selected.size === 1 ? 'כלי' : 'כלים'}` : 'בחר כלים'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
