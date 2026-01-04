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
  Video,
  FileText,
  Presentation,
  Music,
  Link,
  Pencil,
  Trash2,
  Youtube,
  Clock,
} from 'lucide-react';

interface MediaLibraryTableProps {
  media: MediaItem[];
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
}

const getMediaIcon = (kind: string, source?: string) => {
  if (kind === 'video' && source === 'youtube') return Youtube;
  switch (kind) {
    case 'video':
      return Video;
    case 'document':
      return FileText;
    case 'presentation':
      return Presentation;
    case 'audio':
      return Music;
    case 'link':
      return Link;
    default:
      return FileText;
  }
};

const getMediaKindBadgeVariant = (kind: string): 'default' | 'secondary' | 'outline' => {
  switch (kind) {
    case 'video':
      return 'default';
    case 'document':
      return 'secondary';
    case 'presentation':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function MediaLibraryTable({ media, onEdit, onDelete }: MediaLibraryTableProps) {
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
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('media.columnTitle')}</TableHead>
            <TableHead>{t('media.columnType')}</TableHead>
            <TableHead>{t('media.columnSource')}</TableHead>
            <TableHead>{t('media.columnDuration')}</TableHead>
            <TableHead>{t('media.columnUsage')}</TableHead>
            <TableHead className="w-24">{t('media.columnActions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {media.map((item) => {
            const Icon = getMediaIcon(item.media_kind, item.source);
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{item.title}</div>
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
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {t('media.usedInLessons').replace('{count}', String(item.usage_count || 0))}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                    >
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
