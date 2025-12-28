import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Video, Presentation, FileText } from 'lucide-react';
import { LessonResourceManager } from './LessonResourceManager';

import type { VideoSource } from '@/lib/videoUtils';

interface Resource {
  id: string;
  title: string;
  type: string;
  file_path: string | null;
  url: string | null;
  source: VideoSource;
}

interface SortableLessonCardProps {
  lesson: {
    id: string;
    title: string;
    order_index: number;
  };
  index: number;
  resources: Resource[];
  onDelete: (id: string) => void;
  onResourceChange: () => void;
}

export function SortableLessonCard({
  lesson,
  index,
  resources,
  onDelete,
  onResourceChange,
}: SortableLessonCardProps) {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Count resources by type
  const videoCount = resources.filter((r) => r.type === 'video').length;
  const pptCount = resources.filter((r) => r.type === 'ppt').length;
  const pdfCount = resources.filter((r) => r.type === 'pdf').length;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="p-3">
          <div className="flex items-center gap-2">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none p-1 hover:bg-muted rounded"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Index */}
            <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary shrink-0">
              {index + 1}
            </span>

            {/* Title */}
            <span className="font-medium flex-1 truncate">{lesson.title}</span>

            {/* Resource Counts */}
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {videoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {videoCount}
                </span>
              )}
              {pptCount > 0 && (
                <span className="flex items-center gap-1">
                  <Presentation className="w-4 h-4" />
                  {pptCount}
                </span>
              )}
              {pdfCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {pdfCount}
                </span>
              )}
            </div>

            {/* Expand/Collapse */}
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={() => onDelete(lesson.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <LessonResourceManager
              lessonId={lesson.id}
              resources={resources}
              onResourceChange={onResourceChange}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
