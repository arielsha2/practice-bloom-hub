import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FunnelOverview } from '@/hooks/useFunnelOverview';

export function SilentSignupsCard({ data }: { data: FunnelOverview }) {
  const { count, rows } = data.silent_signups;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">נרשמו ולא פתחו אף שיחה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold">{count}</div>
          <div className="text-xs text-muted-foreground">
            מתוך {data.signups} הרשמות בתקופה. נספרים רק מי שנרשם לפני יותר משעה, ולא פתח שיחת אבחון, מנטור או כלי.
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין כרגע נרשמים כאלה.</p>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-2">
                <span dir="ltr" className="truncate">{r.email ?? '—'}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(r.created_at).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {count > rows.length && <p className="text-xs text-muted-foreground">מוצגים {rows.length} האחרונים.</p>}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          כל אחד מהם אישר הצטרפות לרשימת התפוצה, כך שאפשר לפנות אליהם במייל. הפנייה היא החלטה שלך.
        </p>
      </CardContent>
    </Card>
  );
}
