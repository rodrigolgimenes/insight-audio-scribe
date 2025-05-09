
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { RequestLogger } from "@/utils/debug/RequestLogger";

export const SimpleLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const from = (location.state as any)?.from?.pathname || "/app";
  const [isMonitoring, setIsMonitoring] = useState(true);

  // Simple direct session check without any other hooks
  useEffect(() => {
    // Check only for session, avoid other hooks
    const checkSession = async () => {
      try {
        console.log("SimpleLoginPage: Checking session directly");
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          console.log("SimpleLoginPage: Found session, redirecting");
          setSession(data.session);
        }
      } catch (err) {
        console.error("SimpleLoginPage: Error checking session", err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Redirect if we have a session
  useEffect(() => {
    if (session) {
      console.log("SimpleLoginPage: Session found, redirecting to", from);
      navigate(from);
    }
  }, [session, navigate, from]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {isMonitoring && <RequestLogger urlPattern="transcribe" setMonitoring={setIsMonitoring} />}
      
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to InsightScribe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account or create a new one
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center my-8">
            <Spinner size="lg" />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
