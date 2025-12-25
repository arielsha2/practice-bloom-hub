import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Video, Presentation, FileText } from 'lucide-react';
import { toast } from 'sonner';

type ResourceType = 'video' | 'ppt' | 'pdf';

interface ResourceUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: string;
  type: ResourceType;
  onUploaded: () => void;
}

export function ResourceUploadDialog({
  open,
  onOpenChange,
  lessonId,
  type,
  onUploaded,
}: ResourceUploadDialogProps) {
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const getConfig = () => {
    switch (type) {
      case 'video':
        return {
          accept: 'video/mp4,video/webm',
          folder: 'videos',
          icon: Video,
          label: t('portal.admin.addVideo'),
        };
      case 'ppt':
        return {
          accept:
            'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
          folder: 'presentations',
          icon: Presentation,
          label: t('portal.admin.addPresentation'),
        };
      case 'pdf':
        return {
          accept: 'application/pdf',
          folder: 'exercises',
          icon: FileText,
          label: t('portal.admin.addWorksheet'),
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !file) return;

    setIsUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${config.folder}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase.from('lesson_resources').insert({
        lesson_id: lessonId,
        title: title.trim(),
        type: type,
        file_path: filePath,
      });

      if (dbError) throw dbError;

      toast.success(t('portal.admin.fileUploaded'));
      resetForm();
      onUploaded();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('portal.admin.fileError'));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {config.label}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource-title">{t('portal.admin.resourceTitle')}</Label>
            <Input
              id="resource-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contents.form.titlePlaceholder')}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-file">{t('portal.admin.selectFile')}</Label>
            <Input
              id="resource-file"
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button
            type="submit"
            disabled={isUploading || !title.trim() || !file}
            className="w-full"
          >
            <Upload className="w-4 h-4 me-1" />
            {isUploading ? t('portal.admin.uploading') : t('portal.admin.uploadFile')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
