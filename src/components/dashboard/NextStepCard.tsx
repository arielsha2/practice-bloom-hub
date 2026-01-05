import { ArrowRight, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

interface NextStepCardProps {
  lesson: {
    id: string;
    title: string;
    description: string | null;
  } | null;
}

export function NextStepCard({ lesson }: NextStepCardProps) {
  const { t, isRTL } = useLanguage();

  if (!lesson) {
    return (
      <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{t('dashboard.allCompleted')}</h3>
              <p className="text-white/80">{t('dashboard.congratulations')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-full shrink-0">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/80 font-medium">
                {t('dashboard.nextStep')}
              </p>
              <h3 className="text-xl font-bold mt-1">{lesson.title}</h3>
              {lesson.description && (
                <p className="text-primary-foreground/70 text-sm mt-1 line-clamp-1">
                  {lesson.description}
                </p>
              )}
            </div>
          </div>
          <Link to={`/portal/lesson/${lesson.id}`}>
            <Button 
              variant="secondary" 
              className="w-full sm:w-auto gap-2"
            >
              {t('dashboard.continue')}
              <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper for completed state
import { CheckCircle2 } from 'lucide-react';
