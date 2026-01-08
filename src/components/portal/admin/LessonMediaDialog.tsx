import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Video, FileText, Presentation, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { MediaPickerDialog } from './MediaPickerDialog';

interface MediaItem {
  id: string;
  title: string;
  media_kind: string;
  link_id: string;
}

interface LessonMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  onUpdate: () => void;
}

export function LessonMediaDialog({
  open,
  onOpenChange,
  lessonId,
  onUpdate,
}: LessonMediaDialogProps) {
  const { isRTL, t } = useLanguage();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open, lessonId]);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_media_links')
        .select(`
          id,
          media:media_library(id, title, media_kind)
        `)
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const transformed = (data || [])
        .filter((item: any) => item.media)
        .map((item: any) => ({
          id: item.media.id,
          title: item.media.title,
          media_kind: item.media.media_kind,
          link_id: item.id,
        }));

      setMedia(transformed);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('lesson_media_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast.success(t('media.removedFromLesson'));
      fetchMedia();
      onUpdate();
    } catch (error) {
      console.error('Error removing media:', error);
      toast.error(isRTL ? 'שגיאה בהסרה' : 'Error removing');
    }
  };

  const handleMediaAdded = () => {
    fetchMedia();
    onUpdate();
  };

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'video':
        return Video;
      case 'presentation':
        return Presentation;
      default:
        return FileText;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'ניהול מדיה' : 'Manage Media'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('media.addToLesson')}
            </Button>

            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {isRTL ? 'אין מדיה מקושרת' : 'No media linked'}
                </div>
              ) : (
                <div className="space-y-2">
                  {media.map((item) => {
                    const Icon = getIcon(item.media_kind);
                    return (
                      <div
                        key={item.link_id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm truncate">{item.title}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleRemove(item.link_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        lessonId={lessonId}
        existingMediaIds={media.map((m) => m.id)}
        onMediaAdded={handleMediaAdded}
      />
    </>
  );
}
