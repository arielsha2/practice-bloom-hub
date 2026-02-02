import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
}

interface AdminLessonFormProps {
  onLessonAdded: () => void;
  courses: Course[];
  selectedCourseKey: string;
}

export function AdminLessonForm({ onLessonAdded, courses, selectedCourseKey }: AdminLessonFormProps) {
  const { t, isRTL } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseKey, setCourseKey] = useState(selectedCourseKey);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update courseKey when selectedCourseKey changes
  useState(() => {
    setCourseKey(selectedCourseKey);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseKey) return;

    setIsSubmitting(true);
    try {
      // Get max order_index for the selected course
      const { data: maxOrder } = await supabase
        .from('lessons')
        .select('order_index')
        .eq('course_key', courseKey)
        .order('order_index', { ascending: false })
        .limit(1)
        .single();

      const newOrderIndex = (maxOrder?.order_index ?? -1) + 1;

      const { error } = await supabase.from('lessons').insert({
        title: title.trim(),
        description: description.trim() || null,
        order_index: newOrderIndex,
        course_key: courseKey,
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
          {/* Course Selection */}
          <div className="space-y-2">
            <Label>{isRTL ? 'קורס' : 'Course'} *</Label>
            <Select value={courseKey} onValueChange={setCourseKey}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'בחר קורס' : 'Select course'} />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.course_key} value={course.course_key}>
                    {isRTL ? course.name_he : course.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
          <Button type="submit" disabled={isSubmitting || !title.trim() || !courseKey}>
            <Save className="w-4 h-4 me-1" />
            {isSubmitting ? t('contents.admin.saving') : t('contents.admin.save')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
