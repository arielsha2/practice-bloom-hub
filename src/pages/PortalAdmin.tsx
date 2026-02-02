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
import { useCourseManagement } from '@/hooks/useCourseManagement';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { AdminLessonForm } from '@/components/portal/admin/AdminLessonForm';
import { AdminQAList } from '@/components/portal/admin/AdminQAList';
import { SortableLessonCard } from '@/components/portal/admin/SortableLessonCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, ArrowLeft, MessageCircle, FolderOpen } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  order_index: number;
  course_key: string | null;
}

interface MediaLink {
  id: string;
  media_id: string;
  lesson_id: string;
  display_order: number;
  media: {
    id: string;
    title: string;
    media_kind: string;
    file_path: string | null;
    url: string | null;
    source: string;
  };
}

export default function PortalAdmin() {
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { courses } = useCourseManagement();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [mediaLinks, setMediaLinks] = useState<MediaLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>('');

  // Set default course when courses load
  useEffect(() => {
    if (courses && courses.length > 0 && !selectedCourseKey) {
      setSelectedCourseKey(courses[0].course_key);
    }
  }, [courses, selectedCourseKey]);

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
      const [lessonsRes, mediaLinksRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title, order_index, course_key')
          .order('order_index', { ascending: true }),
        supabase
          .from('lesson_media_links')
          .select(`
            id,
            media_id,
            lesson_id,
            display_order,
            media:media_library(id, title, media_kind, file_path, url, source)
          `)
          .order('display_order', { ascending: true }),
      ]);

      if (lessonsRes.error) throw lessonsRes.error;
      if (mediaLinksRes.error) throw mediaLinksRes.error;

      setLessons(lessonsRes.data || []);
      setMediaLinks((mediaLinksRes.data || []) as unknown as MediaLink[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lessons by selected course
  const filteredLessons = selectedCourseKey
    ? lessons.filter((l) => l.course_key === selectedCourseKey)
    : lessons;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredLessons.findIndex((l) => l.id === active.id);
      const newIndex = filteredLessons.findIndex((l) => l.id === over.id);

      const newFilteredLessons = arrayMove(filteredLessons, oldIndex, newIndex);
      
      // Update the full lessons array with new order
      const updatedLessons = lessons.map((lesson) => {
        const newIdx = newFilteredLessons.findIndex((l) => l.id === lesson.id);
        if (newIdx !== -1) {
          return { ...lesson, order_index: newIdx };
        }
        return lesson;
      });
      setLessons(updatedLessons);

      // Update order_index in database
      try {
        const updates = newFilteredLessons.map((lesson, index) => ({
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
      // Get media links for this lesson to find files to delete from storage
      const lessonMediaLinks = mediaLinks.filter((ml) => ml.lesson_id === lessonId);
      
      // Get unique file paths that need to be deleted
      // Note: We only delete files that are not used by other lessons
      const mediaIdsInLesson = new Set(lessonMediaLinks.map((ml) => ml.media_id));
      const mediaIdsInOtherLessons = new Set(
        mediaLinks
          .filter((ml) => ml.lesson_id !== lessonId)
          .map((ml) => ml.media_id)
      );
      
      const mediaOnlyInThisLesson = lessonMediaLinks.filter(
        (ml) => !mediaIdsInOtherLessons.has(ml.media_id) && ml.media?.file_path
      );

      // Delete files from storage (only if not used elsewhere)
      if (mediaOnlyInThisLesson.length > 0) {
        const filePaths = mediaOnlyInThisLesson
          .map((ml) => ml.media?.file_path)
          .filter(Boolean) as string[];
        if (filePaths.length > 0) {
          await supabase.storage.from('course-materials').remove(filePaths);
        }
      }

      // Delete lesson (cascade will delete links, but not the media itself)
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
    return mediaLinks
      .filter((ml) => ml.lesson_id === lessonId)
      .map((ml) => ({
        id: ml.id,
        media_id: ml.media_id,
        title: ml.media?.title || '',
        type: ml.media?.media_kind || '',
        file_path: ml.media?.file_path || null,
        url: ml.media?.url || null,
        source: (ml.media?.source || 'file') as 'file' | 'youtube' | 'vimeo' | 'zoom',
        display_order: ml.display_order,
      }));
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
        <div className="flex items-center justify-between mb-4">
          <Link to="/portal">
            <Button variant="ghost">
              <BackIcon className="w-4 h-4 me-1" />
              {t('portal.back')}
            </Button>
          </Link>
          <Link to="/media-library">
            <Button variant="outline">
              <FolderOpen className="w-4 h-4 me-2" />
              {t('media.title')}
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">{t('portal.admin.title')}</h1>

        <div className="space-y-8">
          {/* Course Filter */}
          {courses && courses.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {isRTL ? 'סנן לפי קורס:' : 'Filter by course:'}
              </span>
              <Select 
                value={selectedCourseKey || '__none__'} 
                onValueChange={(value) => setSelectedCourseKey(value === '__none__' ? '' : value)}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder={isRTL ? 'בחר קורס' : 'Select course'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {isRTL ? 'כל הקורסים' : 'All courses'}
                  </SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.course_key} value={course.course_key}>
                      {isRTL ? course.name_he : course.name_en} ({course.lesson_count || 0} {isRTL ? 'שיעורים' : 'lessons'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Add Lesson Form */}
          <AdminLessonForm 
            onLessonAdded={fetchData} 
            courses={courses || []}
            selectedCourseKey={selectedCourseKey}
          />

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
              ) : filteredLessons.length === 0 ? (
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
                    items={filteredLessons.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {filteredLessons.map((lesson, index) => (
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
