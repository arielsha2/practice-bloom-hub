import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface AnswerQuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: {
    id: string;
    question: string;
    lesson_title: string | null;
  } | null;
  onSaved: () => void;
}

export function AnswerQuestionDialog({
  open,
  onOpenChange,
  question,
  onSaved,
}: AnswerQuestionDialogProps) {
  const { isRTL, t } = useLanguage();
  const [answer, setAnswer] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!question || !answer.trim()) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('qa_threads')
        .update({
          answer: answer.trim(),
          answered_at: new Date().toISOString(),
        })
        .eq('id', question.id);

      if (error) throw error;

      toast.success(t('portal.admin.answerSaved'));
      setAnswer('');
      onSaved();
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error(t('portal.admin.answerError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {isRTL ? 'ענה על שאלה' : 'Answer Question'}
          </DialogTitle>
        </DialogHeader>

        {question && (
          <div className="space-y-4">
            {question.lesson_title && (
              <div className="text-sm text-muted-foreground">
                📚 {question.lesson_title}
              </div>
            )}
            
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{question.question}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('portal.admin.yourAnswer')}
              </label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={t('portal.admin.answerPlaceholder')}
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRTL ? 'ביטול' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={!answer.trim() || isSaving}>
            {isSaving ? (isRTL ? 'שומר...' : 'Saving...') : t('portal.admin.answer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
