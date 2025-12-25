import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  url: string;
  onClose: () => void;
}

export function VideoPlayer({ url, onClose }: VideoPlayerProps) {
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
