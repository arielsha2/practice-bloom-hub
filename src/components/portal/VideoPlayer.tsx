import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import type { VideoSource } from '@/lib/videoUtils';
import { getVideoEmbedUrl } from '@/lib/videoUtils';

interface VideoPlayerProps {
  url: string;
  source?: VideoSource;
  onClose: () => void;
}

export function VideoPlayer({ url, source = 'file', onClose }: VideoPlayerProps) {
  const { t } = useLanguage();

  // Handle Zoom - open in new tab
  if (source === 'zoom') {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <div className="relative text-center space-y-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-foreground"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              {t('portal.zoomRecordingMessage')}
            </p>
            <Button
              size="lg"
              onClick={() => {
                window.open(url, '_blank', 'noopener,noreferrer');
                onClose();
              }}
            >
              <ExternalLink className="w-5 h-5 me-2" />
              {t('portal.openRecording')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle YouTube and Vimeo with iframe
  if (source === 'youtube' || source === 'vimeo') {
    const embedUrl = getVideoEmbedUrl(url, source);
    
    if (!embedUrl) {
      return (
        <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-destructive">{t('portal.invalidVideoUrl')}</p>
            <Button onClick={onClose}>{t('portal.back')}</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 text-foreground"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Video player"
            />
          </div>
        </div>
      </div>
    );
  }

  // Handle file-based video
  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-12 right-0 text-foreground"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </Button>
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-lg shadow-2xl"
          controlsList="nodownload"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
}
