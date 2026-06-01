import { useState } from 'react';
import { CheckCircle2, Circle, Play, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);

  if (lessons.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('portal.noLessons')}
      </div>
    );
  }

  const watchedCount = lessons.filter((l) => l.watched).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-4">
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className={cn('flex flex-col', isRTL ? 'text-right' : 'text-left')}>
            <h3 className="text-lg font-semibold">{t('dashboard.myLessons')}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? `${watchedCount}/${lessons.length} שיעורים הושלמו · ${open ? 'הסתר' : 'הצג את כל השיעורים'}`
                : `${watchedCount}/${lessons.length} completed · ${open ? 'Hide' : 'Show all lessons'}`}
            </p>
          </div>
          <ChevronDown
            className={cn('h-5 w-5 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
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
      </CollapsibleContent>
    </Collapsible>
  );
}
