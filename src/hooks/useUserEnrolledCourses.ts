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
    queryKey: ['user-enrolled-courses', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.email) {
        console.log('[useUserEnrolledCourses] No user or email');
        return [];
      }

      console.log('[useUserEnrolledCourses] Fetching enrollments for email:', user.email);

      // Get enrollments for user by email (matching RLS policy)
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('course_key')
        .ilike('email', user.email);

      console.log('[useUserEnrolledCourses] Enrollments result:', { enrollments, error: enrollmentError });

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        console.log('[useUserEnrolledCourses] No enrollments found');
        return [];
      }

      // Get unique course keys
      const courseKeys = [...new Set(enrollments.map(e => e.course_key))];
      console.log('[useUserEnrolledCourses] Course keys:', courseKeys);

      // Get course details
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('course_key', courseKeys)
        .eq('is_active', true);

      console.log('[useUserEnrolledCourses] Courses result:', { courses, error: coursesError });

      if (coursesError) throw coursesError;

      return (courses || []) as EnrolledCourse[];
    },
    enabled: !!user?.email,
  });

  return {
    enrolledCourses: enrolledCourses || [],
    isLoading,
    hasMultipleCourses: (enrolledCourses?.length || 0) > 1,
  };
}
