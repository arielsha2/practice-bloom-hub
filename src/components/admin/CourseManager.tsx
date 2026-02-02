import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { useCohortsManagement } from '@/hooks/useCohortsManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, BookOpen, Loader2 } from 'lucide-react';

interface CourseFormData {
  courseKey: string;
  nameHe: string;
  nameEn: string;
  description: string;
  cohortId: string;
  isActive: boolean;
}

const initialFormData: CourseFormData = {
  courseKey: '',
  nameHe: '',
  nameEn: '',
  description: '',
  cohortId: '',
  isActive: true,
};

export function CourseManager() {
  const { isRTL } = useLanguage();
  const { courses, isLoading, createCourse, updateCourse, deleteCourse } = useCourseManagement();
  const { cohorts } = useCohortsManagement();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);

  const handleOpenCreate = () => {
    setFormData(initialFormData);
    setEditingCourseId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (course: any) => {
    setFormData({
      courseKey: course.course_key,
      nameHe: course.name_he,
      nameEn: course.name_en,
      description: course.description || '',
      cohortId: course.cohort_id || '',
      isActive: course.is_active ?? true,
    });
    setEditingCourseId(course.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourseId) {
      await updateCourse.mutateAsync({
        id: editingCourseId,
        nameHe: formData.nameHe,
        nameEn: formData.nameEn,
        description: formData.description,
        cohortId: formData.cohortId || null,
        isActive: formData.isActive,
      });
    } else {
      await createCourse.mutateAsync({
        courseKey: formData.courseKey,
        nameHe: formData.nameHe,
        nameEn: formData.nameEn,
        description: formData.description,
        cohortId: formData.cohortId || null,
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (courseId: string) => {
    const confirmMessage = isRTL
      ? 'האם למחוק את הקורס? פעולה זו לא ניתנת לביטול.'
      : 'Delete this course? This action cannot be undone.';
    
    if (confirm(confirmMessage)) {
      await deleteCourse.mutateAsync(courseId);
    }
  };

  const isSubmitting = createCourse.isPending || updateCourse.isPending;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {isRTL ? 'ניהול קורסים' : 'Course Management'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'צור וערוך קורסים' : 'Create and edit courses'}
            </p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          {isRTL ? 'קורס חדש' : 'New Course'}
        </Button>
      </div>

      {/* Course List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : courses?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {isRTL ? 'אין קורסים עדיין' : 'No courses yet'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses?.map((course) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">
                        {isRTL ? course.name_he : course.name_en}
                      </h3>
                      <Badge variant={course.is_active ? 'default' : 'secondary'}>
                        {course.is_active
                          ? (isRTL ? 'פעיל' : 'Active')
                          : (isRTL ? 'לא פעיל' : 'Inactive')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRTL ? `מזהה: ${course.course_key}` : `Key: ${course.course_key}`}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {course.cohort && (
                        <span>
                          {isRTL ? 'מחזור: ' : 'Cohort: '}
                          {isRTL ? course.cohort.name_he : course.cohort.name_en}
                        </span>
                      )}
                      <span>
                        {isRTL
                          ? `${course.lesson_count} שיעורים`
                          : `${course.lesson_count} lessons`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(course)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>
              {editingCourseId
                ? (isRTL ? 'עריכת קורס' : 'Edit Course')
                : (isRTL ? 'קורס חדש' : 'New Course')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Key - only for new courses */}
            {!editingCourseId && (
              <div className="space-y-2">
                <Label htmlFor="courseKey">
                  {isRTL ? 'מזהה קורס (course_key)' : 'Course Key'} *
                </Label>
                <Input
                  id="courseKey"
                  value={formData.courseKey}
                  onChange={(e) => setFormData({ ...formData, courseKey: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                  placeholder="advanced_course"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? 'מזהה ייחודי באנגלית, ללא רווחים'
                    : 'Unique identifier, no spaces'}
                </p>
              </div>
            )}

            {/* Name Hebrew */}
            <div className="space-y-2">
              <Label htmlFor="nameHe">
                {isRTL ? 'שם בעברית' : 'Name (Hebrew)'} *
              </Label>
              <Input
                id="nameHe"
                value={formData.nameHe}
                onChange={(e) => setFormData({ ...formData, nameHe: e.target.value })}
                placeholder={isRTL ? 'שם הקורס' : 'Course name in Hebrew'}
                required
              />
            </div>

            {/* Name English */}
            <div className="space-y-2">
              <Label htmlFor="nameEn">
                {isRTL ? 'שם באנגלית' : 'Name (English)'} *
              </Label>
              <Input
                id="nameEn"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                placeholder="Course name in English"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {isRTL ? 'תיאור' : 'Description'}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={isRTL ? 'תיאור הקורס' : 'Course description'}
                className="min-h-20"
              />
            </div>

            {/* Cohort Selection */}
            <div className="space-y-2">
              <Label>{isRTL ? 'שיוך למחזור' : 'Assign to Cohort'}</Label>
              <Select
                value={formData.cohortId || '__none__'}
                onValueChange={(value) => setFormData({ ...formData, cohortId: value === '__none__' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'בחר מחזור (אופציונלי)' : 'Select cohort (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {isRTL ? 'ללא מחזור' : 'No cohort'}
                  </SelectItem>
                  {cohorts?.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {isRTL ? cohort.name_he : cohort.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle - only for editing */}
            {editingCourseId && (
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">
                  {isRTL ? 'קורס פעיל' : 'Course Active'}
                </Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {isRTL ? 'ביטול' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingCourseId ? (
                  isRTL ? 'עדכן' : 'Update'
                ) : (
                  isRTL ? 'צור קורס' : 'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
