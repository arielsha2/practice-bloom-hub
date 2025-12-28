import { useState, useRef, useEffect } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Video, Presentation, FileText, Youtube, Link, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { parseVideoUrl, validateVideoUrl, type VideoSource } from '@/lib/videoUtils';

type ResourceType = 'video' | 'ppt' | 'pdf';
type VideoUploadMode = 'file' | 'youtube' | 'vimeo' | 'zoom';

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
  const [videoMode, setVideoMode] = useState<VideoUploadMode>('file');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Validate URL when it changes
  useEffect(() => {
    if (type !== 'video' || videoMode === 'file' || !videoUrl.trim()) {
      setUrlValidation(null);
      return;
    }

    const isValid = validateVideoUrl(videoUrl, videoMode as VideoSource);
    setUrlValidation({
      isValid,
      message: isValid ? t('portal.admin.validUrl') : t('portal.admin.invalidUrl'),
    });
  }, [videoUrl, videoMode, type, t]);

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
    if (!title.trim()) return;

    // For video with external URL
    if (type === 'video' && videoMode !== 'file') {
      if (!videoUrl.trim() || !urlValidation?.isValid) {
        toast.error(t('portal.admin.invalidUrl'));
        return;
      }

      setIsUploading(true);
      try {
        const { error: dbError } = await supabase.from('lesson_resources').insert({
          lesson_id: lessonId,
          title: title.trim(),
          type: 'video',
          source: videoMode,
          url: videoUrl.trim(),
          file_path: null,
        });

        if (dbError) throw dbError;

        toast.success(t('portal.admin.fileUploaded'));
        resetForm();
        onUploaded();
      } catch (error) {
        console.error('Error saving video link:', error);
        toast.error(t('portal.admin.fileError'));
      } finally {
        setIsUploading(false);
      }
      return;
    }

    // For file upload
    if (!file) return;

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
        source: 'file',
        url: null,
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
    setVideoMode('file');
    setVideoUrl('');
    setUrlValidation(null);
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

  const isSubmitDisabled = () => {
    if (isUploading || !title.trim()) return true;
    
    if (type === 'video' && videoMode !== 'file') {
      return !videoUrl.trim() || !urlValidation?.isValid;
    }
    
    return !file;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-md">
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

          {/* Video source selection - only for video type */}
          {type === 'video' && (
            <div className="space-y-3">
              <Label>{t('portal.admin.videoSource')}</Label>
              <RadioGroup
                value={videoMode}
                onValueChange={(value) => {
                  setVideoMode(value as VideoUploadMode);
                  setVideoUrl('');
                  setUrlValidation(null);
                }}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="file" id="mode-file" />
                  <Label htmlFor="mode-file" className="flex items-center gap-1 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {t('portal.admin.uploadFile')}
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="youtube" id="mode-youtube" />
                  <Label htmlFor="mode-youtube" className="flex items-center gap-1 cursor-pointer">
                    <Youtube className="w-4 h-4" />
                    YouTube
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="vimeo" id="mode-vimeo" />
                  <Label htmlFor="mode-vimeo" className="flex items-center gap-1 cursor-pointer">
                    <Video className="w-4 h-4" />
                    Vimeo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="zoom" id="mode-zoom" />
                  <Label htmlFor="mode-zoom" className="flex items-center gap-1 cursor-pointer">
                    <Link className="w-4 h-4" />
                    Zoom
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* URL input for external video sources */}
          {type === 'video' && videoMode !== 'file' && (
            <div className="space-y-2">
              <Label htmlFor="video-url">{t('portal.admin.enterUrl')}</Label>
              <div className="relative">
                <Input
                  id="video-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    videoMode === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : videoMode === 'vimeo'
                      ? 'https://vimeo.com/...'
                      : 'https://zoom.us/rec/...'
                  }
                  className="pe-10"
                />
                {urlValidation && (
                  <div className="absolute end-3 top-1/2 -translate-y-1/2">
                    {urlValidation.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                )}
              </div>
              {urlValidation && (
                <p className={`text-sm ${urlValidation.isValid ? 'text-green-600' : 'text-destructive'}`}>
                  {urlValidation.message}
                </p>
              )}
            </div>
          )}

          {/* File input - for file uploads */}
          {(type !== 'video' || videoMode === 'file') && (
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
          )}

          <Button
            type="submit"
            disabled={isSubmitDisabled()}
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
