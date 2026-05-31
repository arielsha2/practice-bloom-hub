import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUsersManagement } from '@/hooks/useUsersManagement';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { UsersTable } from '@/components/admin/UsersTable';
import { PendingUsersTable } from '@/components/admin/PendingUsersTable';
import { CourseAssignmentDialog } from '@/components/admin/CourseAssignmentDialog';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { AddUserDialog } from '@/components/admin/AddUserDialog';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Users, Loader2, UserPlus } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string | null;
}

export default function UsersAdmin() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const {
    users,
    enrollments,
    courses,
    cohorts,
    isLoading,
    assignToCourse,
    removeFromCourse,
    changeRole,
    addPendingUser,
    deletePendingEnrollment,
    getUserEnrollments,
    getPendingEnrollments,
    getUserRole,
    getUserCohorts,
    hasMentorAccess,
    toggleMentorAccess,
  } = useUsersManagement();

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

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
    setAssignDialogOpen(true);
  };

  const handleChangeRole = (user: UserProfile) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleAssign = (courseKey: string, cohortId: string | null) => {
    if (selectedUser && selectedUser.email) {
      assignToCourse.mutate(
        { userId: selectedUser.id, email: selectedUser.email, courseKey, cohortId },
        {
          onSuccess: () => {
            // Keep dialog open to allow multiple assignments
          },
        }
      );
    }
  };

  const handleRemoveFromCourse = (enrollmentId: string) => {
    removeFromCourse.mutate({ enrollmentId });
  };

  const handleRoleChange = (newRole: 'admin' | 'course_member' | null, currentRole: 'admin' | 'course_member' | null) => {
    if (selectedUser) {
      changeRole.mutate(
        { userId: selectedUser.id, newRole, currentRole },
        {
          onSuccess: () => {
            setRoleDialogOpen(false);
          },
        }
      );
    }
  };

  const handleAddPendingUser = (data: {
    email: string;
    fullName: string | null;
    courseKey: string | null;
    cohortId: string | null;
    pendingRole: 'admin' | 'course_member' | null;
    pendingMentor: boolean;
    notes: string | null;
  }) => {
    addPendingUser.mutate(data, {
      onSuccess: () => {
        setAddUserDialogOpen(false);
      },
    });
  };

  const handleDeletePendingEnrollment = (enrollmentId: string) => {
    deletePendingEnrollment.mutate({ enrollmentId });
  };

  const selectedUserEnrollments = selectedUser
    ? getUserEnrollments(selectedUser.id).map(e => ({ course_key: e.course_key, cohort_id: e.cohort_id }))
    : [];

  const selectedUserRole = selectedUser ? getUserRole(selectedUser.id) : 'none';
  const pendingEnrollments = getPendingEnrollments();

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
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
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
            <Button onClick={() => setAddUserDialogOpen(true)}>
              <UserPlus className="w-4 h-4 me-2" />
              {isRTL ? 'הוסף משתמש' : 'Add User'}
            </Button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <UsersTable
                users={users}
                enrollments={enrollments}
                courses={courses}
                cohorts={cohorts}
                getUserRole={getUserRole}
                getUserCohorts={getUserCohorts}
                hasMentorAccess={hasMentorAccess}
                onAssignCourse={handleAssignCourse}
                onRemoveFromCourse={handleRemoveFromCourse}
                onChangeRole={handleChangeRole}
              />

              <PendingUsersTable
                pendingEnrollments={pendingEnrollments}
                courses={courses}
                cohorts={cohorts}
                onDelete={handleDeletePendingEnrollment}
                isDeleting={deletePendingEnrollment.isPending}
              />
            </>
          )}
        </div>
      </main>

      <Footer />

      <CourseAssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        user={selectedUser}
        courses={courses}
        cohorts={cohorts}
        enrollments={selectedUserEnrollments}
        onAssign={handleAssign}
        isAssigning={assignToCourse.isPending}
      />

      <RoleChangeDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={selectedUser}
        currentRole={selectedUserRole}
        onChangeRole={handleRoleChange}
        isChanging={changeRole.isPending}
        hasMentorAccess={selectedUser ? hasMentorAccess(selectedUser.id) : false}
        onToggleMentor={(enable) => {
          if (selectedUser) toggleMentorAccess.mutate({ userId: selectedUser.id, enable });
        }}
      />

      <AddUserDialog
        open={addUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
        courses={courses}
        cohorts={cohorts}
        onAddUser={handleAddPendingUser}
        isAdding={addPendingUser.isPending}
      />
    </div>
  );
}
