import { BookOpen, CheckCircle2, Clock } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressOverviewProps {
  totalLessons: number;
  watchedLessons: number;
  remainingLessons: number;
}

export function ProgressOverview({ totalLessons, watchedLessons, remainingLessons }: ProgressOverviewProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatsCard
        title={t('dashboard.totalLessons')}
        value={totalLessons}
        icon={<BookOpen className="h-6 w-6" />}
        variant="info"
      />
      <StatsCard
        title={t('dashboard.watchedLessons')}
        value={watchedLessons}
        icon={<CheckCircle2 className="h-6 w-6" />}
        variant="success"
      />
      <StatsCard
        title={t('dashboard.remainingLessons')}
        value={remainingLessons}
        icon={<Clock className="h-6 w-6" />}
        variant="warning"
      />
    </div>
  );
}
