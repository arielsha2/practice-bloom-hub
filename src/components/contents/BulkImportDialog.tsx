import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Upload, FileText, Check, X, AlertCircle, Eye, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ArticlePreviewDialog } from './ArticlePreviewDialog';
import mammoth from 'mammoth';

interface Category {
  id: string;
  name_he: string;
  name_en: string;
}

interface ParsedFile {
  file: File;
  title: string;
  content: string;
  status: 'pending' | 'ready' | 'error' | 'importing' | 'done';
  error?: string;
  selected: boolean;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function BulkImportDialog({ open, onOpenChange, onImportComplete }: BulkImportDialogProps) {
  const { isRTL, language } = useLanguage();
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [importStatus, setImportStatus] = useState<'draft' | 'published'>('draft');
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<ParsedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('content_categories')
      .select('id, name_he, name_en')
      .order('display_order');
    
    if (!error && data) {
      setCategories(data);
    }
  };

  const parseTextFile = async (file: File): Promise<{ title: string; content: string }> => {
    const text = await file.text();
    const lines = text.split('\n');
    const title = lines[0]?.trim() || file.name.replace(/\.[^/.]+$/, '');
    const content = lines.slice(1).join('\n').trim();
    return { title, content: `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>` };
  };

  const parseMarkdownFile = async (file: File): Promise<{ title: string; content: string }> => {
    const text = await file.text();
    const lines = text.split('\n');
    
    // Extract title from first # heading or first line
    let title = file.name.replace(/\.[^/.]+$/, '');
    let contentStart = 0;
    
    if (lines[0]?.startsWith('# ')) {
      title = lines[0].replace(/^# /, '').trim();
      contentStart = 1;
    }
    
    const markdown = lines.slice(contentStart).join('\n');
    
    // Simple markdown to HTML conversion
    let html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    return { title, content: `<p>${html}</p>` };
  };

  const parseWordFile = async (file: File): Promise<{ title: string; content: string }> => {
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
            
            // Convert base64 to blob
            const byteCharacters = atob(imageBuffer);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });
            
            // Upload to Supabase Storage
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
    
    // Extract title from first heading or file name
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = result.value;
    const firstHeading = tempDiv.querySelector('h1, h2, h3');
    const title = firstHeading?.textContent?.trim() || file.name.replace(/\.[^/.]+$/, '');
    
    if (firstHeading) {
      firstHeading.remove();
    }
    
