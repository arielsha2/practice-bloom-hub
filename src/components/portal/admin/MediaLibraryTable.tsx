import { useLanguage } from '@/contexts/LanguageContext';
import { MediaItem } from '@/pages/MediaLibrary';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Video,
  FileText,
  Presentation,
  Music,
  Link,
  Pencil,
  Trash2,
  Youtube,
  Clock,
  GripVertical,
  FolderInput,
  FolderOutput,
  Folder,
} from 'lucide-react';

interface MediaLibraryTableProps {
  media: MediaItem[];
  folders: string[];
  currentFolder: string | null;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onMoveToFolder: (itemId: string, folder: string | null) => void;
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

export function MediaLibraryTable({ media, folders, currentFolder, onEdit, onDelete, onMoveToFolder }: MediaLibraryTableProps) {
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
          {media.map((item) => {
            const Icon = getMediaIcon(item.media_kind, item.source);
            return (
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
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="flex items-center gap-2">
                      {item.title}
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
                    {/* Move to folder dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <FolderInput className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent dir={isRTL ? 'rtl' : 'ltr'} align="end">
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
