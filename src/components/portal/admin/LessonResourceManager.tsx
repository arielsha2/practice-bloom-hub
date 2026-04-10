import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Video, Presentation, FileText, Plus, X, Eye, Download, Youtube,
  ExternalLink, GripVertical, FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { MediaPickerDialog } from './MediaPickerDialog';
import type { VideoSource } from '@/lib/videoUtils';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';

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

interface LessonResourceManagerProps {
  lessonId: string;
  resources: Resource[];
  onResourceChange: () => void;
}

type MediaKindFilter = 'video' | 'document' | 'presentation';

interface FolderInfo {
  id: string;
  name: string;
}

// ---------- Thumbnail component with hover preview ----------
function ResourceThumbnail({ resource }: { resource: Resource }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getThumbnailUrl = (): string | null => {
    if (resource.source === 'youtube' && resource.external_id) {
      return `https://img.youtube.com/vi/${resource.external_id}/mqdefault.jpg`;
    }
    return resource.thumbnail_url;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isVideo = resource.type === 'video';

  const getVideoPreviewUrl = (): string | null => {
    if (resource.source === 'youtube' && resource.external_id) {
      return null; // Will use iframe for YouTube
    }
    if (resource.url && resource.source === 'file') {
      return resource.url;
    }
    return null;
  };

  const TypeIcon = resource.type === 'video' ? Video
    : resource.type === 'presentation' ? Presentation : FileText;

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      {/* Static thumbnail */}
      <div className="w-10 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <TypeIcon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Hover preview */}
      {isHovering && (
        <div className="absolute z-50 bottom-full mb-2 start-0 bg-background border rounded-lg shadow-xl overflow-hidden"
          style={{ width: 240, height: 160 }}
        >
          {isVideo && resource.source === 'youtube' && resource.external_id ? (
            <iframe
              src={`https://www.youtube.com/embed/${resource.external_id}?autoplay=1&mute=1&start=0&end=5&loop=1&playlist=${resource.external_id}&controls=0`}
              className="w-full h-full"
              allow="autoplay"
              title="Preview"
            />
          ) : isVideo && getVideoPreviewUrl() ? (
            <video
              ref={videoRef}
              src={getVideoPreviewUrl()!}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
              onTimeUpdate={(e) => {
                if (e.currentTarget.currentTime >= 5) {
                  e.currentTarget.currentTime = 0;
                }
              }}
            />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="w-full h-full object-contain bg-muted"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <TypeIcon className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Folder assignment popover ----------
function FolderAssignPopover({
  resource,
  folders,
  onAssign,
}: {
  resource: Resource;
  folders: FolderInfo[];
  onAssign: (mediaId: string, folder: FolderInfo) => void;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" title={t('media.assignToFolder')}>
          <FolderOpen className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="end">
        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          {t('media.selectFolder')}
        </div>
        {folders.length === 0 ? (
          <div className="text-xs text-muted-foreground/60 px-2 py-2">
            {t('media.noFoldersYet')}
          </div>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              className="w-full text-start text-sm px-2 py-1.5 rounded hover:bg-muted transition-colors"
              onClick={() => {
                onAssign(resource.media_id, folder);
                setOpen(false);
              }}
            >
              {folder.name}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

// ---------- Sortable resource item ----------
function SortableResourceItem({
  resource,
  onRemove,
  onView,
  isRemoving,
  folders,
  onFolderAssign,
  isEditing,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  resource: Resource;
  onRemove: () => void;
  onView: () => void;
  isRemoving: boolean;
  folders: FolderInfo[];
  onFolderAssign: (mediaId: string, folder: FolderInfo) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onSaveEdit: (newTitle: string) => void;
  onCancelEdit: () => void;
}) {
  const [editValue, setEditValue] = useState(resource.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: resource.id,
  });

  useEffect(() => {
    if (isEditing) {
      setEditValue(resource.title);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isEditing, resource.title]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSourceIcon = (source: VideoSource) => {
    switch (source) {
      case 'youtube': return <Youtube className="w-3 h-3" />;
      case 'zoom': return <ExternalLink className="w-3 h-3" />;
      case 'vimeo': return <Video className="w-3 h-3" />;
      default: return null;
    }
  };

  const getSourceLabel = (source: VideoSource) => {
    switch (source) {
      case 'youtube': return 'YouTube';
      case 'vimeo': return 'Vimeo';
      case 'zoom': return 'Zoom';
      default: return '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit(editValue.trim() || resource.title);
    } else if (e.key === 'Escape') {
      onCancelEdit();
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

      {/* Thumbnail */}
      <ResourceThumbnail resource={resource} />

      {resource.type === 'video' && resource.source !== 'file' && (
        <span className="flex items-center gap-1 text-muted-foreground">
          {getSourceIcon(resource.source)}
          <span className="text-xs">{getSourceLabel(resource.source)}</span>
        </span>
      )}

      {/* Title - inline editable */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSaveEdit(editValue.trim() || resource.title)}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm flex-1 min-w-0"
        />
      ) : (
        <span
          className="truncate max-w-[150px] flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={onStartEdit}
          title={resource.title}
        >
          {resource.title}
        </span>
      )}

      <div className="flex items-center gap-1">
        <FolderAssignPopover
          resource={resource}
          folders={folders}
          onAssign={onFolderAssign}
        />
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onView}>
          {resource.type === 'video' ? <Eye className="w-3 h-3" /> : <Download className="w-3 h-3" />}
        </Button>
        <Button
          variant="ghost" size="icon"
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

// ---------- Main component ----------
export function LessonResourceManager({
  lessonId,
  resources,
  onResourceChange,
}: LessonResourceManagerProps) {
  const { t, isRTL } = useLanguage();
  const [pickerFilter, setPickerFilter] = useState<MediaKindFilter | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderInfo[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    const { data } = await supabase
      .from('media_folders')
      .select('id, name')
      .order('name');
    if (data) setFolders(data);
  };

  const videoResources = resources.filter((r) => r.type === 'video');
  const presentationResources = resources.filter((r) => r.type === 'presentation');
  const documentResources = resources.filter((r) => r.type === 'document');

  const handleRemoveFromLesson = async (resource: Resource) => {
    setRemovingId(resource.id);
    try {
      const { error } = await supabase.from('lesson_media_links').delete().eq('id', resource.id);
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
    if (resource.url && resource.source !== 'file') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      return;
    }
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

  const handleFolderAssign = async (mediaId: string, folder: FolderInfo) => {
    try {
      // Check existing folder assignments
      const { data: existingAssignments } = await supabase
        .from('media_folder_assignments')
        .select('id, folder_id, media_folders:folder_id(name)')
        .eq('media_id', mediaId);

      // Also check the legacy folder column
      const { data: mediaItem } = await supabase
        .from('media_library')
        .select('folder')
        .eq('id', mediaId)
        .single();

      const previousFolderName = (existingAssignments as any)?.[0]?.media_folders?.name
        || mediaItem?.folder
        || null;

      // Insert new assignment
      const { error } = await supabase
        .from('media_folder_assignments')
        .upsert({ media_id: mediaId, folder_id: folder.id }, { onConflict: 'media_id,folder_id' });
      if (error) throw error;

      // Also update the legacy column
      await supabase.from('media_library').update({ folder: folder.name }).eq('id', mediaId);

      const message = t('media.fileAssignedToFolder').replace('{folder}', folder.name);

      if (previousFolderName && previousFolderName !== folder.name) {
        toast(message, {
          description: t('media.keepInPreviousFolder'),
          action: {
            label: t('media.keepPrevious'),
            onClick: () => {
              // Keep both — the new assignment is already in place, nothing to do
            },
          },
          cancel: {
            label: t('media.removePrevious'),
            onClick: async () => {
              // Remove old assignment
              const oldFolder = folders.find((f) => f.name === previousFolderName);
              if (oldFolder) {
                await supabase
                  .from('media_folder_assignments')
                  .delete()
                  .eq('media_id', mediaId)
                  .eq('folder_id', oldFolder.id);
              }
            },
          },
        });
      } else {
        toast.success(message);
      }
    } catch (error) {
      console.error('Error assigning folder:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const handleSaveEdit = async (resource: Resource, newTitle: string) => {
    setEditingId(null);
    if (newTitle === resource.title) return;
    try {
      const { error } = await supabase
        .from('media_library')
        .update({ title: newTitle })
        .eq('id', resource.media_id);
      if (error) throw error;
      toast.success(t('media.renameSuccess'));
      onResourceChange();
    } catch (error) {
      console.error('Error renaming:', error);
      toast.error(t('media.renameError'));
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
          variant="outline" size="sm"
          onClick={() => setPickerFilter(type)}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 me-1" />
          {t('portal.admin.addResource')}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-2">{t('portal.admin.noResources')}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {items.map((resource) => (
                <SortableResourceItem
                  key={resource.id}
                  resource={resource}
                  onRemove={() => handleRemoveFromLesson(resource)}
                  onView={() => handleView(resource)}
                  isRemoving={removingId === resource.id}
                  folders={folders}
                  onFolderAssign={handleFolderAssign}
                  isEditing={editingId === resource.id}
                  onStartEdit={() => setEditingId(resource.id)}
                  onSaveEdit={(newTitle) => handleSaveEdit(resource, newTitle)}
                  onCancelEdit={() => setEditingId(null)}
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
      <ResourceSection type="video" icon={Video} label={t('portal.videos')} items={videoResources} />
      <ResourceSection type="presentation" icon={Presentation} label={t('portal.admin.presentations')} items={presentationResources} />
      <ResourceSection type="document" icon={FileText} label={t('portal.admin.worksheets')} items={documentResources} />

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
