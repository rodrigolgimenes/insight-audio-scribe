
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export const useRecordingAuth = () => {
  const { session } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth error:", error);
          setAuthError(error.message);
        } else {
          setAuthError(null);
        }
      } catch (err) {
        console.error("Failed to check auth:", err);
        setAuthError("Failed to verify authentication status");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  return {
    isAuthenticated: !!session,
    isCheckingAuth,
    authError,
    user: session?.user || null
  };
};
