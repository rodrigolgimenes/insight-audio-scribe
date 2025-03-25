
import * as React from "react";
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // The critical part: set up the auth listener FIRST, before checking the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event, !!newSession);
        
        if (event === 'SIGNED_IN' && newSession) {
          toast.success("Signed in successfully");
        } else if (event === 'SIGNED_OUT') {
          toast.info("Signed out");
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Auth token refreshed");
        }
        
        setSession(newSession);
        setLoading(false);
      }
    );

    // THEN check the current session
    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session retrieval error:", sessionError);
          setError(sessionError.message);
        } else {
          console.log("Initial session check:", !!data.session);
          setSession(data.session);
          setError(null);
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
