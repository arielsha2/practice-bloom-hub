import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LessonProgress {
  lesson_id: string;
  video_id: string | null;
  watched: boolean;
  last_position_seconds: number;
  last_watched_at: string;
}

export function useUserProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_lesson_progress')
        .select('lesson_id, video_id, watched, last_position_seconds, last_watched_at')
        .eq('user_id', user.id);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const isLessonWatched = useCallback((lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.watched);
  }, [progress]);

  const getLessonProgress = useCallback((lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  }, [progress]);

  const markAsWatched = useCallback(async (lessonId: string, videoId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          video_id: videoId || null,
          watched: true,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id,video_id'
        });

      if (error) throw error;
      await fetchProgress();
    } catch (error) {
      console.error('Error marking as watched:', error);
    }
  }, [user, fetchProgress]);

  const updatePosition = useCallback(async (lessonId: string, videoId: string | null, positionSeconds: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          video_id: videoId,
          last_position_seconds: positionSeconds,
          last_watched_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,lesson_id,video_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating position:', error);
    }
  }, [user]);

  return {
    progress,
    isLoading,
    isLessonWatched,
    getLessonProgress,
    markAsWatched,
    updatePosition,
    refetch: fetchProgress
  };
}
