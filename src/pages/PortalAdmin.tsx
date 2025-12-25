import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { AdminLessonForm } from '@/components/portal/admin/AdminLessonForm';
import { AdminQAList } from '@/components/portal/admin/AdminQAList';
import { SortableLessonCard } from '@/components/portal/admin/SortableLessonCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  order_index: number;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  file_path: string;
  lesson_id: string;
}

export default function PortalAdmin() {
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [lessonsRes, resourcesRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, order_index')
          .order('order_index', { ascending: true }),
        supabase
          .from('lesson_resources')
          .select('id, title, type, file_path, lesson_id'),
      ]);

      if (lessonsRes.error) throw lessonsRes.error;
      if (resourcesRes.error) throw resourcesRes.error;

      setLessons(lessonsRes.data || []);
      setResources(resourcesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);

      const newLessons = arrayMove(lessons, oldIndex, newIndex);
      setLessons(newLessons);

      // Update order_index in database
      try {
        const updates = newLessons.map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title,
          order_index: index,
        }));

        for (const update of updates) {
          const { error } = await supabase
            .from('lessons')
            .update({ order_index: update.order_index })
            .eq('id', update.id);

          if (error) throw error;
        }

        toast.success(t('portal.admin.orderUpdated'));
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error(t('portal.admin.deleteError'));
        // Revert on error
        fetchData();
      }
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm(t('contents.admin.deleteWarning'))) return;

    try {
      // Get resources for this lesson to delete from storage
      const lessonResources = resources.filter((r) => r.lesson_id === lessonId);

      // Delete files from storage
      if (lessonResources.length > 0) {
        const filePaths = lessonResources.map((r) => r.file_path);
        await supabase.storage.from('course-materials').remove(filePaths);
      }

      // Delete lesson (cascade will delete resources)
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;
      toast.success(t('portal.admin.lessonDeleted'));
      fetchData();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error(t('portal.admin.deleteError'));
    }
  };

  const getResourcesForLesson = (lessonId: string) => {
    return resources.filter((r) => r.lesson_id === lessonId);
  };

  // Count unanswered questions
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchUnansweredCount();
    }
  }, [isAdmin]);

  const fetchUnansweredCount = async () => {
    const { count } = await supabase
      .from('qa_threads')
      .select('*', { count: 'exact', head: true })
      .is('answer', null);
    setUnansweredCount(count || 0);
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

        <div className="space-y-8">
          {/* Add Lesson Form */}
          <AdminLessonForm onLessonAdded={fetchData} />

          {/* Lessons List with Drag & Drop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('portal.admin.existingLessons')}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {t('portal.admin.dragToReorder')}
                </span>
              </CardTitle>
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={lessons.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {lessons.map((lesson, index) => (
                        <SortableLessonCard
                          key={lesson.id}
                          lesson={lesson}
                          index={index}
                          resources={getResourcesForLesson(lesson.id)}
                          onDelete={handleDeleteLesson}
                          onResourceChange={fetchData}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Q&A Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {t('portal.qa')}
                {unansweredCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {unansweredCount} {t('portal.admin.unanswered')}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdminQAList />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
