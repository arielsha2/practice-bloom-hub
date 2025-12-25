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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Video, FileText, MessageCircle } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
}

interface Resource {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'ppt';
  file_path: string;
}

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, isRTL } = useLanguage();
  const { loading: authLoading } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useIsCourseMember();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

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

      // Fetch resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('lesson_resources')
        .select('*')
        .eq('lesson_id', id)
        .order('created_at', { ascending: true });

      if (resourcesError) throw resourcesError;
      setResources((resourcesData || []).map(r => ({
        ...r,
        type: r.type as 'video' | 'pdf' | 'ppt'
      })));
    } catch (error) {
      console.error('Error fetching lesson:', error);
    } finally {
      setIsLoading(false);
    }
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
      {videoUrl && <VideoPlayer url={videoUrl} onClose={() => setVideoUrl(null)} />}
      
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
                        type={resource.type}
                        filePath={resource.file_path}
                        onPlay={setVideoUrl}
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
                        type={resource.type}
                        filePath={resource.file_path}
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
