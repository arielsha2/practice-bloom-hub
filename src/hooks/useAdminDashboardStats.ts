import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LessonStat {
  lessonId: string;
  lessonTitle: string;
  watchedCount: number;
  totalUsers: number;
}

interface UserProgress {
  id: string;
  email: string | null;
  displayName: string | null;
  watchedCount: number;
  totalLessons: number;
  lastActivity: string | null;
}

interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  overallCompletionPercent: number;
  lessonStats: LessonStat[];
  recentUsers: UserProgress[];
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
}

const USERS_PER_PAGE = 10;

export function useAdminDashboardStats(page: number = 0) {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    overallCompletionPercent: 0,
    lessonStats: [],
    recentUsers: [],
    totalPages: 0,
    currentPage: page,
    isLoading: true,
  });

  useEffect(() => {
    async function fetchAdminStats() {
      if (!user) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Fetch all lessons
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, order_index')
          .order('order_index', { ascending: true });

        if (lessonsError) throw lessonsError;

        // Fetch all user progress (admin only - RLS will filter)
        const { data: allProgress, error: progressError } = await supabase
          .from('user_lesson_progress')
          .select('user_id, lesson_id, watched, last_watched_at');

        if (progressError) throw progressError;

        // Calculate unique users
        const uniqueUserIds = [...new Set(allProgress?.map(p => p.user_id) || [])];
        const totalUsers = uniqueUserIds.length;

        // Calculate active users (watched something in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const activeUserIds = new Set(
          allProgress
            ?.filter(p => p.last_watched_at && new Date(p.last_watched_at) > sevenDaysAgo)
            .map(p => p.user_id) || []
        );
        const activeUsers = activeUserIds.size;

        // Calculate lesson stats
        const lessonStats: LessonStat[] = (lessons || []).map(lesson => {
          const watchedCount = allProgress?.filter(
            p => p.lesson_id === lesson.id && p.watched
          ).length || 0;
          return {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            watchedCount,
            totalUsers,
          };
        });

        // Calculate overall completion
        const totalPossibleCompletions = totalUsers * (lessons?.length || 0);
        const totalCompletions = allProgress?.filter(p => p.watched).length || 0;
        const overallCompletionPercent = totalPossibleCompletions > 0
          ? Math.round((totalCompletions / totalPossibleCompletions) * 100)
          : 0;

        // Fetch profiles for users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, display_name');

        const profilesMap = new Map(
          profiles?.map(p => [p.id, { email: p.email, displayName: p.display_name }]) || []
        );

        // Calculate per-user progress
        const userProgressMap = new Map<string, { watchedCount: number; lastActivity: string | null }>();
        allProgress?.forEach(p => {
          const current = userProgressMap.get(p.user_id) || { watchedCount: 0, lastActivity: null };
          if (p.watched) {
            current.watchedCount += 1;
          }
          if (p.last_watched_at && (!current.lastActivity || p.last_watched_at > current.lastActivity)) {
            current.lastActivity = p.last_watched_at;
          }
          userProgressMap.set(p.user_id, current);
        });

        // Sort users by last activity and paginate
        const usersList: UserProgress[] = Array.from(userProgressMap.entries())
          .map(([userId, data]) => ({
            id: userId,
            email: profilesMap.get(userId)?.email || null,
            displayName: profilesMap.get(userId)?.displayName || null,
            watchedCount: data.watchedCount,
            totalLessons: lessons?.length || 0,
            lastActivity: data.lastActivity,
          }))
          .sort((a, b) => {
            if (!a.lastActivity) return 1;
            if (!b.lastActivity) return -1;
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
          });

        const totalPages = Math.ceil(usersList.length / USERS_PER_PAGE);
        const paginatedUsers = usersList.slice(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE);

        setStats({
          totalUsers,
          activeUsers,
          overallCompletionPercent,
          lessonStats,
          recentUsers: paginatedUsers,
          totalPages,
          currentPage: page,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchAdminStats();
  }, [user, page]);

  return stats;
}
