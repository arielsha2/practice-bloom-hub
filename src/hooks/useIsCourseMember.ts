import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsCourseMember() {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_course_member', { _user_id: user.id });

        if (error) {
          console.error('Error checking course membership:', error);
          setHasAccess(false);
        } else {
          setHasAccess(data === true);
        }
      } catch (err) {
        console.error('Error checking course membership:', err);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [user]);

  return { hasAccess, isLoading };
}
