import { useLanguage } from '@/contexts/LanguageContext';
import { Folder, FolderOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useState } from 'react';

interface FolderCardProps {
  name: string;
  count: number;
  onClick: () => void;
  onDelete?: () => void;
  onDropMedia?: (mediaId: string) => void;
  isUnsorted?: boolean;
  isActive?: boolean;
}

export function FolderCard({ name, count, onClick, onDelete, onDropMedia, isUnsorted, isActive }: FolderCardProps) {
  const { t, isRTL } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      className={`relative group border rounded-lg px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors flex items-center gap-3 ${
        isDragOver ? 'ring-2 ring-primary bg-primary/5' : ''
      } ${isActive ? 'bg-primary/10 border-primary' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const mediaId = e.dataTransfer.getData('media-id');
        if (mediaId && onDropMedia) {
          onDropMedia(mediaId);
        }
      }}
    >
      {isHovered || isDragOver ? (
        <FolderOpen className="w-5 h-5 text-primary flex-shrink-0" />
      ) : (
        <Folder className={`w-5 h-5 flex-shrink-0 ${isUnsorted ? 'text-muted-foreground' : 'text-primary'}`} />
      )}
      <span className="text-sm font-medium truncate">{name}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">({count})</span>

      {onDelete && !isUnsorted && (
        <div className="absolute top-1 end-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('media.deleteFolder')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('media.deleteFolderWarning')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('contents.admin.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('contents.admin.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
