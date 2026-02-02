import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useIsAdmin() {
  const { user, session, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAdminStatus() {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!user || !session) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        // Refresh session before calling edge function to ensure valid token
        const { data: refreshData } = await supabase.auth.refreshSession();
        
        const currentToken = refreshData?.session?.access_token 
          || session.access_token;

        const { data, error } = await supabase.functions.invoke('check-admin', {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
        }
      } catch (error) {
        console.error('Error invoking check-admin:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, session, authLoading]);

  return { isAdmin, isLoading };
}
