import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { estimateRevenue, PRICES, type FunnelOverview } from '@/hooks/useFunnelOverview';

const TOOL_LABELS: Record<string, string> = {
  'niche-finder': 'מציאת הנישה',
  'pricing-calculator': 'מחשבון התמחור',
  'self-presentation': 'הצגה עצמית',
  'contact-finder': 'מציאת אנשי קשר להפניות',
  'connection-bridge': 'גשר הקשר',
  'first-call-practice': 'תרגול שיחת הטלפון הראשונה',
};

const VIA_LABELS: Record<string, string> = {
  grow_single_tool: 'Grow (כלי בודד, ₪)',
  paypal_single_tool: 'PayPal (כלי בודד, $)',
  meshulam: 'משולם (מסלול מלא, ₪)',
  other: 'PayPal או הענקה ידנית (מסלול מלא)',
};

const nf = new Intl.NumberFormat('he-IL');

export function PurchasesCard({ data }: { data: FunnelOverview }) {
  const p = data.purchases;
  const rev = estimateRevenue(p);
  const rows: Array<{ label: string; n: number; each: string }> = [
    { label: 'כלי בודד, Grow', n: p.single_grow, each: `₪${PRICES.singleIls}` },
    { label: 'כלי בודד, PayPal', n: p.single_paypal, each: `$${PRICES.singleUsd}` },
    { label: 'מסלול מלא, משולם', n: p.full_meshulam, each: `₪${PRICES.fullIls}` },
    { label: 'מסלול מלא, PayPal או הענקה ידנית', n: p.full_other, each: 'לא ידוע' },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">רכישות והכנסה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-sm">
              <span>{r.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold">{nf.format(r.n)}</span>
                <span className="text-xs text-muted-foreground mr-2">× {r.each}</span>
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 text-sm">
            <span className="font-medium">הכנסה משוערת</span>
            <span className="font-semibold">
              ₪{nf.format(rev.ils)}
              {rev.usd ? ` + $${nf.format(rev.usd)}` : ''}
            </span>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">רכישות אחרונות</div>
          {data.recent_purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין רכישות בתקופה שנבחרה.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_purchases.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{r.display_name || r.email || '—'}</div>
                    <div className="text-xs text-muted-foreground" dir="ltr" style={{ textAlign: 'right' }}>
                      {r.display_name ? r.email : ''}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {r.kind === 'full_mentor' ? 'מסלול מלא' : `כלי: ${TOOL_LABELS[r.tool ?? ''] ?? r.tool ?? '—'}`}
                    </Badge>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {VIA_LABELS[r.via] ?? r.via}
                      {r.at ? `, ${new Date(r.at).toLocaleDateString('he-IL')}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          ההכנסה מחושבת לפי מחירון ולא לפי סכום שנגבה בפועל, כי הסכום אינו נשמר. מסלול מלא ללא מזהה עסקה של משולם עשוי להיות PayPal ($250) או הענקה ידנית, ולכן הוא נספר ולא מתומחר. תאריך רכישה של כלי בודד נלקח מעמודת granted_at בטבלת user_tool_access.
        </p>
      </CardContent>
    </Card>
  );
}
