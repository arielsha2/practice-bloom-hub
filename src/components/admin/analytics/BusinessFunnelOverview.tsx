import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFunnelOverview, estimateRevenue, type FunnelOverview } from '@/hooks/useFunnelOverview';
import type { AnalyticsPeriod } from '@/hooks/useAdminAnalytics';
import { PurchasesCard } from './PurchasesCard';
import { DiagnosisScoresCard } from './DiagnosisScoresCard';
import { SilentSignupsCard } from './SilentSignupsCard';

const PERIOD_LABEL: Record<AnalyticsPeriod, string> = { '1d': 'היום האחרון', '7d': '7 הימים האחרונים', '30d': '30 הימים האחרונים', '90d': 'הרבעון האחרון' };

const nf = new Intl.NumberFormat('he-IL');

function Delta({ cur, prev, suffix }: { cur: number; prev: number | null; suffix?: string }) {
  if (prev === null || (prev === 0 && cur === 0)) return <span className="text-xs text-muted-foreground">אין נתון להשוואה</span>;
  if (prev === 0) return <span className="text-xs text-muted-foreground">חדש (בתקופה הקודמת: 0)</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  const color = pct > 0 ? 'text-emerald-700' : pct < 0 ? 'text-red-700' : 'text-muted-foreground';
  return (
    <span className={`text-xs ${color}`}>
      {pct > 0 ? '+' : ''}
      {pct}% לעומת התקופה הקודמת ({nf.format(prev)}) {suffix}
    </span>
  );
}

function Kpi({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-3xl font-semibold text-foreground">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        {delta}
      </CardContent>
    </Card>
  );
}

const pctOf = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : '—');

function KpiRow({ cur, prev }: { cur: FunnelOverview; prev: FunnelOverview | null }) {
  const rev = estimateRevenue(cur.purchases);
  const revPrev = prev ? estimateRevenue(prev.purchases) : null;
  const revenueText = [rev.ils ? `₪${nf.format(rev.ils)}` : '', rev.usd ? `$${nf.format(rev.usd)}` : ''].filter(Boolean).join(' + ') || '₪0';
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <Kpi label="הרשמות חדשות" value={nf.format(cur.signups)} sub="גם הצטרפות לרשימת התפוצה" delta={<Delta cur={cur.signups} prev={prev ? prev.signups : null} />} />
      <Kpi
        label="התחילו אבחון"
        value={nf.format(cur.started)}
        sub={`${pctOf(cur.started, cur.signups)} ביחס להרשמות`}
        delta={<Delta cur={cur.started} prev={prev ? prev.started : null} />}
      />
      <Kpi
        label="הגיעו לתוצאה"
        value={nf.format(cur.reached_stage.s4)}
        sub={`${pctOf(cur.reached_stage.s4, cur.started)} ממי שהתחיל`}
        delta={<Delta cur={cur.reached_stage.s4} prev={prev ? prev.reached_stage.s4 : null} />}
      />
      <Kpi
        label="לחצו על רכישה"
        value={nf.format(cur.clicked)}
        sub={`${pctOf(cur.clicked, cur.reached_stage.s4)} ממי שהגיע לתוצאה`}
        delta={<Delta cur={cur.clicked} prev={prev ? prev.clicked : null} />}
      />
      <Kpi
        label="רכישות"
        value={nf.format(cur.purchases.buyers)}
        sub="לקוחות ייחודיים (כלי בודד או מסלול מלא)"
        delta={<Delta cur={cur.purchases.buyers} prev={prev ? prev.purchases.buyers : null} />}
      />
      <Kpi
        label="הכנסה משוערת"
        value={revenueText}
        sub={rev.unpricedFull ? `+${rev.unpricedFull} מסלול מלא ללא מטבע ידוע` : 'לפי מחירון'}
        delta={revPrev ? <Delta cur={rev.ils} prev={revPrev.ils} suffix="(בשקלים בלבד)" /> : undefined}
      />
    </div>
  );
}

function FunnelBars({ cur }: { cur: FunnelOverview }) {
  const stages: Array<{ label: string; n: number; hint?: string }> = [
    { label: 'התחילו שיחת אבחון', n: cur.started },
    { label: 'עברו את שלב הפתיחה', n: cur.reached_stage.s2, hint: 'קיבלו לפחות שאלה אחת בשלב החקירה' },
    { label: 'הגיעו לשלב האבחון', n: cur.reached_stage.s3 },
    { label: 'הגיעו לתוצאה והמלצה', n: cur.reached_stage.s4 },
    { label: 'נשמר להם דו״ח', n: cur.got_report },
    { label: 'לחצו על כפתור רכישה', n: cur.clicked },
    { label: 'רכשו', n: cur.purchases.buyers, hint: 'לא בהכרח מתוך הלוחצים: אפשר לקנות גם בלי ללחוץ על הכפתור' },
  ];
  const top = Math.max(stages[0].n, 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">משפך מהתחלת האבחון ועד רכישה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((s, i) => {
          const prev = i === 0 ? null : stages[i - 1].n;
          return (
            <div key={s.label} className="space-y-1" title={s.hint}>
              <div className="flex items-baseline justify-between text-sm">
                <span>{s.label}</span>
                <span className="tabular-nums">
                  <span className="font-semibold">{nf.format(s.n)}</span>
                  <span className="text-xs text-muted-foreground mr-2">
                    {i === 0 ? '' : s.label === 'רכשו' ? 'נספר לפי תאריך הרכישה' : `${pctOf(s.n, prev ?? 0)} מהשלב הקודם`}
                  </span>
                </span>
              </div>
              <div className="h-2 rounded bg-muted overflow-hidden" dir="ltr">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (s.n / top) * 100)}%` }} />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-2">
          כל שלב סופר אנשים ייחודיים שפעלו בתקופה שנבחרה. מי שנרשם לפני התקופה והתחיל בה נספר, ולכן אחוז המעבר מדויק בעיקר בתקופות ארוכות. רכישות נספרות לפי תאריך הרכישה, גם אם האבחון נעשה קודם.
        </p>
      </CardContent>
    </Card>
  );
}

export function BusinessFunnelOverview({ period }: { period: AnalyticsPeriod }) {
  const { current, previous, loading, error, reload } = useFunnelOverview(period);

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-serif font-semibold text-foreground">מצב העסק: משפך לרכישה</h2>
          <p className="text-xs text-muted-foreground mt-1">{PERIOD_LABEL[period]}, בהשוואה לתקופה שלפניה</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void reload()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
          רענן
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4 text-sm text-destructive space-y-1">
            <div>לא ניתן לטעון את נתוני המשפך: {error}</div>
            <div className="text-xs text-muted-foreground">
              אם ההודעה מזכירה שהפונקציה admin_funnel_overview לא קיימת, צריך להריץ את המיגרציה 20261011190000_admin_funnel_overview.sql על מסד הנתונים.
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !current && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}

      {current && (
        <>
          <KpiRow cur={current} prev={previous} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FunnelBars cur={current} />
            <PurchasesCard data={current} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DiagnosisScoresCard data={current} />
            <SilentSignupsCard data={current} />
          </div>
        </>
      )}
    </section>
  );
}
