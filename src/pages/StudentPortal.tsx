import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsCourseMember } from '@/hooks/useIsCourseMember';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProgress } from '@/hooks/useUserProgress';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { ContinueLearningSection } from '@/components/portal/ContinueLearningSection';
import { LessonThumbnailCard } from '@/components/portal/LessonThumbnailCard';
import { QASection } from '@/components/portal/QASection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookOpen, MessageCircle, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface MediaItem {
  id: string;
  thumbnail_url: string | null;
  url: string | null;
}

interface LessonWithMedia extends Lesson {
  media: MediaItem | null;
}

export default function StudentPortal() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const { isAdmin } = useIsAdmin();
  const { isLessonWatched, getLessonProgress, isLoading: progressLoading } = useUserProgress();
  const [lessons, setLessons] = useState<LessonWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (hasAccess) {
      fetchLessons();
    }
  }, [hasAccess]);

  const fetchLessons = async () => {
    try {
      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch first video media for each lesson (for thumbnails)
      const lessonsWithMedia: LessonWithMedia[] = await Promise.all(
        (lessonsData || []).map(async (lesson) => {
          const { data: linkData } = await supabase
            .from('lesson_media_links')
            .select(`
              media:media_library(id, thumbnail_url, url)
            `)
            .eq('lesson_id', lesson.id)
            .order('display_order', { ascending: true })
            .limit(1)
            .single();

          return {
            ...lesson,
            media: linkData?.media as MediaItem | null
          };
        })
      );

      setLessons(lessonsWithMedia);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the next lesson to show
  const { nextLesson, isInProgress } = useMemo(() => {
    if (lessons.length === 0) return { nextLesson: null, isInProgress: false };

    // First check for lessons in progress (started but not finished)
    for (const lesson of lessons) {
      const progress = getLessonProgress(lesson.id);
      if (progress && !progress.watched && progress.last_position_seconds > 0) {
        return { nextLesson: lesson, isInProgress: true };
      }
    }

    // Find first unwatched lesson
    for (const lesson of lessons) {
      if (!isLessonWatched(lesson.id)) {
        return { nextLesson: lesson, isInProgress: false };
      }
    }

    // All lessons watched - show first lesson
    return { nextLesson: lessons[0] || null, isInProgress: false };
  }, [lessons, getLessonProgress, isLessonWatched]);

  // Other lessons (excluding the featured one)
  const otherLessons = useMemo(() => {
    if (!nextLesson) return lessons;
    return lessons.filter(l => l.id !== nextLesson.id);
  }, [lessons, nextLesson]);

  const handlePlayLesson = (lessonId: string) => {
    navigate(`/portal/lesson/${lessonId}`);
  };

  if (authLoading || accessLoading || progressLoading) {
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
      
      {/* Hero Header */}
      <div className="bg-secondary pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-medium text-foreground mb-2">
                {t('portal.title')}
              </h1>
              <p className="text-muted-foreground">
                {isRTL ? 'המשך מהמקום שהפסקת' : 'Continue where you left off'}
              </p>
            </div>
            {isAdmin && (
              <Link to="/portal/admin">
                <Button variant="outline" className="shadow-soft">
                  <Settings className="w-4 h-4 me-2" />
                  {t('portal.admin.title')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-12">

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

          <TabsContent value="lessons" className="space-y-8">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('auth.loading')}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portal.noLessons')}
              </div>
            ) : (
              <>
                {/* Featured/Next Lesson Section */}
                <ContinueLearningSection
                  lesson={nextLesson}
                  media={nextLesson?.media || null}
                  isInProgress={isInProgress}
                  onPlay={() => nextLesson && handlePlayLesson(nextLesson.id)}
                />

                {/* Other Lessons */}
                {otherLessons.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium text-muted-foreground">
                      {isRTL ? 'השיעורים שלך' : 'Your lessons'}
                    </h2>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 pb-4">
                        {otherLessons.map((lesson) => (
                          <div key={lesson.id} className="w-48 shrink-0">
                            <LessonThumbnailCard
                              id={lesson.id}
                              title={lesson.title}
                              thumbnailUrl={lesson.media?.thumbnail_url}
                              isWatched={isLessonWatched(lesson.id)}
                              onClick={() => handlePlayLesson(lesson.id)}
                            />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                )}
              </>
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
