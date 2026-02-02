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

      // Check if token is expired
      const isTokenExpired = session.expires_at 
        && session.expires_at * 1000 < Date.now();

      try {
        let currentToken = session.access_token;

        // Only refresh if token is expired
        if (isTokenExpired) {
          const { data: refreshData, error: refreshError } = 
            await supabase.auth.refreshSession();
          
          if (refreshError || !refreshData?.session) {
            // Token refresh failed - user session is invalid
            // Don't sign out, just mark as not admin
            console.error('Session refresh failed:', refreshError?.message);
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }
          
          currentToken = refreshData.session.access_token;
        }

        // Call check-admin with current token
        const { data, error } = await supabase.functions.invoke('check-admin', {
          headers: {
            Authorization: `Bearer ${currentToken}`
          }
        });

        if (error) {
          console.error('Error checking admin status:', error);
          // Don't sign out on error - just set isAdmin to false
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.isAdmin === true);
        }
      } catch (error) {
        console.error('Error invoking check-admin:', error);
        // Don't sign out on error - just set isAdmin to false
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminStatus();
  }, [user, session, authLoading]);

  return { isAdmin, isLoading };
}
