import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  order_index: number | null;
  description: string | null;
}

interface LessonWithProgress extends Lesson {
  watched: boolean;
  last_watched_at: string | null;
}

interface DashboardStats {
  totalLessons: number;
  watchedLessons: number;
  remainingLessons: number;
  nextLesson: LessonWithProgress | null;
  lessons: LessonWithProgress[];
  isLoading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLessons: 0,
    watchedLessons: 0,
    remainingLessons: 0,
    nextLesson: null,
    lessons: [],
    isLoading: true,
  });

  useEffect(() => {
    async function fetchStats() {
      if (!user) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Fetch all lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, order_index, description')
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Fetch user progress
        const { data: progress, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, watched, last_watched_at')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        // Map progress to lessons
        const progressMap = new Map(
          progress?.map(p => [p.lesson_id, { watched: p.watched, last_watched_at: p.last_watched_at }]) || []
        );

        const lessonsWithProgress: LessonWithProgress[] = (lessons || []).map(lesson => ({
          ...lesson,
          watched: progressMap.get(lesson.id)?.watched || false,
          last_watched_at: progressMap.get(lesson.id)?.last_watched_at || null,
        }));

        const watchedCount = lessonsWithProgress.filter(l => l.watched).length;
        const totalCount = lessonsWithProgress.length;

        // Find next unwatched lesson
        const nextLesson = lessonsWithProgress.find(l => !l.watched) || null;

        setStats({
          totalLessons: totalCount,
          watchedLessons: watchedCount,
          remainingLessons: totalCount - watchedCount,
          nextLesson,
          lessons: lessonsWithProgress,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, [user]);

  return stats;
}
