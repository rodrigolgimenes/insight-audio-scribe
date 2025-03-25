
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useEffect } from "react";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (session && !loading) {
      console.log("User already authenticated, redirecting to app");
      navigate("/app");
    }
  }, [session, loading, navigate]);

  // Don't render the auth UI if we're loading or already have a session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect in the useEffect
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
