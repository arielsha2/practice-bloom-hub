import { useEffect, useRef, useCallback } from 'react';
import { getVideoEmbedUrl, VideoSource } from '@/lib/videoUtils';

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

  // Check if it's an embeddable video (YouTube, Vimeo, Zoom)
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
