import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  description: string | null;
  is_active: boolean | null;
  cohort_id: string | null;
  created_at: string | null;
  cohort?: {
    id: string;
    name_he: string;
    name_en: string;
  } | null;
  lesson_count?: number;
}

interface CreateCourseInput {
  courseKey: string;
  nameHe: string;
  nameEn: string;
  description?: string;
  cohortId?: string | null;
}

interface UpdateCourseInput {
  id: string;
  nameHe: string;
  nameEn: string;
  description?: string;
  cohortId?: string | null;
  isActive?: boolean;
}

export function useCourseManagement() {
  const queryClient = useQueryClient();
  const { isRTL } = useLanguage();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses-with-cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          cohort:cohorts(id, name_he, name_en)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get lesson counts for each course
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .eq('course_key', course.course_key);

          return {
            ...course,
            lesson_count: count || 0,
          };
        })
      );

      return coursesWithCounts as Course[];
    },
  });

  const createCourse = useMutation({
    mutationFn: async ({ courseKey, nameHe, nameEn, description, cohortId }: CreateCourseInput) => {
      const { error } = await supabase.from('courses').insert({
        course_key: courseKey,
        name_he: nameHe,
        name_en: nameEn,
        description: description || null,
        cohort_id: cohortId || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses-with-cohorts'] });
      toast.success(isRTL ? 'הקורס נוצר בהצלחה' : 'Course created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating course:', error);
      toast.error(isRTL ? 'שגיאה ביצירת הקורס' : 'Error creating course');
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ id, nameHe, nameEn, description, cohortId, isActive }: UpdateCourseInput) => {
      const { error } = await supabase
        .from('courses')
        .update({
          name_he: nameHe,
          name_en: nameEn,
          description: description || null,
          cohort_id: cohortId || null,
          is_active: isActive ?? true,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses-with-cohorts'] });
      toast.success(isRTL ? 'הקורס עודכן בהצלחה' : 'Course updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating course:', error);
      toast.error(isRTL ? 'שגיאה בעדכון הקורס' : 'Error updating course');
    },
  });

  const deleteCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses-with-cohorts'] });
      toast.success(isRTL ? 'הקורס נמחק בהצלחה' : 'Course deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting course:', error);
      toast.error(isRTL ? 'שגיאה במחיקת הקורס' : 'Error deleting course');
    },
  });

  return {
    courses,
    isLoading,
    createCourse,
    updateCourse,
    deleteCourse,
  };
}
