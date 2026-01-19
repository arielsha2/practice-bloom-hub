import { useLanguage } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ArticlePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
}

export function ArticlePreviewDialog({ 
  open, 
  onOpenChange, 
  title, 
  content 
}: ArticlePreviewDialogProps) {
  const { isRTL } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif">
            {isRTL ? 'תצוגה מקדימה' : 'Preview'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <article className="prose-article" dir={isRTL ? 'rtl' : 'ltr'}>
            <h1 className="text-2xl font-serif font-medium mb-6">{title}</h1>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content }} 
            />
          </article>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
