import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
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
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  const { data: enrolledCourses, isLoading } = useQuery({
    queryKey: ['user-enrolled-courses', user?.id, user?.email, isAdmin],
    queryFn: async () => {
      if (!user?.email) {
        return [];
      }

      // Admins see all active courses
      if (isAdmin) {
        const { data: allCourses, error } = await supabase
          .from('courses')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        return (allCourses || []) as EnrolledCourse[];
      }

      // Regular users - check enrollments by email
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('student_enrollments')
        .select('course_key')
        .ilike('email', user.email);

      if (enrollmentError) throw enrollmentError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      const courseKeys = [...new Set(enrollments.map(e => e.course_key))];

      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .in('course_key', courseKeys)
        .eq('is_active', true);

      if (coursesError) throw coursesError;

      return (courses || []) as EnrolledCourse[];
    },
    enabled: !!user?.email && !adminLoading,
  });

  return {
    enrolledCourses: enrolledCourses || [],
    isLoading: isLoading || adminLoading,
    hasMultipleCourses: (enrolledCourses?.length || 0) > 1,
  };
}
