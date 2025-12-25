import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsCourseMember } from '@/hooks/useIsCourseMember';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { LessonCard } from '@/components/portal/LessonCard';
import { QASection } from '@/components/portal/QASection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

export default function StudentPortal() {
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const { isAdmin } = useIsAdmin();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasAccess) {
      fetchLessons();
    }
  }, [hasAccess]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center py-12 text-muted-foreground">
            {t('auth.loading')}
          </div>
        </main>
      </div>
    );
  }

  if (!hasAccess) {
    return <PortalAccessDenied />;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{t('portal.title')}</h1>
          {isAdmin && (
            <Link to="/portal/admin">
              <Button variant="outline">
                <Settings className="w-4 h-4 me-1" />
                {t('portal.admin.title')}
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t('portal.lessons')}
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {t('portal.qa')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('auth.loading')}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portal.noLessons')}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {lessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    id={lesson.id}
                    title={lesson.title}
                    description={lesson.description}
                    orderIndex={lesson.order_index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="qa">
            <QASection />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
