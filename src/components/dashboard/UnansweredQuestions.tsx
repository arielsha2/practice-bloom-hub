import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowLeft, ArrowRight } from 'lucide-react';
import { AnswerQuestionDialog } from './AnswerQuestionDialog';
import { formatDistanceToNow } from 'date-fns';
import { he, enUS } from 'date-fns/locale';

interface UnansweredQuestion {
  id: string;
  question: string;
  created_at: string;
  lesson_id: string | null;
  lesson_title: string | null;
}

export function UnansweredQuestions() {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const [questions, setQuestions] = useState<UnansweredQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<UnansweredQuestion | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchUnansweredQuestions();
  }, []);

  const fetchUnansweredQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_threads')
        .select(`
          id,
          question,
          created_at,
          lesson_id,
          lessons:lesson_id(title)
        `)
        .is('answer', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const transformed = (data || []).map((q: any) => ({
        id: q.id,
        question: q.question,
        created_at: q.created_at,
        lesson_id: q.lesson_id,
        lesson_title: q.lessons?.title || null,
      }));

      setQuestions(transformed);
    } catch (error) {
      console.error('Error fetching unanswered questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerClick = (question: UnansweredQuestion) => {
    setSelectedQuestion(question);
    setDialogOpen(true);
  };

  const handleAnswerSaved = () => {
    setDialogOpen(false);
    setSelectedQuestion(null);
    fetchUnansweredQuestions();
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-medium">
                {isRTL ? 'שאלות ממתינות לתשובה' : 'Pending Questions'}
              </CardTitle>
              {questions.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {questions.length}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigate('/portal/admin#qa')}
            >
              {isRTL ? 'צפה בהכל' : 'View All'}
              <ArrowIcon className="w-3 h-3 mr-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {questions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {isRTL ? 'אין שאלות ממתינות 🎉' : 'No pending questions 🎉'}
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {q.question.length > 60
                        ? q.question.substring(0, 60) + '...'
                        : q.question}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {q.lesson_title && (
                        <span className="text-xs text-muted-foreground">
                          📚 {q.lesson_title}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(q.created_at), {
                          addSuffix: true,
                          locale: isRTL ? he : enUS,
                        })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleAnswerClick(q)}
                  >
                    {isRTL ? 'ענה' : 'Answer'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AnswerQuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        question={selectedQuestion}
        onSaved={handleAnswerSaved}
      />
    </>
  );
}
