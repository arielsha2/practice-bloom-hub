import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Video, FileText, Presentation } from 'lucide-react';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
}

interface AdminFileUploadProps {
  lessons: Lesson[];
  onFileUploaded: () => void;
}

export function AdminFileUpload({ lessons, onFileUploaded }: AdminFileUploadProps) {
  const { t, isRTL } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLesson, setSelectedLesson] = useState('');
  const [fileType, setFileType] = useState<'video' | 'pdf' | 'ppt'>('video');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const getAcceptedTypes = () => {
    switch (fileType) {
      case 'video':
        return 'video/mp4,video/webm';
      case 'pdf':
        return 'application/pdf';
      case 'ppt':
        return 'application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
  };

  const getFolder = () => {
    switch (fileType) {
      case 'video':
        return 'videos';
      case 'pdf':
        return 'exercises';
      case 'ppt':
        return 'presentations';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLesson || !title.trim() || !file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${getFolder()}/${fileName}`;

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
        lesson_id: selectedLesson,
        title: title.trim(),
        type: fileType,
        file_path: filePath,
      });

      if (dbError) throw dbError;

      toast.success(t('portal.admin.fileUploaded'));
      setTitle('');
      setFile(null);
      setSelectedLesson('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onFileUploaded();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(t('portal.admin.fileError'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {t('portal.admin.uploadFile')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('portal.admin.selectLesson')}</Label>
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger>
                <SelectValue placeholder={t('portal.admin.selectLessonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('portal.admin.fileType')}</Label>
            <Select value={fileType} onValueChange={(v) => setFileType(v as 'video' | 'pdf' | 'ppt')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    {t('portal.video')}
                  </span>
                </SelectItem>
                <SelectItem value="pdf">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('portal.exercise')} (PDF)
                  </span>
                </SelectItem>
                <SelectItem value="ppt">
                  <span className="flex items-center gap-2">
                    <Presentation className="w-4 h-4" />
                    {t('portal.presentation')} (PPT)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-title">{t('contents.form.title')}</Label>
            <Input
              id="file-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('contents.form.titlePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">{t('portal.admin.selectFile')}</Label>
            <Input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept={getAcceptedTypes()}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !selectedLesson || !title.trim() || !file}
            className="w-full"
          >
            <Upload className="w-4 h-4 me-1" />
            {isUploading ? t('portal.admin.uploading') : t('portal.admin.uploadFile')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
