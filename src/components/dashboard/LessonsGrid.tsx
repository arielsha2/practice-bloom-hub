import { CheckCircle2, Circle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  order_index: number | null;
  watched: boolean;
}

interface LessonsGridProps {
  lessons: Lesson[];
}

export function LessonsGrid({ lessons }: LessonsGridProps) {
  const { t } = useLanguage();

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('portal.noLessons')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t('dashboard.myLessons')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {lessons.map((lesson, index) => (
          <Link key={lesson.id} to={`/portal/lesson/${lesson.id}`}>
            <Card 
              className={cn(
                'transition-all hover:shadow-md cursor-pointer group h-full',
                lesson.watched 
                  ? 'bg-success/10 dark:bg-success/20 border-success/30 dark:border-success/40' 
                  : 'hover:border-primary/50'
              )}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={cn(
                    'p-2 rounded-full transition-colors',
                    lesson.watched 
                      ? 'bg-success/20 dark:bg-success/30 text-success' 
                      : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                  )}>
                    {lesson.watched ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t('dashboard.lesson')} {index + 1}
                    </p>
                    <p className="text-sm font-medium line-clamp-2 mt-0.5">
                      {lesson.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
