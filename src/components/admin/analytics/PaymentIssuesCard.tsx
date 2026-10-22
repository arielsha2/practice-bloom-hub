import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface PaymentEvent {
  id: string;
  created_at: string;
  provider: string;
  transaction_id: string | null;
  payer_email: string | null;
  tool: string | null;
  outcome: string;
  email_sent: boolean;
  email_error: string | null;
  resolved: boolean;
}

const TOOL_LABELS: Record<string, string> = {
  'niche-finder': 'מציאת הנישה',
  'pricing-calculator': 'מחשבון התמחור',
  'self-presentation': 'הצגה עצמית',
  'contact-finder': 'מציאת אנשי קשר להפניות',
  'connection-bridge': 'גשר הקשר',
  'first-call-practice': 'תרגול שיחת הטלפון הראשונה',
};

const OUTCOME_LABELS: Record<string, { label: string; hint: string }> = {
  no_profile: { label: 'שולם עם אימייל שאין לו חשבון', hint: 'אפשר ליצור קשר עם המשלם, לברר באיזה אימייל נרשם, ולהעניק לו את הכלי ידנית.' },
  no_recommendation: { label: 'אין לו אבחון שמור, לא ידוע איזה כלי להעניק', hint: 'צריך לברר איזה כלי מתאים ולהעניק אותו ידנית.' },
  unrecognized_amount: { label: 'סכום ששולם אינו תואם מחיר מוכר', hint: 'לבדוק ב-Grow או ב-PayPal מה נרכש. תשלום על מוצר אחר, כמו ליווי אישי, לא פותח גישה אוטומטית.' },
  no_email: { label: 'תשלום שהגיע בלי אימייל של המשלם', hint: 'לבדוק ב-Grow מי שילם ולהעניק ידנית. אם זה חוזר, שמות השדות בהודעה של Grow השתנו.' },
  renewed: { label: 'הגישה הוארכה, אך אימייל האישור לא נשלח', hint: 'הכלי פתוח למשתמש. אפשר לשלוח לו את הקישור ואת תאריך הסיום ידנית.' },
  upgraded: { label: 'הגישה הפכה לקבועה, אך אימייל האישור לא נשלח', hint: 'הכלי פתוח למשתמש. אפשר לשלוח לו את הקישור ידנית.' },
  grant_failed: { label: 'הענקת הגישה נכשלה', hint: 'לבדוק את הלוגים של פונקציית התשלום ולהעניק ידנית.' },
  granted: { label: 'הגישה ניתנה, אך אימייל האישור לא נשלח', hint: 'הכלי פתוח למשתמש. אפשר לשלוח לו את הקישור ידנית.' },
};

function isProblem(e: PaymentEvent): boolean {
  if (e.resolved) return false;
  if (e.outcome === 'already_had_tool') return false;
  if (e.outcome === 'granted' || e.outcome === 'renewed' || e.outcome === 'upgraded') return !e.email_sent;
  return true;
}

export function PaymentIssuesCard() {
  const [rows, setRows] = useState<PaymentEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('payment_grant_events')
      .select('id, created_at, provider, transaction_id, payer_email, tool, outcome, email_sent, email_error, resolved')
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) setError(err.message);
    else {
      setError(null);
      setRows((data ?? []) as PaymentEvent[]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markResolved = async (id: string) => {
    setBusyId(id);
    const { error: err } = await supabase
      .from('payment_grant_events')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', id);
    setBusyId(null);
    if (err) toast.error('העדכון נכשל');
    else await load();
  };

  const problems = (rows ?? []).filter(isProblem);
  const granted = (rows ?? []).filter((e) => e.outcome === 'granted').length;

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-base">תשלומים שדורשים טיפול</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-destructive">
            לא ניתן לטעון: {error}. אם הטבלה payment_grant_events לא קיימת, צריך להריץ את המיגרציה 20261017120000_payment_grant_events.sql.
          </p>
        )}
        {!rows && !error && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
        {rows && (
          <>
            <p className="text-sm">
              <span className="text-3xl font-semibold">{problems.length}</span>{' '}
              <span className="text-muted-foreground">
                {problems.length === 0 ? 'אין תשלומים שדורשים טיפול' : 'תשלומים ללא גישה מלאה'}
              </span>
            </p>
            {problems.map((e) => {
              const meta = OUTCOME_LABELS[e.outcome] ?? { label: e.outcome, hint: '' };
              return (
                <div key={e.id} className="rounded-md border p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{meta.label}</div>
                      <div className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: 'right' }}>
                        {e.payer_email ?? 'ללא אימייל'}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(e.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <Badge variant="outline">{e.provider === 'grow' ? 'Grow' : 'PayPal'}</Badge>
                    {e.tool && <Badge variant="outline">{TOOL_LABELS[e.tool] ?? e.tool}</Badge>}
                    {e.transaction_id && <span className="text-muted-foreground" dir="ltr">{e.transaction_id}</span>}
                  </div>
                  {meta.hint && <p className="text-xs text-muted-foreground">{meta.hint}</p>}
                  {e.email_error && <p className="text-xs text-destructive" dir="ltr" style={{ textAlign: 'right' }}>{e.email_error}</p>}
                  <Button size="sm" variant="outline" disabled={busyId === e.id} onClick={() => void markResolved(e.id)}>
                    {busyId === e.id ? 'מעדכן…' : 'סמן כטופל'}
                  </Button>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground">
              כל תשלום על כלי בודד (Grow או PayPal) נרשם כאן. {granted} מהאחרונים הסתיימו בהענקת גישה. תשלום על מסלול מלא לא נרשם כאן.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
