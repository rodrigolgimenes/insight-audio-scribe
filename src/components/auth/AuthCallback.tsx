
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("AuthCallback: Processing authentication callback");
        
        // Handle the OAuth callback explicitly and establish the session
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error("Auth callback error:", authError);
          setError(authError.message);
          toast.error("Authentication failed", {
            description: authError.message
          });
          navigate('/login');
          return;
        }
        
        if (authData.session) {
          console.log("Auth successful, session established:", !!authData.session);
          
          // Store session in localStorage for persistence
          localStorage.setItem('supabase.auth.session', JSON.stringify(authData.session));
          
          // Explicitly set the auth state
          await supabase.auth.setSession(authData.session);
          
          toast.success("Authentication successful");
          
          // Wait a moment to ensure session is properly set
          setTimeout(() => {
            navigate('/app');
          }, 500);
        } else {
          console.error("No session found after redirect");
          setError("No session found after login. Please try again.");
          toast.error("Authentication failed", {
            description: "No session was established"
          });
          navigate('/login');
        }
      } catch (err) {
        console.error("Unexpected error during auth callback:", err);
        setError("An unexpected error occurred");
        toast.error("Authentication failed");
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ghost-white">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ghost-white">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-700">Completing your login...</p>
      </div>
    </div>
  );
};
