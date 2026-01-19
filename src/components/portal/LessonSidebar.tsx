import { Check, Play, PlayCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface Lesson {
  id: string;
  title: string;
  order_index: number;
}

interface LessonSidebarProps {
  lessons: Lesson[];
  currentLessonId: string;
  watchedLessons: Set<string>;
  onSelectLesson: (lessonId: string) => void;
}

export function LessonSidebar({
  lessons,
  currentLessonId,
  watchedLessons,
  onSelectLesson
}: LessonSidebarProps) {
  const { isRTL } = useLanguage();
  
  const completedCount = watchedLessons.size;
  const totalCount = lessons.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="w-80 border-e bg-slate-50 dark:bg-slate-900/50 flex flex-col h-[calc(100vh-64px)] sticky top-16">
      {/* Header with progress */}
      <div className="p-4 border-b bg-background">
        <h2 className="font-semibold text-base mb-3">
          {isRTL ? 'תוכן הקורס' : 'Course content'}
        </h2>
        
        {/* Progress summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isRTL 
                ? `${completedCount}/${totalCount} שיעורים הושלמו`
                : `${completedCount}/${totalCount} completed`
              }
            </span>
            <span className="font-medium text-emerald-600">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>
      </div>
      
      {/* Lesson list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLessonId;
            const isWatched = watchedLessons.has(lesson.id);

            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-start transition-all group",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted"
                )}
              >
                {/* Number/Check indicator */}
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border-2 transition-colors",
                  isActive 
                    ? "bg-primary-foreground/20 border-primary-foreground/30" 
                    : isWatched 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {isWatched && !isActive ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm line-clamp-2 block",
                    isActive ? "font-medium" : isWatched ? "text-muted-foreground" : "font-normal"
                  )}>
                    {lesson.title}
                  </span>
                </div>

                {/* Playing indicator */}
                {isActive && (
                  <PlayCircle className="w-4 h-4 shrink-0" />
                )}
                
                {/* Hover play for non-active */}
                {!isActive && (
                  <Play className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
