import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FunnelOverview } from '@/hooks/useFunnelOverview';

const AREA_LABELS: Record<string, string> = {
  'niche-finder': 'נישה ובידול',
  'pricing-calculator': 'תמחור',
  'self-presentation': 'הצגה עצמית',
  'contact-finder': 'רשת הפניות',
  'connection-bridge': 'גישור קשר',
  'first-call-practice': 'שיחת הטלפון הראשונה',
};

const BAND_META: Array<{ key: string; label: string; color: string }> = [
  { key: 'immediate', label: 'דורש טיפול מיידי (עד 3.9)', color: '#9e2b25' },
  { key: 'improve', label: 'דורש שיפור (4 עד 6.9)', color: '#a8661f' },
  { key: 'strong', label: 'חזק (7 ומעלה)', color: '#33704f' },
  { key: 'none', label: 'ללא ציון (מעט מדי מידע)', color: '#9a918a' },
];

const barColor = (v: number) => (v < 4 ? '#9e2b25' : v < 7 ? '#a8661f' : '#33704f');

export function DiagnosisScoresCard({ data }: { data: FunnelOverview }) {
  const s = data.scores;
  const total = s.count;
  const maxCentral = Math.max(1, ...s.central.map((c) => c.n));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">הציונים בדו״חות האבחון</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">עדיין אין דו״חות עם ציון בתקופה שנבחרה.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-semibold">{s.avg_overall ?? '—'}</div>
              <div className="text-xs text-muted-foreground">ציון כללי ממוצע (מתוך 10), {total} דו״חות</div>
            </div>

            <div className="space-y-1">
              {BAND_META.map((b) => {
                const n = s.bands[b.key] ?? 0;
                return (
                  <div key={b.key} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
                    <span className="flex-1">{b.label}</span>
                    <span className="tabular-nums font-semibold">{n}</span>
                  </div>
                );
              })}
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">ממוצע לפי תחום (רק דו״חות שבהם התחום דורג)</div>
              <div className="space-y-1.5">
                {s.areas.map((a) => (
                  <div key={a.area} className="space-y-0.5">
                    <div className="flex justify-between text-sm">
                      <span>{AREA_LABELS[a.area] ?? a.area}</span>
                      <span className="tabular-nums">
                        <span className="font-semibold">{a.avg}</span>
                        <span className="text-xs text-muted-foreground mr-1">({a.n})</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded bg-muted overflow-hidden" dir="ltr">
                      <div className="h-full" style={{ width: `${((a.avg - 1) / 9) * 100}%`, background: barColor(a.avg) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">נקודת הכשל המרכזית</div>
              <div className="space-y-1.5">
                {s.central.map((c) => (
                  <div key={c.area} className="space-y-0.5">
                    <div className="flex justify-between text-sm">
                      <span>{AREA_LABELS[c.area] ?? c.area}</span>
                      <span className="tabular-nums font-semibold">{c.n}</span>
                    </div>
                    <div className="h-1.5 rounded bg-muted overflow-hidden" dir="ltr">
                      <div className="h-full bg-primary" style={{ width: `${(c.n / maxCentral) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-sm border-t pt-3">
              <span className="font-medium">אבחון חוזר:</span>{' '}
              {s.repeaters === 0
                ? 'אף משתמש לא עשה את האבחון יותר מפעם אחת (בכל התקופה).'
                : `${s.repeaters} משתמשים עשו אותו יותר מפעם אחת${
                    s.repeaters_avg_change === null ? '' : `, שינוי ממוצע בציון הכללי: ${s.repeaters_avg_change > 0 ? '+' : ''}${s.repeaters_avg_change}`
                  }.`}
            </div>
            <p className="text-xs text-muted-foreground">
              הציון מחושב בקוד מ-24 קריטריונים בשש תחומים. תחום שלא נאמר עליו מספיק לא נכלל בממוצע שלו.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
