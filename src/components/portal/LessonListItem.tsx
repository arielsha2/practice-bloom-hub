import { Check, Play, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

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
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01, x: isRTL ? -4 : 4 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 text-start transition-colors rounded-lg group",
        isActive 
          ? "bg-primary/10 border border-primary/30" 
          : "hover:bg-muted/50 border border-transparent",
        isInProgress && !isActive && "bg-accent/5 border-accent/20"
      )}
    >
      {/* Checkbox/Number indicator */}
      <motion.div 
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold border-2",
          isWatched 
            ? "bg-success border-success text-success-foreground"
            : isActive
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 text-muted-foreground group-hover:border-muted-foreground/50"
        )}
        initial={false}
        animate={isWatched ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {isWatched ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="w-4 h-4" />
          </motion.div>
        ) : (
          <span>{index}</span>
        )}
      </motion.div>

      {/* Lesson Info */}
      <div className="flex-1 min-w-0 text-start">
        <div className="flex items-center gap-2">
          {isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <PlayCircle className="w-4 h-4 text-primary shrink-0" />
            </motion.div>
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
        <motion.div 
          className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isRTL ? 'בתהליך' : 'In progress'}
        </motion.div>
      )}
    </motion.button>
  );
}
