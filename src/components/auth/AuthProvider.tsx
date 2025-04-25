
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

  React.useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    
    const storedSession = localStorage.getItem('supabase.auth.session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        if (parsedSession && !parsedSession.error) {
          console.log("AuthProvider: Found stored session");
          setSession(parsedSession);
        }
      } catch (err) {
        console.error("Failed to parse stored session:", err);
        localStorage.removeItem('supabase.auth.session');
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, !!newSession);
        
        if (event === 'SIGNED_IN' && newSession) {
          // Removed toast.success("Signed in successfully")
          localStorage.setItem('supabase.auth.session', JSON.stringify(newSession));
          setSession(newSession);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase.auth.session');
          toast.info("Signed out");
          setSession(null);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          localStorage.setItem('supabase.auth.session', JSON.stringify(newSession));
          console.log("Auth token refreshed");
          setSession(newSession);
        }
        
        setLoading(false);
      }
    );

    const checkSession = async () => {
      try {
        console.log("AuthProvider: Checking current session");
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session retrieval error:", sessionError);
          setError(sessionError.message);
        } else if (data?.session) {
          console.log("Initial session check:", !!data.session);
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
        setLoading(false);
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

