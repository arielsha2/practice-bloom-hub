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
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Video,
  FileText,
  Presentation,
  Music,
  Link,
  Youtube,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import { toast } from 'sonner';
import { validateVideoUrl, type VideoSource } from '@/lib/videoUtils';

type MediaKind = 'video' | 'document' | 'presentation' | 'audio' | 'link';
type VideoUploadMode = 'file' | 'youtube' | 'vimeo' | 'zoom' | 'gdrive';
type DocUploadMode = 'file' | 'link';

interface MediaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

export function MediaUploadDialog({ open, onOpenChange, onUploaded }: MediaUploadDialogProps) {
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaKind>('video');
  const [file, setFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<VideoUploadMode>('file');
  const [docMode, setDocMode] = useState<DocUploadMode>('file');
  const [videoUrl, setVideoUrl] = useState('');
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Validate URL when it changes
  useEffect(() => {
    if (mediaKind !== 'video' || videoMode === 'file' || !videoUrl.trim()) {
      setUrlValidation(null);
      return;
    }

    const isValid = validateVideoUrl(videoUrl, videoMode as VideoSource);
    setUrlValidation({
      isValid,
      message: isValid ? t('portal.admin.validUrl') : t('portal.admin.invalidUrl'),
    });
  }, [videoUrl, videoMode, mediaKind, t]);

  const getFileConfig = () => {
    switch (mediaKind) {
      case 'video':
        return { accept: 'video/mp4,video/webm', folder: 'videos', format: 'mp4' };
      case 'document':
        return { accept: 'application/pdf', folder: 'documents', format: 'pdf' };
      case 'presentation':
        return {
          accept: 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
          folder: 'presentations',
          format: 'pptx',
        };
      case 'audio':
        return { accept: 'audio/mpeg,audio/wav,audio/mp3', folder: 'audio', format: 'mp3' };
      default:
        return { accept: '*', folder: 'files', format: null };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsUploading(true);
    try {
      const config = getFileConfig();

      // For video with external URL
      if (mediaKind === 'video' && videoMode !== 'file') {
        if (!videoUrl.trim() || !urlValidation?.isValid) {
          toast.error(t('portal.admin.invalidUrl'));
          return;
        }

        const { error } = await supabase.from('media_library').insert({
          title: title.trim(),
          description: description.trim() || null,
          media_kind: mediaKind,
          source: videoMode,
          url: videoUrl.trim(),
          file_path: null,
          file_format: null,
        });

        if (error) throw error;

        toast.success(t('portal.admin.fileUploaded'));
        resetForm();
        onUploaded();
        onOpenChange(false);
        return;
      }

      // For link type
      if (mediaKind === 'link') {
        if (!videoUrl.trim()) {
          toast.error(t('portal.admin.invalidUrl'));
          return;
        }

        const { error } = await supabase.from('media_library').insert({
          title: title.trim(),
          description: description.trim() || null,
          media_kind: 'link',
          source: 'external',
          url: videoUrl.trim(),
          file_path: null,
          file_format: null,
        });

        if (error) throw error;

        toast.success(t('portal.admin.fileUploaded'));
        resetForm();
        onUploaded();
        onOpenChange(false);
        return;
      }

      // For file upload
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${config.folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('media_library').insert({
        title: title.trim(),
        description: description.trim() || null,
        media_kind: mediaKind,
        file_format: fileExt || config.format,
        file_path: filePath,
        source: 'file',
        url: null,
      });

      if (dbError) throw dbError;

      toast.success(t('portal.admin.fileUploaded'));
      resetForm();
      onUploaded();
      onOpenChange(false);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error(t('portal.admin.fileError'));
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMediaKind('video');
    setFile(null);
    setVideoMode('file');
    setVideoUrl('');
    setUrlValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const isSubmitDisabled = () => {
    if (isUploading || !title.trim()) return true;
    if (mediaKind === 'link') return !videoUrl.trim();
    if (mediaKind === 'video' && videoMode !== 'file') {
      return !videoUrl.trim() || !urlValidation?.isValid;
    }
    return !file;
  };

  const showUrlInput = mediaKind === 'link' || (mediaKind === 'video' && videoMode !== 'file');
  const showFileInput = mediaKind !== 'link' && (mediaKind !== 'video' || videoMode === 'file');

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            {t('media.upload')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="media-title">{t('media.columnTitle')}</Label>
            <Input
              id="media-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contents.form.titlePlaceholder')}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="media-description">{t('media.description')}</Label>
            <Textarea
              id="media-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('media.descriptionPlaceholder')}
              rows={2}
            />
          </div>

          {/* Media Kind */}
          <div className="space-y-2">
            <Label>{t('media.columnType')}</Label>
            <Select value={mediaKind} onValueChange={(v) => setMediaKind(v as MediaKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" /> {t('media.typeVideo')}
                  </span>
                </SelectItem>
                <SelectItem value="document">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> {t('media.typeDocument')}
                  </span>
                </SelectItem>
                <SelectItem value="presentation">
                  <span className="flex items-center gap-2">
                    <Presentation className="w-4 h-4" /> {t('media.typePresentation')}
                  </span>
                </SelectItem>
                <SelectItem value="audio">
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" /> {t('media.typeAudio')}
                  </span>
                </SelectItem>
                <SelectItem value="link">
                  <span className="flex items-center gap-2">
                    <Link className="w-4 h-4" /> {t('media.typeLink')}
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video source selection */}
          {mediaKind === 'video' && (
            <div className="space-y-3">
              <Label>{t('portal.admin.videoSource')}</Label>
              <RadioGroup
                value={videoMode}
                onValueChange={(v) => {
                  setVideoMode(v as VideoUploadMode);
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
                    <Badge variant="secondary" className="text-xs">
                      {t('portal.admin.recommended')}
                    </Badge>
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
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="gdrive" id="mode-gdrive" />
                  <Label htmlFor="mode-gdrive" className="flex items-center gap-1 cursor-pointer">
                    <HardDrive className="w-4 h-4" />
                    Google Drive
                  </Label>
                </div>
              </RadioGroup>

              {/* Zoom warning */}
              {videoMode === 'zoom' && (
                <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                    {t('portal.admin.zoomWarning')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Google Drive warning */}
              {videoMode === 'gdrive' && (
                <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                    {t('portal.admin.gdriveWarning')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* URL input */}
          {showUrlInput && (
            <div className="space-y-2">
              <Label htmlFor="media-url">{t('portal.admin.enterUrl')}</Label>
              <div className="relative">
                <Input
                  id="media-url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder={
                    mediaKind === 'link'
                      ? 'https://...'
                      : videoMode === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : videoMode === 'vimeo'
                      ? 'https://vimeo.com/...'
                      : videoMode === 'gdrive'
                      ? 'https://drive.google.com/file/d/.../view'
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
            </div>
          )}

          {/* File input */}
          {showFileInput && (
            <div className="space-y-2">
              <Label htmlFor="media-file">{t('portal.admin.selectFile')}</Label>
              <Input
                id="media-file"
                ref={fileInputRef}
                type="file"
                accept={getFileConfig().accept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <Button type="submit" disabled={isSubmitDisabled()} className="w-full">
            <Upload className="w-4 h-4 me-1" />
            {isUploading ? t('portal.admin.uploading') : t('portal.admin.uploadFile')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
