import { Button } from '@/components/ui/button';
import type { AnalyticsPeriod } from '@/hooks/useAdminAnalytics';

const OPTIONS: { value: AnalyticsPeriod; labelHe: string }[] = [
  { value: '1d', labelHe: 'יום' },
  { value: '7d', labelHe: '7 ימים' },
  { value: '30d', labelHe: '30 ימים' },
  { value: '90d', labelHe: 'רבעון' },
];

export function PeriodSelector({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (p: AnalyticsPeriod) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" dir="rtl">
      {OPTIONS.map((o) => (
        <Button
          key={o.value}
          size="sm"
          variant={value === o.value ? 'default' : 'outline'}
          onClick={() => onChange(o.value)}
        >
          {o.labelHe}
        </Button>
      ))}
    </div>
  );
}