    return { title, content: tempDiv.innerHTML };
  };

  const parseHtmlFile = async (file: File): Promise<{ title: string; content: string }> => {
    const text = await file.text();
    
    // Extract title from <title> or first heading
    const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
    const headingMatch = text.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
    const title = titleMatch?.[1] || headingMatch?.[1] || file.name.replace(/\.[^/.]+$/, '');
    
    // Extract body content
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = bodyMatch?.[1] || text;
    
    return { title: title.trim(), content };
  };

  const parseFile = async (file: File): Promise<ParsedFile> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let parsed: { title: string; content: string };
      
      switch (extension) {
        case 'txt':
          parsed = await parseTextFile(file);
          break;
        case 'md':
        case 'markdown':
          parsed = await parseMarkdownFile(file);
          break;
        case 'docx':
          parsed = await parseWordFile(file);
          break;
        case 'html':
        case 'htm':
          parsed = await parseHtmlFile(file);
          break;
        default:
          return {
            file,
            title: file.name,
            content: '',
            status: 'error',
            error: isRTL ? 'פורמט לא נתמך' : 'Unsupported format',
            selected: false
          };
      }
      
      return {
        file,
        title: parsed.title,
        content: parsed.content,
        status: 'ready',
        selected: true
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        file,
        title: file.name,
        content: '',
        status: 'error',
        error: isRTL ? 'שגיאה בקריאת הקובץ' : 'Error reading file',
        selected: false
      };
    }
  };

  const handleFilesSelected = useCallback(async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const fileArray = Array.from(selectedFiles);
    const validExtensions = ['txt', 'md', 'markdown', 'docx', 'html', 'htm'];
    
    // Set initial pending state
    const pendingFiles: ParsedFile[] = fileArray.map(file => ({
      file,
      title: file.name,
      content: '',
      status: 'pending' as const,
      selected: true
    }));
    
    setFiles(prev => [...prev, ...pendingFiles]);
    
    // Parse files
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (!validExtensions.includes(ext || '')) {
        setFiles(prev => prev.map(f => 
          f.file === file 
            ? { ...f, status: 'error' as const, error: isRTL ? 'פורמט לא נתמך' : 'Unsupported format', selected: false }
            : f
        ));
        continue;
      }
      
      const parsed = await parseFile(file);
      setFiles(prev => prev.map(f => 
        f.file === file ? parsed : f
      ));
    }
  }, [isRTL]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleFileSelection = (file: File) => {
    setFiles(prev => prev.map(f => 
      f.file === file ? { ...f, selected: !f.selected } : f
    ));
  };

  const removeFile = (file: File) => {
    setFiles(prev => prev.filter(f => f.file !== file));
  };

  const handleImport = async () => {
    const filesToImport = files.filter(f => f.selected && f.status === 'ready');
    if (filesToImport.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    
    let successCount = 0;
    
    for (let i = 0; i < filesToImport.length; i++) {
      const file = filesToImport[i];
      
      // Update status to importing
      setFiles(prev => prev.map(f => 
        f.file === file.file ? { ...f, status: 'importing' as const } : f
      ));
      
      try {
        const { error } = await supabase.from('contents').insert({
          title: file.title,
          content: file.content,
          language,
          category_id: selectedCategory || null,
          status: importStatus,
          published_at: importStatus === 'published' ? new Date().toISOString() : null,
        });
        
        if (error) throw error;
        
        // Update status to done
        setFiles(prev => prev.map(f => 
          f.file === file.file ? { ...f, status: 'done' as const } : f
        ));
        
        successCount++;
      } catch (error) {
        console.error('Error importing file:', error);
        setFiles(prev => prev.map(f => 
          f.file === file.file 
            ? { ...f, status: 'error' as const, error: isRTL ? 'שגיאה בייבוא' : 'Import error' }
            : f
        ));
      }
      
      setImportProgress(((i + 1) / filesToImport.length) * 100);
    }
    
    setIsImporting(false);
    
    if (successCount > 0) {
      toast.success(
        isRTL 
          ? `${successCount} מאמרים יובאו בהצלחה` 
          : `${successCount} articles imported successfully`
      );
      
      // Close dialog after short delay
      setTimeout(() => {
        onImportComplete();
        resetDialog();
      }, 1500);
    }
  };

  const resetDialog = () => {
    setFiles([]);
    setSelectedCategory('');
    setImportStatus('draft');
    setImportProgress(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const readyCount = files.filter(f => f.selected && f.status === 'ready').length;
  const getStatusIcon = (status: ParsedFile['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
      case 'ready':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'importing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'done':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'ייבוא מאמרים מרובה' : 'Bulk Import Articles'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'}
              `}
            >
              <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                {isRTL ? 'גרור קבצים לכאן או' : 'Drag files here or'}
              </p>
              <label className="cursor-pointer">
                <span className="text-primary hover:underline">
                  {isRTL ? 'לחץ לבחירה' : 'click to select'}
                </span>
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.markdown,.docx,.html,.htm"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-muted-foreground mt-2">
                .txt, .md, .docx, .html
              </p>
            </div>

            {/* Default Settings */}
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'קטגוריה' : 'Category'}</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRTL ? 'בחר קטגוריה' : 'Select category'} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {language === 'he' ? cat.name_he : cat.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{isRTL ? 'סטטוס' : 'Status'}</Label>
                  <RadioGroup 
                    value={importStatus} 
                    onValueChange={(v) => setImportStatus(v as 'draft' | 'published')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="draft" id="draft" />
                      <Label htmlFor="draft" className="font-normal">
                        {isRTL ? 'טיוטה' : 'Draft'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <RadioGroupItem value="published" id="published" />
                      <Label htmlFor="published" className="font-normal">
                        {isRTL ? 'פרסם מיד' : 'Publish now'}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>
                  {isRTL 
                    ? `קבצים שנבחרו (${files.length})` 
                    : `Selected files (${files.length})`}
                </Label>
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={file.selected && file.status !== 'error'}
                        onChange={() => toggleFileSelection(file.file)}
                        disabled={file.status === 'error' || file.status === 'done'}
                        className="h-4 w-4"
                      />
                      <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.file.name} ({(file.file.size / 1024).toFixed(1)} KB)
                        </p>
                        {file.error && (
                          <p className="text-xs text-destructive">{file.error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(file.status)}
                        {file.status === 'ready' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.file)}
                          disabled={file.status === 'importing'}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Progress */}
            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-muted-foreground text-center">
                  {isRTL ? 'מייבא מאמרים...' : 'Importing articles...'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleClose(false)} disabled={isImporting}>
              {isRTL ? 'ביטול' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={readyCount === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {isRTL ? 'מייבא...' : 'Importing...'}
                </>
              ) : (
                isRTL ? `ייבוא ${readyCount} מאמרים` : `Import ${readyCount} articles`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <ArticlePreviewDialog
        open={!!previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        title={previewFile?.title || ''}
        content={previewFile?.content || ''}
      />
    </>
  );
}
