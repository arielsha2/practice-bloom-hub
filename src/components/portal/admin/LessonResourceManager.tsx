import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Video, Presentation, FileText, Plus, Trash2, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ResourceUploadDialog } from './ResourceUploadDialog';

interface Resource {
  id: string;
  title: string;
  type: string;
  file_path: string;
}

interface LessonResourceManagerProps {
  lessonId: string;
  resources: Resource[];
  onResourceChange: () => void;
}

type ResourceType = 'video' | 'ppt' | 'pdf';

export function LessonResourceManager({
  lessonId,
  resources,
  onResourceChange,
}: LessonResourceManagerProps) {
  const { t, isRTL } = useLanguage();
  const [uploadType, setUploadType] = useState<ResourceType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const videoResources = resources.filter((r) => r.type === 'video');
  const pptResources = resources.filter((r) => r.type === 'ppt');
  const pdfResources = resources.filter((r) => r.type === 'pdf');

  const handleDelete = async (resource: Resource) => {
    if (!confirm(t('contents.admin.deleteWarning'))) return;

    setDeletingId(resource.id);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('course-materials')
        .remove([resource.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('lesson_resources')
        .delete()
        .eq('id', resource.id);

      if (dbError) throw dbError;

      toast.success(t('portal.admin.resourceDeleted'));
      onResourceChange();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error(t('portal.admin.deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (resource: Resource) => {
    try {
      const { data, error } = await supabase.storage
        .from('course-materials')
        .createSignedUrl(resource.file_path, 3600);

      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast.error(t('portal.downloadError'));
    }
  };

  const ResourceSection = ({
    type,
    icon: Icon,
    label,
    items,
  }: {
    type: ResourceType;
    icon: typeof Video;
    label: string;
    items: Resource[];
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUploadType(type)}
          className="h-7 text-xs"
        >
          <Plus className="w-3 h-3 me-1" />
          {t('portal.admin.addResource')}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-2">
          {t('portal.admin.noResources')}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-sm"
            >
              <span className="truncate max-w-[150px]">{resource.title}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleView(resource)}
                >
                  {type === 'video' ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(resource)}
                  disabled={deletingId === resource.id}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 border-t pt-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <ResourceSection
        type="video"
        icon={Video}
        label={t('portal.videos')}
        items={videoResources}
      />
      <ResourceSection
        type="ppt"
        icon={Presentation}
        label={t('portal.admin.presentations')}
        items={pptResources}
      />
      <ResourceSection
        type="pdf"
        icon={FileText}
        label={t('portal.admin.worksheets')}
        items={pdfResources}
      />

      <ResourceUploadDialog
        open={uploadType !== null}
        onOpenChange={(open) => !open && setUploadType(null)}
        lessonId={lessonId}
        type={uploadType || 'video'}
        onUploaded={() => {
          setUploadType(null);
          onResourceChange();
        }}
      />
    </div>
  );
}
