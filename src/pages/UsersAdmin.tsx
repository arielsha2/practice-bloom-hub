import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { UsersTable } from '@/components/admin/UsersTable';
import { CourseAssignmentDialog } from '@/components/admin/CourseAssignmentDialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Users, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
}

export default function UsersAdmin() {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const {
    users,
    enrollments,
    courses,
    isLoading,
    assignToCourse,
    removeFromCourse,
    getUserEnrollments,
  } = useUsersManagement();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const handleAssignCourse = (user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  };

  const handleAssign = (courseKey: string) => {
    if (selectedUser && selectedUser.email) {
      assignToCourse.mutate(
        { userId: selectedUser.id, email: selectedUser.email, courseKey },
        {
          onSuccess: () => {
            setDialogOpen(false);
          },
        }
      );
    }
  };

  const handleRemoveFromCourse = (enrollmentId: string) => {
    removeFromCourse.mutate({ enrollmentId });
  };

  const selectedUserEnrollments = selectedUser
    ? getUserEnrollments(selectedUser.id).map(e => e.course_key)
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowIcon className="w-4 h-4 rotate-180" />
                {isRTL ? 'חזרה לדשבורד' : 'Back to Dashboard'}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground">
                {isRTL ? 'ניהול משתמשים' : 'User Management'}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? 'שייך משתמשים לקורסים ונהל הרשאות' : 'Assign users to courses and manage permissions'}
              </p>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <UsersTable
              users={users}
              enrollments={enrollments}
              courses={courses}
              onAssignCourse={handleAssignCourse}
              onRemoveFromCourse={handleRemoveFromCourse}
            />
          )}
        </div>
      </main>

      <Footer />

      <CourseAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        courses={courses}
        enrolledCourseKeys={selectedUserEnrollments}
        onAssign={handleAssign}
        isAssigning={assignToCourse.isPending}
      />
    </div>
  );
}
