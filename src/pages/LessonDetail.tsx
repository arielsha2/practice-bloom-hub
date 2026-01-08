import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { ExpandableDescription } from '@/components/portal/ExpandableDescription';
import { ResourceItem } from '@/components/portal/ResourceItem';
import { QASection } from '@/components/portal/QASection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Info } from 'lucide-react';
import type { VideoSource } from '@/lib/videoUtils';

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
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;
      setCurrentLesson(lessonData);

      // Fetch resources via lesson_media_links with media_library join
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

      // Transform to Resource format
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
  const files = resources.filter(r => r.type !== 'video');

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
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <LessonSidebar
          lessons={allLessons}
          currentLessonId={id || ''}
          watchedLessons={watchedLessons}
          onSelectLesson={handleSelectLesson}
        />

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('auth.loading')}
            </div>
          ) : !currentLesson ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('portal.lessonNotFound')}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Admin Controls */}
              {isAdmin && currentLesson && (
                <LessonAdminControls
                  lesson={currentLesson}
                  onUpdate={() => fetchLessonData(currentLesson.id)}
                />
              )}

              {/* Video Player */}
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

              {/* Lesson title */}
              <h1 className="text-2xl font-bold">{currentLesson.title}</h1>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {isRTL ? 'סקירה' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {isRTL ? 'קבצים מצורפים' : 'Attachments'} ({files.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <ExpandableDescription description={currentLesson.description} />
                  
                  {/* Q&A Section */}
                  <div className="pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-4">
                      {isRTL ? 'שאלות ותשובות' : 'Questions & Answers'}
                    </h2>
                    <QASection lessonId={id} />
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
                          type={resource.type === 'document' ? 'pdf' : resource.type === 'presentation' ? 'ppt' : 'pdf'}
                          filePath={resource.file_path}
                          url={resource.url}
                          source={resource.source}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
