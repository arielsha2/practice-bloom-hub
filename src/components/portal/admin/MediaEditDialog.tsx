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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Pencil, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MediaItem } from '@/pages/MediaLibrary';

interface MediaEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem;
  onUpdated: () => void;
}

export function MediaEditDialog({ open, onOpenChange, media, onUpdated }: MediaEditDialogProps) {
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState(media.title);
  const [description, setDescription] = useState(media.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lessonNames, setLessonNames] = useState<string[]>([]);

  useEffect(() => {
    setTitle(media.title);
    setDescription(media.description || '');
    fetchLessonUsage();
  }, [media]);

  const fetchLessonUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_media_links')
        .select('lesson_id, lessons(title)')
        .eq('media_id', media.id);

      if (error) throw error;

      const names = data?.map((link: any) => link.lessons?.title).filter(Boolean) || [];
      setLessonNames(names);
    } catch (error) {
      console.error('Error fetching lesson usage:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('media_library')
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq('id', media.id);

      if (error) throw error;

      toast.success(t('contents.admin.saveSuccess'));
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating media:', error);
      toast.error(t('contents.admin.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            {t('media.edit')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">{t('media.columnTitle')}</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">{t('media.description')}</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('media.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Media info (read-only) */}
          <div className="space-y-2">
            <Label>{t('media.columnType')}</Label>
            <div>
              <Badge variant="secondary">
                {t(`media.type${media.media_kind.charAt(0).toUpperCase() + media.media_kind.slice(1)}`)}
              </Badge>
            </div>
          </div>

          {/* Lesson usage */}
          {lessonNames.length > 0 && (
            <div className="space-y-2">
              <Label>{t('media.usedInLessonsLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {lessonNames.map((name, idx) => (
                  <Badge key={idx} variant="outline">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={isSaving || !title.trim()} className="w-full">
            {isSaving ? (
              <Loader2 className="w-4 h-4 me-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 me-1" />
            )}
            {isSaving ? t('contents.admin.saving') : t('contents.admin.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
