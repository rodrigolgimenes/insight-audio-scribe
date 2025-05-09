
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Define the context type
type TranscriptionContextType = {
  canTranscribe: boolean;
  isLoading: boolean;
  error: string | null;
};

// Create context with default values
const TranscriptionContext = createContext<TranscriptionContextType>({
  canTranscribe: false,
  isLoading: true,
  error: null,
});

// Custom hook to use the transcription context
export const useTranscription = () => {
  const context = useContext(TranscriptionContext);
  
  if (context === undefined) {
    throw new Error('useTranscription must be used within a TranscriptionProvider');
  }
  
  return context;
};

interface TranscriptionProviderProps {
  children: ReactNode;
}

export const LazyTranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
  const [canTranscribe, setCanTranscribe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Only proceed with transcription services if user is authenticated
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log('TranscriptionProvider: User is authenticated, enabling transcription services');
          setCanTranscribe(true);
        } else {
          console.log('TranscriptionProvider: User is not authenticated, disabling transcription services');
          setCanTranscribe(false);
        }
        
        setError(null);
      } catch (err) {
        console.error('TranscriptionProvider: Error checking authentication', err);
        setError('Failed to initialize transcription services');
        setCanTranscribe(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCanTranscribe(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <TranscriptionContext.Provider value={{ canTranscribe, isLoading, error }}>
      {children}
    </TranscriptionContext.Provider>
  );
};

// This component only renders children when transcription is available
export const TranscriptionGuard: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  const { canTranscribe, isLoading } = useTranscription();
  
  if (isLoading) return null;
  
  return canTranscribe ? <>{children}</> : <>{fallback}</>;
};
