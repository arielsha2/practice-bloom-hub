import { useState } from 'react';
import { Header } from '@/components/landing/Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { ProgressOverview } from '@/components/dashboard/ProgressOverview';
import { NextStepCard } from '@/components/dashboard/NextStepCard';
import { LessonsGrid } from '@/components/dashboard/LessonsGrid';
import { AdminStats } from '@/components/dashboard/AdminStats';
import { AdminQuickActions } from '@/components/dashboard/AdminQuickActions';
import { UnansweredQuestions } from '@/components/dashboard/UnansweredQuestions';
import { LessonProgressChart } from '@/components/dashboard/LessonProgressChart';
import { RecentUsersTable } from '@/components/dashboard/RecentUsersTable';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { SEOHead } from '@/components/SEOHead';

export default function Dashboard() {
  const { t, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const userStats = useDashboardStats();
  const [adminPage, setAdminPage] = useState(0);
  const adminStats = useAdminDashboardStats(adminPage);
  const isMobile = useIsMobile();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  const isLoading = authLoading || userStats.isLoading || (isAdmin && adminStats.isLoading);

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {t('dashboard.welcome')} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-8">
            {/* User Progress Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('dashboard.myProgress')}</h2>
              <ProgressOverview
                totalLessons={userStats.totalLessons}
                watchedLessons={userStats.watchedLessons}
                remainingLessons={userStats.remainingLessons}
              />
            </section>

            {/* Next Step */}
            <section>
              <NextStepCard lesson={userStats.nextLesson} />
            </section>

            {/* Lessons Grid */}
            <section>
              <LessonsGrid lessons={userStats.lessons} />
            </section>

            {/* Admin Section */}
            {isAdmin && !adminLoading && (
              <>
                <Separator className="my-8" />
                
                <section>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {t('dashboard.admin.title')}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Admin
                    </span>
                  </h2>
                  
                  <div className="space-y-6">
                    <AdminStats
                      totalUsers={adminStats.totalUsers}
                      activeUsers={adminStats.activeUsers}
                      completionPercent={adminStats.overallCompletionPercent}
                    />

                    <AdminQuickActions />

                    <UnansweredQuestions />

                    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                      <LessonProgressChart lessonStats={adminStats.lessonStats} />
                      <RecentUsersTable
                        users={adminStats.recentUsers}
                        currentPage={adminStats.currentPage}
                        totalPages={adminStats.totalPages}
                        onPageChange={setAdminPage}
                      />
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
