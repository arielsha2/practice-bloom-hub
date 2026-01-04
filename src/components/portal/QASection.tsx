import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MessageCircle, Send, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QAThread {
  id: string;
  question: string;
  answer: string | null;
  is_public: boolean;
  created_at: string;
  answered_at: string | null;
  user_id: string | null;
  is_my_question: boolean;
}

interface QASectionProps {
  lessonId?: string;
}

export function QASection({ lessonId }: QASectionProps) {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QAThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [lessonId]);

  const fetchQuestions = async () => {
    try {
      // Use the secure view that hides user_id from other students
      let query = supabase
        .from('qa_threads_safe')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuestions((data || []) as QAThread[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('qa_threads').insert({
        user_id: user.id,
        lesson_id: lessonId || null,
        question: newQuestion.trim(),
        is_public: isPublic,
      });

      if (error) throw error;

      toast.success(t('portal.questionSubmitted'));
      setNewQuestion('');
      setIsPublic(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error(t('portal.questionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Ask Question Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            {t('portal.askQuestion')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder={t('portal.questionPlaceholder')}
              className="min-h-24"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="is-public" className="text-sm">
                  {isPublic ? t('portal.questionPublic') : t('portal.questionPrivate')}
                </Label>
              </div>
              <Button type="submit" disabled={isSubmitting || !newQuestion.trim()}>
                <Send className="w-4 h-4 me-1" />
                {t('portal.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
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
            <Card key={q.id} className={q.is_my_question ? 'border-primary/30' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-medium">{q.question}</p>
                    {q.answer ? (
                      <div className="bg-muted/50 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {t('portal.answered')}
                        </div>
                        <p>{q.answer}</p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {t('portal.noAnswer')}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      {q.is_public && (
                        <span className="bg-muted px-2 py-0.5 rounded">
                          {t('portal.public')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
