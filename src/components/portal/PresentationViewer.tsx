import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    async function getUrl() {
      setIsLoading(true);
      setIframeError(false);
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

  const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => window.open(pdfUrl, '_blank')}
        >
          <ExternalLink className="w-3 h-3" />
          {isRTL ? 'פתח בחלון חדש' : 'Open in new tab'}
        </Button>
      </div>

      {!iframeError ? (
        <iframe
          src={googleViewerUrl}
          className="w-full flex-1 rounded-lg border min-h-0"
          title="Presentation"
          onError={() => setIframeError(true)}
        />
      ) : (
        <div className="flex-1 bg-muted rounded-lg flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileText className="w-8 h-8" />
          <p className="text-sm">{isRTL ? 'לא ניתן להציג את המצגת' : 'Cannot display presentation'}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => window.open(pdfUrl, '_blank')}
          >
            <Download className="w-3 h-3" />
            {isRTL ? 'הורד קובץ' : 'Download file'}
          </Button>
        </div>
      )}
    </div>
  );
}
