import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string) => void;
  isLoading?: boolean;
}

export function InsightDialog({ open, onOpenChange, onSave, isLoading }: InsightDialogProps) {
  const [content, setContent] = useState('');
  const { t } = useLanguage();

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      setContent('');
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setContent('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent" />
            {t('chat.insight.title')}
          </DialogTitle>
          <DialogDescription>
            {t('chat.insight.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('chat.insight.placeholder')}
            className="min-h-[100px] resize-none"
          />
          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
            <span>{t('chat.insight.hint')}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleClose}>
            {t('chat.insight.cancel')}
          </Button>
          <Button
            variant="cta"
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
          >
            {t('chat.insight.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
