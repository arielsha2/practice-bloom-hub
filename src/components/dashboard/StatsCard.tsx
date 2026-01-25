import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'bg-card border-border',
  success: 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40',
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
  info: 'bg-primary/5 border-primary/20',
};

const iconStyles = {
  default: 'text-muted-foreground',
  success: 'text-success dark:text-success',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-primary',
};

export function StatsCard({ title, value, icon, variant = 'default', className }: StatsCardProps) {
  return (
    <Card className={cn('border transition-all hover:shadow-md', variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn('p-3 rounded-full bg-background/50', iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
