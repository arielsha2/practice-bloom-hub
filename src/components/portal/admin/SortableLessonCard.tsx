import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Video, Presentation, FileText } from 'lucide-react';
import { LessonResourceManager } from './LessonResourceManager';
import { toast } from 'sonner';

import type { VideoSource } from '@/lib/videoUtils';

interface Resource {
  id: string;
  media_id: string;
  title: string;
  type: string;
  file_path: string | null;
  url: string | null;
  source: VideoSource;
  display_order: number;
  thumbnail_url: string | null;
  external_id: string | null;
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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isEditingTitle) {
      setEditTitle(lesson.title);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isEditingTitle, lesson.title]);

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    const newTitle = editTitle.trim();
    if (!newTitle || newTitle === lesson.title) return;
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ title: newTitle })
        .eq('id', lesson.id);
      if (error) throw error;
      toast.success(t('media.renameSuccess'));
      onResourceChange();
    } catch (error) {
      console.error('Error renaming lesson:', error);
      toast.error(t('media.renameError'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    else if (e.key === 'Escape') setIsEditingTitle(false);
  };

  const videoCount = resources.filter((r) => r.type === 'video').length;
  const presentationCount = resources.filter((r) => r.type === 'presentation').length;
  const documentCount = resources.filter((r) => r.type === 'document').length;

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
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab touch-none p-1 hover:bg-muted rounded"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-5 h-5 text-muted-foreground" />
            </button>

            <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary shrink-0">
              {index + 1}
            </span>

            {/* Title - inline editable */}
            {isEditingTitle ? (
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                className="h-8 text-sm font-medium flex-1 min-w-0"
              />
            ) : (
              <span
                className="font-medium flex-1 truncate cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditingTitle(true)}
                title={lesson.title}
              >
                {lesson.title}
              </span>
            )}

            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              {videoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  {videoCount}
                </span>
              )}
              {presentationCount > 0 && (
                <span className="flex items-center gap-1">
                  <Presentation className="w-4 h-4" />
                  {presentationCount}
                </span>
              )}
              {documentCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {documentCount}
                </span>
              )}
            </div>

            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>

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
