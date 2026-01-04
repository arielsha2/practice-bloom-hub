import { Check, Play } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  return (
    <div className="w-64 border-e bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">
          {isRTL ? 'השיעורים' : 'Lessons'}
        </h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLessonId;
            const isWatched = watchedLessons.has(lesson.id);

            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-start transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
              >
                {/* Number/Check indicator */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium",
                  isActive 
                    ? "bg-primary-foreground/20" 
                    : isWatched 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted-foreground/10"
                )}>
                  {isWatched ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Title */}
                <span className="text-sm line-clamp-2 flex-1">
                  {lesson.title}
                </span>

                {/* Playing indicator */}
                {isActive && (
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
