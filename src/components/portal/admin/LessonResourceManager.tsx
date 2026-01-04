import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileText, Plus, X, Eye, Download, Youtube, ExternalLink, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { MediaPickerDialog } from './MediaPickerDialog';
import type { VideoSource } from '@/lib/videoUtils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Resource {
  id: string; // This is the link id
  media_id: string;
  title: string;
  type: string; // media_kind
  file_path: string | null;
  url: string | null;
  source: VideoSource;
  display_order: number;
}

interface LessonResourceManagerProps {
  lessonId: string;
  resources: Resource[];
  onResourceChange: () => void;
}

type MediaKindFilter = 'video' | 'document' | 'presentation';

function SortableResourceItem({
  resource,
  onRemove,
  onView,
  isRemoving,
}: {
  resource: Resource;
  onRemove: () => void;
  onView: () => void;
  isRemoving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resource.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSourceIcon = (source: VideoSource) => {
    switch (source) {
      case 'youtube':
        return <Youtube className="w-3 h-3" />;
      case 'zoom':
        return <ExternalLink className="w-3 h-3" />;
      case 'vimeo':
        return <Video className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getSourceLabel = (source: VideoSource) => {
    switch (source) {
      case 'youtube':
        return 'YouTube';
      case 'vimeo':
        return 'Vimeo';
      case 'zoom':
        return 'Zoom';
      default:
        return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm ${
        isDragging ? 'ring-2 ring-primary' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-0.5 hover:bg-muted rounded"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {resource.type === 'video' && resource.source !== 'file' && (
        <span className="flex items-center gap-1 text-muted-foreground">
          {getSourceIcon(resource.source)}
          <span className="text-xs">{getSourceLabel(resource.source)}</span>
        </span>
      )}
      
      <span className="truncate max-w-[150px] flex-1">{resource.title}</span>
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onView}
        >
          {resource.type === 'video' ? (
            <Eye className="w-3 h-3" />
          ) : (
            <Download className="w-3 h-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={isRemoving}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export function LessonResourceManager({
  lessonId,
  resources,
  onResourceChange,
}: LessonResourceManagerProps) {
  const { t, isRTL } = useLanguage();
  const [pickerFilter, setPickerFilter] = useState<MediaKindFilter | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const videoResources = resources.filter((r) => r.type === 'video');
  const presentationResources = resources.filter((r) => r.type === 'presentation');
  const documentResources = resources.filter((r) => r.type === 'document');

  const handleRemoveFromLesson = async (resource: Resource) => {
    setRemovingId(resource.id);
    try {
      // Remove the link, not the media itself
      const { error } = await supabase
        .from('lesson_media_links')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;

      toast.success(t('media.removedFromLesson'));
      onResourceChange();
    } catch (error) {
      console.error('Error removing resource from lesson:', error);
      toast.error(t('portal.admin.deleteError'));
    } finally {
      setRemovingId(null);
    }
  };

  const handleView = async (resource: Resource) => {
    // For external video sources, open URL directly
    if (resource.url && resource.source !== 'file') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }

    // For file-based resources, get signed URL
    if (!resource.file_path) {
      toast.error(t('portal.downloadError'));
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(resource.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error(t('portal.downloadError'));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const allSorted = [...resources].sort((a, b) => a.display_order - b.display_order);
      const oldIndex = allSorted.findIndex((r) => r.id === active.id);
      const newIndex = allSorted.findIndex((r) => r.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(allSorted, oldIndex, newIndex);

      // Update display_order in database
      try {
        for (let i = 0; i < reordered.length; i++) {
          const { error } = await supabase
            .from('lesson_media_links')
            .update({ display_order: i })
            .eq('id', reordered[i].id);

          if (error) throw error;
        }

        toast.success(t('portal.admin.orderUpdated'));
        onResourceChange();
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error(t('portal.admin.deleteError'));
      }
    }
  };

  const ResourceSection = ({
    type,
    icon: Icon,
    label,
    items,
  }: {
    type: MediaKindFilter;
    icon: typeof Video;
    label: string;
    items: Resource[];
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPickerFilter(type)}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 me-1" />
          {t('portal.admin.addResource')}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-2">
          {t('portal.admin.noResources')}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {items.map((resource) => (
                <SortableResourceItem
                  key={resource.id}
                  resource={resource}
                  onRemove={() => handleRemoveFromLesson(resource)}
                  onView={() => handleView(resource)}
                  isRemoving={removingId === resource.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );

  const existingMediaIds = resources.map((r) => r.media_id);

  return (
    <div className="space-y-4 border-t pt-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <ResourceSection
        type="video"
        icon={Video}
        label={t('portal.videos')}
        items={videoResources}
      />
      <ResourceSection
        type="presentation"
        icon={Presentation}
        label={t('portal.admin.presentations')}
        items={presentationResources}
      />
      <ResourceSection
        type="document"
        icon={FileText}
        label={t('portal.admin.worksheets')}
        items={documentResources}
      />

      <MediaPickerDialog
        open={pickerFilter !== null}
        onOpenChange={(open) => !open && setPickerFilter(null)}
        lessonId={lessonId}
        existingMediaIds={existingMediaIds}
        onMediaAdded={() => {
          setPickerFilter(null);
          onResourceChange();
        }}
      />
    </div>
  );
}
