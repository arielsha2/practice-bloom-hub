import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsCourseMember } from '@/hooks/useIsCourseMember';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useUserEnrolledCourses } from '@/hooks/useUserEnrolledCourses';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { CourseProgressHeader } from '@/components/portal/CourseProgressHeader';
import { LessonListItem } from '@/components/portal/LessonListItem';
import { QASection } from '@/components/portal/QASection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, MessageCircle, Settings, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  course_key: string | null;
}

interface MediaItem {
  id: string;
  thumbnail_url: string | null;
  url: string | null;
  duration_seconds: number | null;
}

interface LessonWithMedia extends Lesson {
  media: MediaItem | null;
}

export default function StudentPortal() {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = tab === 'qa' ? 'qa' : 'lessons';
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const { isAdmin } = useIsAdmin();
  const { isLessonWatched, getLessonProgress, isLoading: progressLoading } = useUserProgress();
  const { enrolledCourses, hasMultipleCourses, isLoading: coursesLoading } = useUserEnrolledCourses();
  const [lessons, setLessons] = useState<LessonWithMedia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string>('');

  // Set default course when enrolled courses load
  useEffect(() => {
    if (enrolledCourses.length > 0 && !selectedCourseKey) {
      setSelectedCourseKey(enrolledCourses[0].course_key);
    }
  }, [enrolledCourses, selectedCourseKey]);

  useEffect(() => {
    if (hasAccess && selectedCourseKey) {
      fetchLessons();
    }
  }, [hasAccess, selectedCourseKey]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_key', selectedCourseKey)
        .order('order_index', { ascending: true });

      if (lessonsError) throw lessonsError;

      const lessonsWithMedia: LessonWithMedia[] = await Promise.all(
        (lessonsData || []).map(async (lesson) => {
          const { data: linkData } = await supabase
            .from('lesson_media_links')
            .select(`
              media:media_library(id, thumbnail_url, url, duration_seconds)
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
  const { nextLesson, isInProgress, nextLessonIndex } = useMemo(() => {
    if (lessons.length === 0) return { nextLesson: null, isInProgress: false, nextLessonIndex: -1 };

    // First check for lessons in progress
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      const progress = getLessonProgress(lesson.id);
      if (progress && !progress.watched && progress.last_position_seconds > 0) {
        return { nextLesson: lesson, isInProgress: true, nextLessonIndex: i };
      }
    }

    // Find first unwatched lesson
    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      if (!isLessonWatched(lesson.id)) {
        return { nextLesson: lesson, isInProgress: false, nextLessonIndex: i };
      }
    }

    // All lessons watched - show first lesson
    return { nextLesson: lessons[0] || null, isInProgress: false, nextLessonIndex: 0 };
  }, [lessons, getLessonProgress, isLessonWatched]);

  // Calculate progress stats
  const { completedCount, totalCount } = useMemo(() => {
    const completed = lessons.filter(l => isLessonWatched(l.id)).length;
    return { completedCount: completed, totalCount: lessons.length };
  }, [lessons, isLessonWatched]);

  const handlePlayLesson = (lessonId: string) => {
    navigate(`/portal/lesson/${lessonId}`);
  };

  // Format duration helper
  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return undefined;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || accessLoading || progressLoading || coursesLoading) {
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

  // Get current course name
  const currentCourse = enrolledCourses.find(c => c.course_key === selectedCourseKey);
  const courseName = currentCourse 
    ? (isRTL ? currentCourse.name_he : currentCourse.name_en)
    : '';

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      
      {/* Progress Header - Udemy style dark header */}
      <div className="pt-16">
        <CourseProgressHeader 
          totalLessons={totalCount}
          completedLessons={completedCount}
          courseTitle={courseName}
        />
      </div>

      {/* Admin Link */}
      {isAdmin && (
        <div className="container mx-auto px-4 py-3 border-b">
          <Link to="/portal/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              {t('portal.admin.title')}
            </Button>
          </Link>
        </div>
      )}

      {/* Course Tabs - only show if enrolled in multiple courses */}
      {hasMultipleCourses && (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {enrolledCourses.map((course) => (
              <Button
                key={course.course_key}
                variant={selectedCourseKey === course.course_key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourseKey(course.course_key)}
                className="whitespace-nowrap"
              >
                {isRTL ? course.name_he : course.name_en}
              </Button>
            ))}
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(val) => navigate(`/portal/${val}`, { replace: true })} className="space-y-6">
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

          <TabsContent value="lessons" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('auth.loading')}
              </div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portal.noLessons')}
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Course Content - appears on the end side (right in RTL, left in LTR) */}
                <Card className="lg:col-span-2 lg:order-1">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium">
                        {isRTL ? 'תוכן הקורס' : 'Course Content'}
                      </CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {isRTL 
                          ? `${totalCount} שיעורים`
                          : `${totalCount} lessons`
                        }
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="divide-y">
                      {lessons.map((lesson, index) => {
                        const progress = getLessonProgress(lesson.id);
                        const isLessonInProgress = progress && !progress.watched && progress.last_position_seconds > 0;
                        
                        return (
                          <LessonListItem
                            key={lesson.id}
                            index={index + 1}
                            title={lesson.title}
                            duration={formatDuration(lesson.media?.duration_seconds)}
                            isWatched={isLessonWatched(lesson.id)}
                            isActive={nextLesson?.id === lesson.id}
                            isInProgress={isLessonInProgress || false}
                            onClick={() => handlePlayLesson(lesson.id)}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Continue Learning Card - appears on the start side (left in RTL, right in LTR) */}
                <Card className="lg:col-span-1 lg:order-2 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium text-muted-foreground">
                      {isInProgress 
                        ? (isRTL ? 'המשיכי מאיפה שעצרת' : 'Continue where you left off')
                        : (isRTL ? 'הצעד הבא שלך' : 'Your next step')
                      }
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {nextLesson ? (
                      <>
                        {/* Thumbnail */}
                        <div 
                          onClick={() => handlePlayLesson(nextLesson.id)}
                          className="group relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer"
                        >
                          {nextLesson.media?.thumbnail_url ? (
                            <img
                              src={nextLesson.media.thumbnail_url}
                              alt={nextLesson.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                          )}
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              <Play className="w-6 h-6 text-primary-foreground fill-current ms-0.5" />
                            </div>
                          </div>

                          {/* Duration badge */}
                          {nextLesson.media?.duration_seconds && (
                            <div className="absolute bottom-2 end-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                              {formatDuration(nextLesson.media.duration_seconds)}
                            </div>
                          )}
                        </div>

                        {/* Lesson info */}
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {isRTL ? `שיעור ${nextLessonIndex + 1}` : `Lesson ${nextLessonIndex + 1}`}
                          </p>
                          <h3 className="font-semibold line-clamp-2">{nextLesson.title}</h3>
                          {nextLesson.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {nextLesson.description}
                            </p>
                          )}
                        </div>

                        {/* Play button */}
                        <Button 
                          onClick={() => handlePlayLesson(nextLesson.id)}
                          className="w-full gap-2"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          {isInProgress 
                            ? (isRTL ? 'המשך צפייה' : 'Continue watching')
                            : (isRTL ? 'התחל שיעור' : 'Start lesson')
                          }
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        {isRTL ? 'סיימת את כל השיעורים! 🎉' : 'You completed all lessons! 🎉'}
                      </div>
                    )}
                  </CardContent>
                </Card>
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
