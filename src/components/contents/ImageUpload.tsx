import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
}

export function ImageUpload({ imageUrl, onImageChange }: ImageUploadProps) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `featured-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      onImageChange(publicUrl);
      toast.success(t('contents.editor.imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('contents.editor.imageUploadError'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onImageChange(null);
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <div className="relative group">
          <img 
            src={imageUrl} 
            alt="Featured" 
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <>
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('contents.form.uploadImage')}
              </span>
            </>
          )}
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
