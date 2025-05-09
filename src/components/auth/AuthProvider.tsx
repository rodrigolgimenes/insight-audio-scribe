
import React from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  error: string | null;
};

const AuthContext = React.createContext<AuthContextType>({ 
  session: null, 
  loading: true,
  error: null
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Track initialization to avoid showing toast on page load/refresh
  const isInitialMount = React.useRef(true);
  // Track visibility changes to prevent duplicate notifications
  const wasHidden = React.useRef(false);
  // Track auth events to prevent duplicate notifications
  const lastAuthEvent = React.useRef<{event: string, time: number}>({event: '', time: 0});

  // Handle visibility change to prevent notifications on tab refocus
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  React.useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    
    // Set up the auth state listener FIRST to avoid missing any auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, !!newSession);
        
        const now = Date.now();
        const isRecentDuplicate = 
          lastAuthEvent.current.event === event && 
          (now - lastAuthEvent.current.time < 2000);
        
        // Update last event tracking
        lastAuthEvent.current = { event, time: now };
        
        if (event === 'SIGNED_IN' && newSession) {
          // Store session in localStorage for persistence across page refreshes
          localStorage.setItem('supabase.auth.session', JSON.stringify(newSession));
          
          // Only show toast for actual user sign-ins, not initial page loads or tab refocus
          if (!isInitialMount.current && !wasHidden.current && !isRecentDuplicate) {
            toast.success("Signed in successfully");
          }
          
          // Reset visibility tracking after handling the event
          wasHidden.current = false;
          
          setSession(newSession);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // Clear localStorage on sign out
          localStorage.removeItem('supabase.auth.session');
          
          // Only show toast for actual user sign-outs
          if (!isRecentDuplicate) {
            toast.info("Signed out");
          }
          
          setSession(null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          // Update localStorage with refreshed token
          localStorage.setItem('supabase.auth.session', JSON.stringify(newSession));
          console.log("Auth token refreshed");
          setSession(newSession);
          setLoading(false);
        }
        
        // After first auth state change, no longer on initial mount
        if (isInitialMount.current) {
          isInitialMount.current = false;
        }
      }
    );

    // THEN check the current session
    const checkSession = async () => {
      try {
        console.log("AuthProvider: Checking current session");
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session retrieval error:", sessionError);
          setError(sessionError.message);
        } else if (data?.session) {
          console.log("Initial session check:", !!data.session);
          // Store valid session in localStorage
          localStorage.setItem('supabase.auth.session', JSON.stringify(data.session));
          setSession(data.session);
          setError(null);
        } else {
          console.log("No active session found");
          localStorage.removeItem('supabase.auth.session');
        }
      } catch (err) {
        console.error("Unexpected error checking session:", err);
        setError("Failed to check authentication");
      } finally {
        // Always set loading to false after checking session, even if there's no session
        setLoading(false);
        // After initial session check, mark initial mount as complete
        isInitialMount.current = false;
      }
    };

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
