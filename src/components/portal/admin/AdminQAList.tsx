import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Clock, CheckCircle, Eye, EyeOff, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface QAThread {
  id: string;
  question: string;
  answer: string | null;
  is_public: boolean;
  created_at: string;
  answered_at: string | null;
}

export function AdminQAList() {
  const { t, isRTL } = useLanguage();
  const [questions, setQuestions] = useState<QAThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_threads')
        .select('*')
        .order('answered_at', { ascending: true, nullsFirst: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!answerText.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('qa_threads')
        .update({
          answer: answerText.trim(),
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;

      toast.success(t('portal.admin.answerSaved'));
      setAnsweringId(null);
      setAnswerText('');
      fetchQuestions();
    } catch (error) {
      console.error('Error saving answer:', error);
      toast.error(t('portal.admin.answerError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAI = async (questionId: string) => {
    setGeneratingId(questionId);
    try {
      const { data, error } = await supabase.functions.invoke('qa-ai-answer', {
        body: { question_id: questionId },
      });

      if (error) throw error;
      if (data?.answer) {
        setAnsweringId(questionId);
        setAnswerText(data.answer);
        toast.success(isRTL ? 'תשובת AI נוצרה - ניתן לערוך לפני שליחה' : 'AI answer generated - edit before sending');
      }
    } catch (error: any) {
      console.error('Error generating AI answer:', error);
      toast.error(isRTL ? 'שגיאה ביצירת תשובת AI' : 'Error generating AI answer');
    } finally {
      setGeneratingId(null);
    }
  };

  const unansweredCount = questions.filter((q) => !q.answer).length;

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          {t('portal.qa')}
        </h2>
        {unansweredCount > 0 && (
          <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-sm">
            {unansweredCount} {t('portal.admin.unanswered')}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('auth.loading')}
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('portal.noQuestions')}
        </div>
      ) : (
        questions.map((q) => (
          <Card key={q.id} className={!q.answer ? 'border-destructive/30' : ''}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      {q.is_public ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {t('portal.public')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          {t('portal.private')}
                        </span>
                      )}
                    </div>
                  </div>
                  {q.answer ? (
                    <CheckCircle className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-destructive shrink-0" />
                  )}
                </div>

                {q.answer ? (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground mb-1">{t('portal.admin.yourAnswer')}:</p>
                    <p>{q.answer}</p>
                  </div>
                ) : answeringId === q.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder={t('portal.admin.answerPlaceholder')}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAnswer(q.id)}
                        disabled={isSubmitting || !answerText.trim()}
                      >
                        <Send className="w-4 h-4 me-1" />
                        {t('portal.submit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAnsweringId(null);
                          setAnswerText('');
                        }}
                      >
                        {t('contents.admin.cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnsweringId(q.id)}
                    >
                      {t('portal.admin.answer')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleGenerateAI(q.id)}
                      disabled={generatingId === q.id}
                    >
                      {generatingId === q.id ? (
                        <Loader2 className="w-4 h-4 animate-spin me-1" />
                      ) : (
                        <Sparkles className="w-4 h-4 me-1" />
                      )}
                      {isRTL ? 'צור תשובה עם AI' : 'Generate AI Answer'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
