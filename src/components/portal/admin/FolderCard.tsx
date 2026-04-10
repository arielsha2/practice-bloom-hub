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
  isUnsorted?: boolean;
}

export function FolderCard({ name, count, onClick, onDelete, isUnsorted }: FolderCardProps) {
  const { t, isRTL } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors flex flex-col items-center gap-2"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        if (isUnsorted) return;
        e.preventDefault();
        e.currentTarget.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/5');
      }}
      onDrop={(e) => {
        if (isUnsorted) return;
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-primary', 'bg-primary/5');
        const mediaId = e.dataTransfer.getData('media-id');
        if (mediaId && onDelete) {
          // onDelete is only set for real folders, not unsorted
          // We'll handle the drop via a custom event
          const event = new CustomEvent('media-drop-to-folder', {
            detail: { mediaId, folder: name },
          });
          window.dispatchEvent(event);
        }
      }}
    >
      {isHovered ? (
        <FolderOpen className="w-10 h-10 text-primary" />
      ) : (
        <Folder className={`w-10 h-10 ${isUnsorted ? 'text-muted-foreground' : 'text-primary'}`} />
      )}
      <span className="text-sm font-medium text-center truncate w-full">{name}</span>
      <span className="text-xs text-muted-foreground">
        {t('media.filesCount').replace('{count}', String(count))}
      </span>

      {/* Delete button */}
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
