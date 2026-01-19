import { Check, Play, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonListItemProps {
  index: number;
  title: string;
  duration?: string;
  isWatched?: boolean;
  isActive?: boolean;
  isInProgress?: boolean;
  onClick?: () => void;
}

export function LessonListItem({
  index,
  title,
  duration,
  isWatched = false,
  isActive = false,
  isInProgress = false,
  onClick
}: LessonListItemProps) {
  const { isRTL } = useLanguage();

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 text-start transition-all rounded-lg group",
        isActive 
          ? "bg-primary/10 border border-primary/30" 
          : "hover:bg-muted/50 border border-transparent",
        isInProgress && !isActive && "bg-accent/5 border-accent/20"
      )}
    >
      {/* Checkbox/Number indicator */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold transition-colors border-2",
        isWatched 
          ? "bg-emerald-500 border-emerald-500 text-white" 
          : isActive
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 text-muted-foreground group-hover:border-muted-foreground/50"
      )}>
        {isWatched ? (
          <Check className="w-4 h-4" />
        ) : (
          <span>{index}</span>
        )}
      </div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isActive && (
            <PlayCircle className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className={cn(
            "text-sm line-clamp-1",
            isActive ? "font-semibold text-primary" : "font-medium",
            isWatched && !isActive && "text-muted-foreground"
          )}>
            {title}
          </span>
        </div>
        
        {/* Duration */}
        {duration && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
        )}
      </div>

      {/* Play indicator on hover (for non-active) */}
      {!isActive && (
        <Play className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}

      {/* In progress indicator */}
      {isInProgress && !isActive && !isWatched && (
        <div className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium shrink-0">
          {isRTL ? 'בתהליך' : 'In progress'}
        </div>
      )}
    </button>
  );
}
