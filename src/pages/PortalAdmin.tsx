import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { AdminLessonForm } from '@/components/portal/admin/AdminLessonForm';
import { AdminFileUpload } from '@/components/portal/admin/AdminFileUpload';
import { AdminQAList } from '@/components/portal/admin/AdminQAList';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, BookOpen, Upload, MessageCircle, Trash2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  order_index: number;
}

export default function PortalAdmin() {
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchLessons();
    }
  }, [isAdmin]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, order_index')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(t('contents.admin.deleteWarning'))) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      toast.success(t('portal.admin.lessonDeleted'));
      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (authLoading || adminLoading) {
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

  if (!isAdmin) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Link to="/portal">
          <Button variant="ghost" className="mb-4">
            <BackIcon className="w-4 h-4 me-1" />
            {t('portal.back')}
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-8">{t('portal.admin.title')}</h1>

        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lessons" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {t('portal.lessons')}
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {t('portal.admin.uploadFile')}
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {t('portal.qa')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-6">
            <AdminLessonForm onLessonAdded={fetchLessons} />

            <Card>
              <CardHeader>
                <CardTitle>{t('portal.admin.existingLessons')}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('auth.loading')}
                  </div>
                ) : lessons.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('portal.noLessons')}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium">{lesson.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <AdminFileUpload lessons={lessons} onFileUploaded={() => {}} />
          </TabsContent>

          <TabsContent value="qa">
            <AdminQAList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
