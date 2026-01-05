import { Users, UserCheck, TrendingUp } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  completionPercent: number;
}

export function AdminStats({ totalUsers, activeUsers, completionPercent }: AdminStatsProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatsCard
        title={t('dashboard.admin.totalUsers')}
        value={totalUsers}
        icon={<Users className="h-6 w-6" />}
        variant="info"
      />
      <StatsCard
        title={t('dashboard.admin.activeUsers')}
        value={activeUsers}
        icon={<UserCheck className="h-6 w-6" />}
        variant="success"
      />
      <StatsCard
        title={t('dashboard.admin.completionRate')}
        value={`${completionPercent}%`}
        icon={<TrendingUp className="h-6 w-6" />}
        variant="warning"
      />
    </div>
  );
}
