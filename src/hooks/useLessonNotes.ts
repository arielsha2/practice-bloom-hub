import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useLessonNotes(lessonId: string | undefined) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load notes
  useEffect(() => {
    if (!user?.id || !lessonId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    supabase
      .from('user_lesson_notes' as any)
      .select('content')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setContent((data as any).content || '');
        } else {
          setContent('');
        }
        setIsLoading(false);
        setSaveStatus('idle');
      });
  }, [user?.id, lessonId]);

  const saveNotes = useCallback(async (text: string) => {
    if (!user?.id || !lessonId) return;
    
    setSaveStatus('saving');
    try {
      const { error } = await (supabase as any)
        .from('user_lesson_notes')
        .upsert(
          {
            user_id: user.id,
            lesson_id: lessonId,
            content: text,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );

      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving notes:', err);
      setSaveStatus('idle');
    }
  }, [user?.id, lessonId]);

  const updateContent = useCallback((text: string) => {
    setContent(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotes(text), 2000);
  }, [saveNotes]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { content, updateContent, saveStatus, isLoading };
}
