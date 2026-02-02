import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
}

interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  course_key: string;
  enrolled_at: string | null;
  activated_at: string | null;
  full_name: string | null;
}

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  is_active: boolean | null;
}

export function useUsersManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isRTL } = useLanguage();

  // Fetch all profiles (registered users)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch all enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['admin-enrollments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_enrollments')
        .select('*');
      
      if (error) throw error;
      return data as Enrollment[];
    },
  });

  // Fetch all courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data as Course[];
    },
  });

  // Assign user to course
  const assignToCourse = useMutation({
    mutationFn: async ({ userId, email, courseKey }: { userId: string; email: string; courseKey: string }) => {
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          user_id: userId,
          email: email.toLowerCase(),
          course_key: courseKey,
          activated_at: new Date().toISOString(),
        });
      
      if (error) throw error;

      // Also add course_member role if not exists
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'course_member',
        });
      
      // Ignore duplicate role error
      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המשתמש שויך לקורס' : 'User assigned to course',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove user from course
  const removeFromCourse = useMutation({
    mutationFn: async ({ enrollmentId }: { enrollmentId: string }) => {
      const { error } = await supabase
        .from('student_enrollments')
        .delete()
        .eq('id', enrollmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המשתמש הוסר מהקורס' : 'User removed from course',
      });
    },
    onError: (error: Error) => {
      toast({
        title: isRTL ? 'שגיאה' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get enrollments for a specific user
  const getUserEnrollments = (userId: string) => {
    return enrollments.filter(e => e.user_id === userId);
  };

  // Check if user is enrolled in specific course
  const isEnrolledInCourse = (userId: string, courseKey: string) => {
    return enrollments.some(e => e.user_id === userId && e.course_key === courseKey);
  };

  return {
    users,
    enrollments,
    courses,
    isLoading: usersLoading || enrollmentsLoading || coursesLoading,
    assignToCourse,
    removeFromCourse,
    getUserEnrollments,
    isEnrolledInCourse,
  };
}
