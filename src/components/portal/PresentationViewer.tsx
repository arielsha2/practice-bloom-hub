import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';
import type { VideoSource } from '@/lib/videoUtils';

interface PresentationViewerProps {
  filePath: string | null;
  url: string | null;
  source: VideoSource;
}

export function PresentationViewer({ filePath, url, source }: PresentationViewerProps) {
  const { isRTL } = useLanguage();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getUrl() {
      setIsLoading(true);
      if (url) {
        setPdfUrl(url);
      } else if (filePath) {
        const { data } = await supabase.storage
          .from('course-materials')
          .createSignedUrl(filePath, 3600);
        setPdfUrl(data?.signedUrl || null);
      } else {
        setPdfUrl(null);
      }
      setIsLoading(false);
    }
    getUrl();
  }, [filePath, url]);

  if (isLoading) {
    return (
      <div className="h-full bg-muted rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">
          {isRTL ? 'טוען מצגת...' : 'Loading presentation...'}
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="h-full bg-muted rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileText className="w-8 h-8" />
        <p className="text-sm">{isRTL ? 'אין מצגת זמינה' : 'No presentation available'}</p>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-full rounded-lg border"
      title="Presentation"
    />
  );
}
