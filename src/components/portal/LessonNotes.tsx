import { useLanguage } from '@/contexts/LanguageContext';
import { useLessonNotes } from '@/hooks/useLessonNotes';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Check, Loader2 } from 'lucide-react';

interface LessonNotesProps {
  lessonId: string | undefined;
}

export function LessonNotes({ lessonId }: LessonNotesProps) {
  const { isRTL } = useLanguage();
  const { content, updateContent, saveStatus, isLoading } = useLessonNotes(lessonId);

  if (isLoading) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
        {isRTL ? 'טוען הערות...' : 'Loading notes...'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {isRTL ? 'הערות אישיות' : 'Personal Notes'}
          </h3>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {isRTL ? 'שומר...' : 'Saving...'}
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3 h-3 text-green-500" />
              {isRTL ? 'נשמר' : 'Saved'}
            </>
          )}
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => updateContent(e.target.value)}
        placeholder={isRTL ? 'כתוב את ההערות שלך כאן...' : 'Write your notes here...'}
        className="min-h-32 resize-y text-sm"
        dir="auto"
      />
    </div>
  );
}
