import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface LessonEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    title: string;
    description: string | null;
  };
  onSaved: () => void;
}

export function LessonEditDialog({
  open,
  onOpenChange,
  lesson,
  onSaved,
}: LessonEditDialogProps) {
  const { isRTL, t } = useLanguage();
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
    }
  }, [open, lesson]);

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          title: title.trim(),
          description: description.trim() || null,
        })
        .eq('id', lesson.id);

      if (error) throw error;

      toast.success(isRTL ? 'השיעור עודכן' : 'Lesson updated');
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast.error(isRTL ? 'שגיאה בעדכון' : 'Error updating');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'עריכת פרטי שיעור' : 'Edit Lesson Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{isRTL ? 'כותרת' : 'Title'}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRTL ? 'שם השיעור...' : 'Lesson title...'}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('portal.admin.description')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('portal.admin.descriptionPlaceholder')}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRTL ? 'ביטול' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || isSaving}>
            {isSaving ? (isRTL ? 'שומר...' : 'Saving...') : (isRTL ? 'שמור' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
