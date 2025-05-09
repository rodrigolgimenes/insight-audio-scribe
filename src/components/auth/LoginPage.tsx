
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading } = useAuth();
  const from = (location.state as any)?.from?.pathname || "/app";

  useEffect(() => {
    // Check for stored session in localStorage as a backup
    const storedSession = localStorage.getItem('supabase.auth.session');
    const hasStoredSession = !!storedSession;
    
    console.log("LoginPage: Auth check", { 
      loading, 
      hasSession: !!session, 
      hasStoredSession
    });

    // Only redirect if we have a session and loading is finished
    if ((session || hasStoredSession) && !loading) {
      console.log("User already authenticated, redirecting to app");
      navigate(from);
    }
  }, [session, loading, navigate, from]);

  // Show a loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white">
        <Spinner size="lg" />
      </div>
    );
  }

  // If we have a session, don't render the login form (will redirect in the useEffect)
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ghost-white">
        <Spinner size="lg" />
        <p className="ml-2 text-gray-600">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to InsightScribe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>
        <div className="mt-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4285F4',
                    brandAccent: '#3367D6',
                  },
                },
              },
            }}
            theme="light"
            providers={["google"]}
            redirectTo={`${window.location.origin}/auth/callback`}
            onlyThirdPartyProviders={true}
            queryParams={{
              access_type: 'offline',
              prompt: 'consent',
              scope: 'openid email profile'
            }}
          />
        </div>
      </div>
    </div>
  );
};
