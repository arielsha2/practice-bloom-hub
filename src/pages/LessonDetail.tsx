import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsCourseMember } from '@/hooks/useIsCourseMember';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/landing/Header';
import { PortalAccessDenied } from '@/components/portal/PortalAccessDenied';
import { ResourceItem } from '@/components/portal/ResourceItem';
import { VideoPlayer } from '@/components/portal/VideoPlayer';
import { QASection } from '@/components/portal/QASection';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Video, FileText, MessageCircle } from 'lucide-react';
import type { VideoSource } from '@/lib/videoUtils';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
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
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoPlayer, setVideoPlayer] = useState<{ url: string; source: VideoSource } | null>(null);

  useEffect(() => {
    if (hasAccess && id) {
      fetchLessonData();
    }
  }, [hasAccess, id]);

  const fetchLessonData = async () => {
    try {
      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;
      setLesson(lessonData);

      // Fetch resources via lesson_media_links with media_library join
      const { data: linksData, error: linksError } = await supabase
        .from('lesson_media_links')
        .select(`
          id,
          display_order,
          media:media_library(id, title, media_kind, file_path, url, source)
        `)
        .eq('lesson_id', id)
        .order('display_order', { ascending: true });

      if (linksError) throw linksError;

      // Transform to Resource format
      const transformedResources: Resource[] = (linksData || [])
        .filter((link: any) => link.media)
        .map((link: any) => ({
          id: link.id,
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

  const handlePlayVideo = (url: string, source: VideoSource) => {
    setVideoPlayer({ url, source });
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

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

  const videos = resources.filter((r) => r.type === 'video');
  const files = resources.filter((r) => r.type !== 'video');

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <Header />
      {videoPlayer && (
        <VideoPlayer 
          url={videoPlayer.url} 
          source={videoPlayer.source} 
          onClose={() => setVideoPlayer(null)} 
        />
      )}
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Link to="/portal">
          <Button variant="ghost" className="mb-4">
            <BackIcon className="w-4 h-4 me-1" />
            {t('portal.back')}
          </Button>
        </Link>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('auth.loading')}
          </div>
        ) : !lesson ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('portal.lessonNotFound')}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
              {lesson.description && (
                <p className="text-muted-foreground">{lesson.description}</p>
              )}
            </div>

            <Tabs defaultValue="videos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="videos" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  {t('portal.videos')} ({videos.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('portal.files')} ({files.length})
                </TabsTrigger>
                <TabsTrigger value="qa" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {t('portal.qa')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="videos">
                {videos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('portal.noVideos')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videos.map((resource) => (
                      <ResourceItem
                        key={resource.id}
                        id={resource.id}
                        title={resource.title}
                        type="video"
                        filePath={resource.file_path}
                        url={resource.url}
                        source={resource.source}
                        onPlay={handlePlayVideo}
                      />
                    ))}
                  </div>
                )}
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

              <TabsContent value="qa">
                <QASection lessonId={id} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
