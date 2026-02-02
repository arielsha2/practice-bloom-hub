import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { CohortsManager } from '@/components/admin/CohortsManager';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, GraduationCap, Loader2 } from 'lucide-react';

export default function CoursesAdmin() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

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
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display text-foreground">
                {isRTL ? 'ניהול קורסים ומחזורים' : 'Courses & Cohorts Management'}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? 'נהל מחזורים וקורסים' : 'Manage cohorts and courses'}
              </p>
            </div>
          </div>

          {/* Cohorts Manager */}
          <div className="max-w-3xl">
            <CohortsManager />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
