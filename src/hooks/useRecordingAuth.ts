
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export const useRecordingAuth = () => {
  const { session, loading: authLoading, error: authContextError } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        // If AuthProvider has already done the check, use that result
        if (!authLoading) {
          setAuthError(authContextError);
          setIsCheckingAuth(false);
          return;
        }

        // Only do a separate check if the AuthProvider is still loading
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Recording auth check error:", error);
          setAuthError(error.message);
        } else {
          console.log("Recording auth check result:", !!data.session);
          
          // If we found a session but AuthProvider doesn't have one yet,
          // store it in localStorage for AuthProvider to find
          if (data.session && !session) {
            localStorage.setItem('supabase.auth.session', JSON.stringify(data.session));
          }
          
          setAuthError(null);
        }
      } catch (err) {
        console.error("Failed to check recording auth:", err);
        setAuthError("Failed to verify authentication status");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [authLoading, authContextError, session]);

  return {
    isAuthenticated: !!session,
    isCheckingAuth: isCheckingAuth || authLoading,
    authError: authError || authContextError,
    user: session?.user || null
  };
};
