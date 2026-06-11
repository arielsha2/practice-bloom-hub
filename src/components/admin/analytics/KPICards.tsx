import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, Activity, CreditCard } from 'lucide-react';
import type { AnalyticsData } from '@/hooks/useAdminAnalytics';

export function KPICards({ data }: { data: AnalyticsData }) {
  const items = [
    { icon: Users, labelHe: 'סה"כ משתמשים', value: data.kpis.totalUsers },
    { icon: UserPlus, labelHe: 'משתמשים חדשים', value: data.kpis.newUsers },
    { icon: Activity, labelHe: 'משתמשים פעילים', value: data.kpis.activeUsers },
    { icon: CreditCard, labelHe: 'משלמים', value: data.kpis.paidUsers },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" dir="rtl">
      {items.map((it) => (
        <Card key={it.labelHe}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <it.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{it.labelHe}</p>
              <p className="text-2xl font-semibold">{it.value.toLocaleString('he-IL')}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
