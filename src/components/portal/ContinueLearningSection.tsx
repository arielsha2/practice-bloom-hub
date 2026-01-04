import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExpandableDescription } from './ExpandableDescription';
import { useLanguage } from '@/contexts/LanguageContext';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface MediaItem {
  id: string;
  thumbnail_url: string | null;
  url: string | null;
}

interface ContinueLearningSectionProps {
  lesson: Lesson | null;
  media: MediaItem | null;
  isInProgress?: boolean;
  onPlay: () => void;
}

export function ContinueLearningSection({ 
  lesson, 
  media, 
  isInProgress = false,
  onPlay 
}: ContinueLearningSectionProps) {
  const { isRTL } = useLanguage();

  if (!lesson) {
    return (
      <div className="text-center py-12 bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl">
        <p className="text-muted-foreground">
          {isRTL ? 'סיימת את כל השיעורים! 🎉' : 'You completed all lessons! 🎉'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2 className="text-lg font-medium text-muted-foreground">
        {isInProgress 
          ? (isRTL ? 'המשיכי מאיפה שעצרת' : 'Continue where you left off')
          : (isRTL ? 'הצעד הבא שלך' : 'Your next step')
        }
      </h2>

      {/* Video thumbnail area */}
      <div 
        onClick={onPlay}
        className="group relative aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden cursor-pointer"
      >
        {media?.thumbnail_url ? (
          <img
            src={media.thumbnail_url}
            alt={lesson.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            className="w-16 h-16 rounded-full bg-primary/85 hover:bg-primary backdrop-blur-sm shadow-lg transition-transform group-hover:scale-105"
          >
            <Play className="w-7 h-7 fill-current" />
          </Button>
        </div>

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Lesson info */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{lesson.title}</h3>
        <ExpandableDescription description={lesson.description} />
      </div>
    </div>
  );
}
