import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthErrorHandler = () => {
  useEffect(() => {
    const checkAndClearInvalidSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { error } = await supabase.auth.getUser();
          
          if (error && (
            error.message.includes('User from sub claim in JWT does not exist') || 
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('Invalid Refresh Token') ||
            error.status === 403
          )) {
            console.log('Detected invalid session, clearing...', error.message);
            await supabase.auth.signOut();
            localStorage.clear();
          }
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
        await supabase.auth.signOut();
        localStorage.clear();
      }
    };

    checkAndClearInvalidSession();
  }, []);
};
