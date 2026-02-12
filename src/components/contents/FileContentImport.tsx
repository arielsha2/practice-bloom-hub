import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import mammoth from 'mammoth';

interface FileContentImportProps {
  onContentImported: (data: { title: string; content: string }) => void;
}

export function FileContentImport({ onContentImported }: FileContentImportProps) {
  const { isRTL } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsePdf = async (file: File): Promise<{ title: string; content: string }> => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const paragraphs: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      let pageText = '';
      let lastY: number | null = null;

      for (const item of textContent.items) {
        if ('str' in item) {
          const y = (item as any).transform?.[5];
          if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 5) {
            pageText += '\n';
          }
          pageText += item.str;
          lastY = y;
        }
      }

      const lines = pageText.split('\n').filter(l => l.trim());
      for (const line of lines) {
        paragraphs.push(line.trim());
      }
    }

    const title = paragraphs[0] || file.name.replace(/\.[^/.]+$/, '');
    const contentParagraphs = paragraphs.slice(1);
    const html = contentParagraphs.map(p => `<p>${p}</p>`).join('');

    return { title, content: html };
  };

  const parseDocx = async (file: File): Promise<{ title: string; content: string }> => {
    const arrayBuffer = await file.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read('base64');
            const contentType = image.contentType || 'image/png';
            const ext = contentType.split('/')[1] || 'png';
            const fileName = `imported-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const byteCharacters = atob(imageBuffer);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });

            const { error: uploadError } = await supabase.storage
              .from('content-images')
              .upload(fileName, blob);

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
              return { src: '' };
            }

            const { data: { publicUrl } } = supabase.storage
              .from('content-images')
              .getPublicUrl(fileName);

            return { src: publicUrl };
          } catch (error) {
            console.error('Error processing image:', error);
            return { src: '' };
          }
        })
      }
    );

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    const firstHeading = tempDiv.querySelector('h1, h2, h3');
    const title = firstHeading?.textContent?.trim() || file.name.replace(/\.[^/.]+$/, '');

    if (firstHeading) {
      firstHeading.remove();
    }

    return { title, content: tempDiv.innerHTML };
  };

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !['pdf', 'docx', 'doc'].includes(ext)) {
      toast.error(isRTL ? 'פורמט לא נתמך. השתמש ב-PDF או DOCX' : 'Unsupported format. Use PDF or DOCX');
      return;
    }

    if (ext === 'doc') {
      toast.error(isRTL ? 'פורמט DOC ישן לא נתמך. שמור כ-DOCX' : 'Old DOC format not supported. Save as DOCX');
      return;
    }

    setIsProcessing(true);
    try {
      const result = ext === 'pdf' ? await parsePdf(file) : await parseDocx(file);
      onContentImported(result);
      setImportedFileName(file.name);
      toast.success(isRTL ? 'התוכן יובא בהצלחה' : 'Content imported successfully');
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(isRTL ? 'שגיאה בקריאת הקובץ' : 'Error reading file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isProcessing) {
    return (
      <div className="border border-dashed rounded-lg p-4 flex items-center justify-center gap-2 text-muted-foreground bg-muted/20">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">{isRTL ? 'מעבד את הקובץ...' : 'Processing file...'}</span>
      </div>
    );
  }

  if (importedFileName) {
    return (
      <div className="border border-dashed border-accent/50 rounded-lg p-3 flex items-center gap-2 bg-accent/5">
        <CheckCircle className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm text-accent-foreground truncate">
          {isRTL ? `יובא מ: ${importedFileName}` : `Imported from: ${importedFileName}`}
        </span>
        <button
          type="button"
          onClick={() => {
            setImportedFileName(null);
            fileInputRef.current?.click();
          }}
          className="text-xs text-primary hover:underline ms-auto shrink-0"
        >
          {isRTL ? 'החלף קובץ' : 'Replace'}
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      className={`
        border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
      `}
    >
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Upload className="w-4 h-4" />
          <FileText className="w-4 h-4" />
        </div>
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'גרור קובץ PDF או DOCX לכאן, או לחץ לבחירה'
            : 'Drag a PDF or DOCX file here, or click to select'}
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
