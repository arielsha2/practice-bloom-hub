import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EnrolledCourse {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  description: string | null;
  is_active: boolean | null;
}

export function useUserEnrolledCourses() {
  const { user } = useAuth();

  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ['user-enrolled-courses', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get enrollments for user
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('course_key')
        .eq('user_id', user.id);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Get unique course keys
      const courseKeys = [...new Set(enrollments.map(e => e.course_key))];

      // Get course details
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('course_key', courseKeys)
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      return (courses || []) as EnrolledCourse[];
    },
    enabled: !!user,
  });

  return {
    enrolledCourses: enrolledCourses || [],
    isLoading,
    hasMultipleCourses: (enrolledCourses?.length || 0) > 1,
  };
}
