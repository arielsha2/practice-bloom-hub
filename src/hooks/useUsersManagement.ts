import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
  plan?: string | null;
  trial_start_date?: string | null;
  plan_updated_at?: string | null;
}

export type TrialStatus = 'paid' | 'active' | 'expired' | 'none';

interface Enrollment {
  id: string;
  user_id: string | null;
  email: string;
  course_key: string;
  cohort_id: string | null;
  enrolled_at: string | null;
  activated_at: string | null;
  full_name: string | null;
  pending_role: string | null;
  pending_mentor?: boolean | null;
  notes: string | null;
}

interface Course {
  id: string;
  course_key: string;
  name_he: string;
  name_en: string;
  is_active: boolean | null;
  cohort_id: string | null;
}

interface Cohort {
  id: string;
  name_he: string;
  name_en: string;
  is_active: boolean | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'course_member' | 'mentor';
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
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      
      if (error) throw error;
      return data as Course[];
    },
  });

  // Fetch all cohorts
  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery({
    queryKey: ['cohorts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Cohort[];
    },
  });

  // Fetch all user roles
  const { data: userRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data as UserRole[];
    },
  });

  // Assign user to course with cohort
  const assignToCourse = useMutation({
    mutationFn: async ({ userId, email, courseKey, cohortId }: { 
      userId: string; 
      email: string; 
      courseKey: string;
      cohortId?: string | null;
    }) => {
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          user_id: userId,
          email: email.toLowerCase(),
          course_key: courseKey,
          cohort_id: cohortId || null,
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
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
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

  // Change user role
  const changeRole = useMutation({
    mutationFn: async ({ 
      userId, 
      newRole, 
      currentRole 
    }: { 
      userId: string; 
      newRole: 'admin' | 'course_member' | null; 
      currentRole: 'admin' | 'course_member' | null;
    }) => {
      // Remove current role if exists
      if (currentRole) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', currentRole);
        
        if (deleteError) throw deleteError;
      }

      // Add new role if specified
      if (newRole) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        
        if (insertError && !insertError.message.includes('duplicate')) {
          throw insertError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'התפקיד עודכן' : 'Role updated',
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

  // Add pending user (whitelist)
  const addPendingUser = useMutation({
    mutationFn: async ({
      email,
      fullName,
      courseKey,
      cohortId,
      pendingRole,
      pendingMentor,
      notes,
    }: {
      email: string;
      fullName: string | null;
      courseKey: string | null;
      cohortId: string | null;
      pendingRole: 'admin' | 'course_member' | null;
      pendingMentor: boolean;
      notes: string | null;
    }) => {
      // Check for existing enrollment with same email and course (skip for mentor-only)
      if (courseKey) {
        const existing = enrollments.find(
          e => e.email.toLowerCase() === email.toLowerCase() && e.course_key === courseKey
        );
        if (existing) {
          throw new Error(isRTL ? 'משתמש כבר קיים בקורס זה' : 'User already exists in this course');
        }
      }

      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          email: email.toLowerCase(),
          full_name: fullName,
          course_key: courseKey,
          cohort_id: cohortId,
          pending_role: pendingRole,
          pending_mentor: pendingMentor,
          notes: notes,
          // user_id stays null - will be filled when user signs up
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enrollments'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'המשתמש נוסף לרשימת ההמתנה' : 'User added to pending list',
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

  // Delete pending enrollment
  const deletePendingEnrollment = useMutation({
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
        description: isRTL ? 'הרשומה נמחקה' : 'Entry deleted',
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

  // Get pending enrollments (user_id is null)
  const getPendingEnrollments = () => {
    return enrollments.filter(e => e.user_id === null);
  };

  // Check if user is enrolled in specific course
  const isEnrolledInCourse = (userId: string, courseKey: string) => {
    return enrollments.some(e => e.user_id === userId && e.course_key === courseKey);
  };

  // Get user's primary role
  const getUserRole = (userId: string): 'admin' | 'student' | 'none' => {
    const roles = userRoles.filter(r => r.user_id === userId);
    if (roles.some(r => r.role === 'admin')) return 'admin';
    if (roles.some(r => r.role === 'course_member')) return 'student';
    return 'none';
  };

  // Check if user has mentor access
  const hasMentorAccess = (userId: string): boolean => {
    return userRoles.some(r => r.user_id === userId && r.role === 'mentor');
  };

  // Toggle mentor access
  const toggleMentorAccess = useMutation({
    mutationFn: async ({ userId, enable }: { userId: string; enable: boolean }) => {
      if (enable) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'mentor' });
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'mentor');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast({
        title: isRTL ? 'הצלחה' : 'Success',
        description: isRTL ? 'הרשאת המנטור עודכנה' : 'Mentor access updated',
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

  // Get cohorts for a user based on their enrollments
  const getUserCohorts = (userId: string): Cohort[] => {
    const userEnrollments = enrollments.filter(e => e.user_id === userId && e.cohort_id);
    const cohortIds = [...new Set(userEnrollments.map(e => e.cohort_id))];
    return cohorts.filter(c => cohortIds.includes(c.id));
  };

  // Get cohort name by ID
  const getCohortName = (cohortId: string | null) => {
    if (!cohortId) return null;
    const cohort = cohorts.find(c => c.id === cohortId);
    return cohort ? (isRTL ? cohort.name_he : cohort.name_en) : null;
  };

  return {
    users,
    enrollments,
    courses,
    cohorts,
    userRoles,
    isLoading: usersLoading || enrollmentsLoading || coursesLoading || cohortsLoading || rolesLoading,
    assignToCourse,
    removeFromCourse,
    changeRole,
    addPendingUser,
    deletePendingEnrollment,
    getUserEnrollments,
    getPendingEnrollments,
    isEnrolledInCourse,
    getUserRole,
    getUserCohorts,
    getCohortName,
    hasMentorAccess,
    toggleMentorAccess,
  };
}
