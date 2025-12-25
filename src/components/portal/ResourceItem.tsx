import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Video, FileText, Presentation, Download, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';

interface ResourceItemProps {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'ppt';
  filePath: string;
  onPlay?: (url: string) => void;
}

export function ResourceItem({ id, title, type, filePath, onPlay }: ResourceItemProps) {
  const { t, isRTL } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'ppt':
        return <Presentation className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'video':
        return t('portal.video');
      case 'pdf':
        return t('portal.exercise');
      case 'ppt':
        return t('portal.presentation');
    }
  };

  const handleAction = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      if (type === 'video' && onPlay) {
        onPlay(data.signedUrl);
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
