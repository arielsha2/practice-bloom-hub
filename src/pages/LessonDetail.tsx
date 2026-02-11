import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsCourseMember } from '@/hooks/useIsCourseMember';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserProgress } from '@/hooks/useUserProgress';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { LessonSidebar } from '@/components/portal/LessonSidebar';
import { LessonAdminControls } from '@/components/portal/admin/LessonAdminControls';
import { VideoPlayerInline } from '@/components/portal/VideoPlayerInline';
import { PresentationViewer } from '@/components/portal/PresentationViewer';
import { LessonNotes } from '@/components/portal/LessonNotes';
import { ExpandableDescription } from '@/components/portal/ExpandableDescription';
import { ResourceItem } from '@/components/portal/ResourceItem';
import { QASection } from '@/components/portal/QASection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Info, PanelLeftClose, PanelLeft, ChevronLeft, ChevronRight, StickyNote, Presentation } from 'lucide-react';
import type { VideoSource } from '@/lib/videoUtils';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'presentation' | 'audio' | 'link';
  file_path: string | null;
  url: string | null;
  source: VideoSource;
  display_order: number;
}

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const { isAdmin } = useIsAdmin();
  const { isLessonWatched, markAsWatched, updatePosition, isLoading: progressLoading } = useUserProgress();
  
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch all lessons for sidebar
  useEffect(() => {
    if (hasAccess) {
      fetchAllLessons();
    }
  }, [hasAccess]);

  // Fetch current lesson data when id changes
  useEffect(() => {
    if (hasAccess && id) {
      fetchLessonData(id);
    }
  }, [hasAccess, id]);

  const fetchAllLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, description, order_index')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAllLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchLessonData = async (lessonId: string) => {
    setIsLoading(true);
    try {
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setCurrentLesson(lessonData);

      const { data: linksData, error: linksError } = await supabase
        .from('lesson_media_links')
        .select(`
          id,
          display_order,
          media:media_library(id, title, media_kind, file_path, url, source)
        `)
        .eq('lesson_id', lessonId)
        .order('display_order', { ascending: true });

      if (linksError) throw linksError;

      const transformedResources: Resource[] = (linksData || [])
        .filter((link: any) => link.media)
        .map((link: any) => ({
          id: link.media.id,
          title: link.media.title,
          type: link.media.media_kind as Resource['type'],
          file_path: link.media.file_path,
          url: link.media.url,
          source: (link.media.source as VideoSource) || 'file',
          display_order: link.display_order,
        }));

      setResources(transformedResources);
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLesson = (lessonId: string) => {
    navigate(`/portal/lesson/${lessonId}`);
  };

  const handleVideoProgress = (positionSeconds: number) => {
    if (currentLesson && primaryVideo) {
      updatePosition(currentLesson.id, primaryVideo.id, positionSeconds);
    }
  };

  const handleVideoEnded = () => {
    if (currentLesson) {
      markAsWatched(currentLesson.id, primaryVideo?.id);
    }
  };

  // Navigation between lessons
  const currentIndex = allLessons.findIndex(l => l.id === id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLessonNav = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Get watched lessons set for sidebar
  const watchedLessons = useMemo(() => {
    const set = new Set<string>();
    allLessons.forEach(lesson => {
      if (isLessonWatched(lesson.id)) {
        set.add(lesson.id);
      }
    });
    return set;
  }, [allLessons, isLessonWatched]);

  // Split resources
  const primaryVideo = resources.find(r => r.type === 'video');
  const presentation = resources.find(r => r.type === 'presentation');
  const files = resources.filter(r => r.type !== 'video' && r.type !== 'presentation');

  // Get video URL
  const videoUrl = primaryVideo?.url || (primaryVideo?.file_path 
    ? supabase.storage.from('course-materials').getPublicUrl(primaryVideo.file_path).data.publicUrl 
    : null);

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
      
      <div className={cn("flex pt-16", isRTL && "flex-row-reverse")}>
        {/* Sidebar - collapsible */}
        {sidebarOpen && (
          <LessonSidebar
            lessons={allLessons}
            currentLessonId={id || ''}
            watchedLessons={watchedLessons}
            onSelectLesson={handleSelectLesson}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Compact top bar with toggle and navigation */}
          <div className="sticky top-16 z-10 bg-background border-b px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="shrink-0"
              >
                {sidebarOpen ? (
                  isRTL ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />
                ) : (
                  isRTL ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />
                )}
              </Button>
              
              <Link to="/portal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {isRTL ? '← חזרה לקורס' : '← Back to course'}
              </Link>
            </div>

            {/* Lesson navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                className="gap-1"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span className="hidden sm:inline">{isRTL ? 'הקודם' : 'Previous'}</span>
              </Button>
              
              <span className="text-sm text-muted-foreground px-2">
                {currentIndex + 1} / {allLessons.length}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                disabled={!nextLessonNav}
                onClick={() => nextLessonNav && handleSelectLesson(nextLessonNav.id)}
                className="gap-1"
              >
                <span className="hidden sm:inline">{isRTL ? 'הבא' : 'Next'}</span>
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('auth.loading')}
              </div>
            ) : !currentLesson ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('portal.lessonNotFound')}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Admin Controls */}
                {isAdmin && currentLesson && (
                  <LessonAdminControls
                    lesson={currentLesson}
                    onUpdate={() => fetchLessonData(currentLesson.id)}
                  />
                )}

                {/* Full-width Video */}
                <div className="w-full">
                  {videoUrl ? (
                    <VideoPlayerInline
                      url={videoUrl}
                      source={primaryVideo?.source}
                      onProgress={handleVideoProgress}
                      onEnded={handleVideoEnded}
                    />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">
                        {isRTL ? 'אין וידאו זמין' : 'No video available'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="notes" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="notes" className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4" />
                      {isRTL ? 'הערות אישיות' : 'Notes'}
                    </TabsTrigger>
                    {presentation && (
                      <TabsTrigger value="slides" className="flex items-center gap-2">
                        <Presentation className="w-4 h-4" />
                        {isRTL ? 'שקפים' : 'Slides'}
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="files" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {isRTL ? 'קבצים' : 'Files'} ({files.length})
                    </TabsTrigger>
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {isRTL ? 'סקירה' : 'Overview'}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="notes">
                    <LessonNotes lessonId={id} />
                  </TabsContent>

                  <TabsContent value="slides">
                    <div className="h-[500px]">
                      <PresentationViewer
                        filePath={presentation?.file_path || null}
                        url={presentation?.url || null}
                        source={presentation?.source || 'file'}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="files">
                    {files.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('portal.noFiles')}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {files.map((resource) => (
                          <ResourceItem
                            key={resource.id}
                            id={resource.id}
                            title={resource.title}
                            type={resource.type === 'document' ? 'pdf' : 'pdf'}
                            filePath={resource.file_path}
                            url={resource.url}
                            source={resource.source}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="overview" className="space-y-6">
                    <ExpandableDescription description={currentLesson.description} />
                    <div className="pt-6 border-t">
                      <h2 className="text-lg font-semibold mb-4">
                        {isRTL ? 'שאלות ותשובות' : 'Questions & Answers'}
                      </h2>
                      <QASection lessonId={id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
