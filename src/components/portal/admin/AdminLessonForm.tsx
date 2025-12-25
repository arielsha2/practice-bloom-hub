import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLessonFormProps {
  onLessonAdded: () => void;
}

export function AdminLessonForm({ onLessonAdded }: AdminLessonFormProps) {
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Get max order_index
      const { data: maxOrder } = await supabase
        .from('lessons')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

      const { error } = await supabase.from('lessons').insert({
        title: title.trim(),
        description: description.trim() || null,
        order_index: newOrderIndex,
      });

      if (error) throw error;

      toast.success(t('portal.admin.lessonAdded'));
      setTitle('');
      setDescription('');
      onLessonAdded();
    } catch (error) {
      console.error('Error adding lesson:', error);
      toast.error(t('portal.admin.lessonError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          {t('portal.admin.addLesson')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lesson-title">{t('contents.form.title')}</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contents.form.titlePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-description">{t('portal.admin.description')}</Label>
            <Textarea
              id="lesson-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('portal.admin.descriptionPlaceholder')}
              className="min-h-20"
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !title.trim()}>
            <Save className="w-4 h-4 me-1" />
            {isSubmitting ? t('contents.admin.saving') : t('contents.admin.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
