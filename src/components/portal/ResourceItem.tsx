import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Video, FileText, Presentation, Download, Play, Youtube, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import type { VideoSource } from '@/lib/videoUtils';

interface ResourceItemProps {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'ppt';
  filePath: string | null;
  url?: string | null;
  source?: VideoSource;
  onPlay?: (url: string, source: VideoSource) => void;
}

export function ResourceItem({ 
  id, 
  title, 
  type, 
  filePath, 
  url, 
  source = 'file', 
  onPlay 
}: ResourceItemProps) {
  const { t, isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = () => {
    if (type === 'video') {
      switch (source) {
        case 'youtube':
          return <Youtube className="w-5 h-5" />;
        case 'vimeo':
          return <Video className="w-5 h-5" />;
        case 'zoom':
          return <ExternalLink className="w-5 h-5" />;
        default:
          return <Video className="w-5 h-5" />;
      }
    }
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'ppt':
        return <Presentation className="w-5 h-5" />;
      default:
        return <Video className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    if (type === 'video') {
      switch (source) {
        case 'youtube':
          return 'YouTube';
        case 'vimeo':
          return 'Vimeo';
        case 'zoom':
          return t('portal.zoomRecording');
        default:
          return t('portal.video');
      }
    }
    switch (type) {
      case 'pdf':
        return t('portal.exercise');
      case 'ppt':
        return t('portal.presentation');
      default:
        return type;
    }
  };

  const handleAction = async () => {
    // For external video sources (YouTube, Vimeo, Zoom)
    if (type === 'video' && source !== 'file' && url) {
      if (onPlay) {
        onPlay(url, source);
      }
      return;
    }

    // For file-based resources
    if (!filePath) {
      toast.error(t('portal.downloadError'));
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      if (type === 'video' && onPlay) {
        onPlay(data.signedUrl, 'file');
      } else {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error(t('portal.downloadError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 bg-muted/50 rounded-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
          {getIcon()}
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{getTypeLabel()}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAction}
        disabled={isLoading}
      >
        {type === 'video' ? (
          <>
            <Play className="w-4 h-4 me-1" />
            {t('portal.watch')}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 me-1" />
            {t('portal.download')}
          </>
        )}
      </Button>
    </div>
  );
}
