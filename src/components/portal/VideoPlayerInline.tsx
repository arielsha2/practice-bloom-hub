import { useEffect, useRef, useCallback } from 'react';
import { getVideoEmbedUrl, VideoSource } from '@/lib/videoUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Video, ExternalLink } from 'lucide-react';

interface VideoPlayerInlineProps {
  url: string;
  source?: VideoSource;
  onProgress?: (positionSeconds: number) => void;
  onEnded?: () => void;
  initialPosition?: number;
}

export function VideoPlayerInline({ 
  url, 
  source,
  onProgress,
  onEnded,
  initialPosition = 0
}: VideoPlayerInlineProps) {
  const { t, isRTL } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastReportedPosition = useRef(0);

  // Report progress every 10 seconds
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !onProgress) return;
    
    const currentTime = Math.floor(videoRef.current.currentTime);
    if (currentTime - lastReportedPosition.current >= 10) {
      lastReportedPosition.current = currentTime;
      onProgress(currentTime);
    }
  }, [onProgress]);

  const handleEnded = useCallback(() => {
    onEnded?.();
  }, [onEnded]);

  // Set initial position when video loads
  useEffect(() => {
    if (videoRef.current && initialPosition > 0) {
      videoRef.current.currentTime = initialPosition;
    }
  }, [initialPosition]);

  // Handle Zoom - show friendly message with button to open in new tab
  if (source === 'zoom') {
    return (
      <div className="relative aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">
              {t('portal.video.zoomTitle')}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t('portal.video.zoomDescription')}
            </p>
          </div>
          <Button
            onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {t('portal.video.watchButton')}
          </Button>
        </div>
      </div>
    );
  }

  // Check if it's an embeddable video (YouTube, Vimeo)
  const embedUrl = source ? getVideoEmbedUrl(url, source) : null;
  const isEmbeddable = embedUrl !== null;

  if (isEmbeddable) {
    return (
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

  // Direct video file
  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
