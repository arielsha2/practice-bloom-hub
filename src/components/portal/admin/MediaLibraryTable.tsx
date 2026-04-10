import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MediaItem } from '@/pages/MediaLibrary';
import { supabase } from '@/integrations/supabase/client';
import { extractYouTubeId, extractVimeoId, extractGoogleDriveId } from '@/lib/videoUtils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Video, FileText, Presentation, Music, Link, Pencil, Trash2, Youtube,
  Clock, GripVertical, FolderInput, FolderOutput, Folder,
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaLibraryTableProps {
  media: MediaItem[];
  folders: string[];
  currentFolder: string | null;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onMoveToFolder: (itemId: string, folder: string | null) => void;
  onRenamed?: () => void;
}

const getMediaIcon = (kind: string, source?: string) => {
  if (kind === 'video' && source === 'youtube') return Youtube;
  switch (kind) {
    case 'video': return Video;
    case 'document': return FileText;
    case 'presentation': return Presentation;
    case 'audio': return Music;
    case 'link': return Link;
    default: return FileText;
  }
};

const getMediaKindBadgeVariant = (kind: string): 'default' | 'secondary' | 'outline' => {
  switch (kind) {
    case 'video': return 'default';
    case 'document': return 'secondary';
    case 'presentation': return 'outline';
    default: return 'secondary';
  }
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ---------- Thumbnail with hover preview ----------
function MediaThumbnail({ item }: { item: MediaItem }) {
  const [isHovering, setIsHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const Icon = getMediaIcon(item.media_kind, item.source);

  // Derive IDs from URL at render time since external_id may be null
  const youtubeId = item.external_id || (item.url ? extractYouTubeId(item.url) : null);
  const vimeoId = item.url ? extractVimeoId(item.url) : null;
  const gdriveId = item.url ? extractGoogleDriveId(item.url) : null;

  const getThumbnailUrl = (): string | null => {
    if (item.source === 'youtube' && youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    }
    return item.thumbnail_url;
  };

  const thumbnailUrl = getThumbnailUrl();
  const isVideo = item.media_kind === 'video';

  const renderHoverPreview = () => {
    // YouTube
    if (isVideo && youtubeId) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&start=0&end=5&loop=1&playlist=${youtubeId}&controls=0`}
          className="w-full h-full"
          allow="autoplay"
          title="Preview"
        />
      );
    }
    // Vimeo
    if (isVideo && vimeoId) {
      return (
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&loop=1&background=1`}
          className="w-full h-full"
          allow="autoplay"
          title="Preview"
        />
      );
    }
    // Google Drive
    if (gdriveId) {
      return (
        <iframe
          src={`https://drive.google.com/file/d/${gdriveId}/preview`}
          className="w-full h-full"
          title="Preview"
        />
      );
    }
    // Local file video
    if (isVideo && item.url && item.source === 'file') {
      return (
        <video
          ref={videoRef}
          src={item.url}
          autoPlay
          muted
          loop
          className="w-full h-full object-cover"
          onTimeUpdate={(e) => {
            if (e.currentTarget.currentTime >= 5) e.currentTarget.currentTime = 0;
          }}
        />
      );
    }
    // Thumbnail fallback
    if (thumbnailUrl) {
      return <img src={thumbnailUrl} alt="" className="w-full h-full object-contain bg-muted" />;
    }
    // Icon fallback
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Icon className="w-12 h-12 text-muted-foreground/40" />
      </div>
    );
  };

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
      <div className="w-10 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {isHovering && (
        <div
          className="absolute z-50 bottom-full mb-2 start-0 bg-background border rounded-lg shadow-xl overflow-hidden"
          style={{ width: 240, height: 160 }}
        >
          {renderHoverPreview()}
        </div>
      )}
    </div>
  );
}

// ---------- Inline editable title cell ----------
function InlineEditTitle({
  item,
  currentFolder,
  onRenamed,
}: {
  item: MediaItem;
  currentFolder: string | null;
  onRenamed?: () => void;
}) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(item.title);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isEditing, item.title]);

  const handleSave = async () => {
    setIsEditing(false);
    const newTitle = editValue.trim();
    if (!newTitle || newTitle === item.title) return;
    try {
      const { error } = await supabase
        .from('media_library')
        .update({ title: newTitle })
        .eq('id', item.id);
      if (error) throw error;
      toast.success(t('media.renameSuccess'));
      onRenamed?.();
    } catch (error) {
      console.error('Error renaming:', error);
      toast.error(t('media.renameError'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    else if (e.key === 'Escape') setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span
          className="cursor-pointer hover:text-primary transition-colors font-medium"
          onClick={() => setIsEditing(true)}
          title={item.title}
        >
          {item.title}
        </span>
        {item.folder && currentFolder === null && (
          <Badge variant="outline" className="text-xs gap-1">
            <Folder className="w-3 h-3" />
            {item.folder}
          </Badge>
        )}
      </div>
      {item.description && (
        <div className="text-sm text-muted-foreground truncate max-w-xs">
          {item.description}
        </div>
      )}
    </div>
  );
}

export function MediaLibraryTable({ media, folders, currentFolder, onEdit, onDelete, onMoveToFolder, onRenamed }: MediaLibraryTableProps) {
  const { t, isRTL } = useLanguage();

  if (media.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t('media.noMedia')}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('media.columnTitle')}</TableHead>
            <TableHead>{t('media.columnType')}</TableHead>
            <TableHead>{t('media.columnSource')}</TableHead>
            <TableHead>{t('media.columnDuration')}</TableHead>
            <TableHead>{t('media.columnUsage')}</TableHead>
            <TableHead className="w-28">{t('media.columnActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => (
            <TableRow
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('media-id', item.id);
                e.currentTarget.classList.add('opacity-50');
              }}
              onDragEnd={(e) => {
                e.currentTarget.classList.remove('opacity-50');
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <TableCell className="px-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </TableCell>
              <TableCell>
                <MediaThumbnail item={item} />
              </TableCell>
              <TableCell>
                <InlineEditTitle item={item} currentFolder={currentFolder} onRenamed={onRenamed} />
              </TableCell>
              <TableCell>
                <Badge variant={getMediaKindBadgeVariant(item.media_kind)}>
                  {t(`media.type${item.media_kind.charAt(0).toUpperCase() + item.media_kind.slice(1)}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {item.source === 'file' ? t('media.sourceFile') : item.source}
              </TableCell>
              <TableCell>
                {item.duration_seconds ? (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDuration(item.duration_seconds)}
                  </span>
                ) : '-'}
              </TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {t('media.usedInLessons').replace('{count}', String(item.usage_count || 0))}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <FolderInput className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.folder && (
                        <>
                          <DropdownMenuItem onClick={() => onMoveToFolder(item.id, null)}>
                            <FolderOutput className="w-4 h-4 me-2" />
                            {t('media.movedToRoot')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {folders
                        .filter((f) => f !== item.folder)
                        .map((folder) => (
                          <DropdownMenuItem key={folder} onClick={() => onMoveToFolder(item.id, folder)}>
                            <Folder className="w-4 h-4 me-2" />
                            {folder}
                          </DropdownMenuItem>
                        ))}
                      {folders.filter((f) => f !== item.folder).length === 0 && !item.folder && (
                        <DropdownMenuItem disabled>
                          {isRTL ? 'אין תיקיות' : 'No folders'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('media.deleteConfirm')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {(item.usage_count || 0) > 0
                            ? t('media.deleteWarningUsed').replace('{count}', String(item.usage_count))
                            : t('media.deleteWarning')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('contents.admin.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(item)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('contents.admin.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
