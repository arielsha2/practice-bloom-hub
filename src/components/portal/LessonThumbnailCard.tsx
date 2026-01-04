import { Check, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LessonThumbnailCardProps {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  isWatched?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export function LessonThumbnailCard({
  title,
  thumbnailUrl,
  isWatched = false,
  isActive = false,
  onClick
}: LessonThumbnailCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer overflow-hidden transition-all duration-200 hover:ring-2 hover:ring-primary/30",
        isActive && "ring-2 ring-primary"
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Play className="w-8 h-8 text-primary/40" />
          </div>
        )}
        
        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
        </div>

        {/* Watched indicator */}
        {isWatched && (
          <div className="absolute top-2 end-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Title */}
      <div className="p-3">
        <h3 className="text-sm font-medium line-clamp-2">{title}</h3>
      </div>
    </Card>
  );
}
