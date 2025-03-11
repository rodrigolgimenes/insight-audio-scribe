
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAudioUrl = (audioUrl: string | null) => {
  const { toast } = useToast();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  const getSignedUrl = useCallback(async () => {
    if (!audioUrl) {
      console.log('[useAudioUrl] No audioUrl provided');
      setSignedUrl(null);
      setIsAudioReady(false);
      return;
    }

    try {
      console.log('[useAudioUrl] Processing audioUrl:', audioUrl);
      
      // Extract just the file path, removing the full URL if present
      let cleanPath = audioUrl;
      
      // If it's a complete Supabase Storage URL
      if (cleanPath.includes('storage/v1/object/public/')) {
        const parts = cleanPath.split('audio_recordings/');
        if (parts.length > 1) {
          cleanPath = parts[1];
        } else {
          console.warn('[useAudioUrl] Could not extract path from URL:', cleanPath);
        }
      }
      
      // If it has URL parameters, remove them
      cleanPath = cleanPath.split('?')[0];
      
      console.log('[useAudioUrl] Cleaned path:', cleanPath);

      // First check if the file exists
      const pathParts = cleanPath.split('/');
      const bucketFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const fileName = pathParts[pathParts.length - 1];
      
      console.log('[useAudioUrl] Checking if file exists:', { bucketFolder, fileName });
      
      const { data: existsList, error: listError } = await supabase
        .storage
        .from('audio_recordings')
        .list(bucketFolder, {
          limit: 100,
          search: fileName
        });

      if (listError) {
        console.error('[useAudioUrl] Error listing files:', listError);
        throw new Error(`Failed to check file existence: ${listError.message}`);
      }

      const fileExists = existsList && existsList.some(file => file.name === fileName);
      
      console.log('[useAudioUrl] File existence check:', { 
        fileExists, 
        fileName,
        availableFiles: existsList?.map(f => f.name).join(', ') 
      });
      
      if (!fileExists) {
        throw new Error(`File not found in storage: ${cleanPath}`);
      }

      // Now create a signed URL
      const { data: signedData, error: signedError } = await supabase
        .storage
        .from('audio_recordings')
        .createSignedUrl(cleanPath, 3600);

      if (signedError) {
        console.error('[useAudioUrl] Error creating signed URL:', signedError);
        throw new Error(`Failed to create signed URL: ${signedError.message}`);
      }

      if (!signedData?.signedUrl) {
        console.error('[useAudioUrl] No signed URL returned');
        throw new Error('Failed to generate audio URL');
      }

      console.log('[useAudioUrl] Signed URL generated successfully');

      setSignedUrl(signedData.signedUrl);
      setIsAudioReady(true);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('[useAudioUrl] Error getting signed URL:', error);
      setError(error as Error);
      setIsAudioReady(false);
      setSignedUrl(null);
      
      // Only show toast if we're out of retries
      if (retryCount >= maxRetries) {
        toast({
          title: "Error Loading Audio",
          description: "The audio file could not be found or accessed. You may need to upload it again.",
          variant: "destructive",
        });
      } else if (retryCount === 0) {
        // Show toast on first attempt so user knows something's happening
        toast({
          title: "Loading Audio",
          description: "Attempting to load the audio file. This may take a moment.",
        });
      }
    }
  }, [audioUrl, toast, retryCount, maxRetries]);

  // Auto-retry mechanism
  useEffect(() => {
    if (error && retryCount < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
      console.log(`[useAudioUrl] Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        getSignedUrl();
      }, delay);
      
      return () => clearTimeout(timeoutId);
    }
  }, [error, retryCount, maxRetries, getSignedUrl]);

  // Initial fetch and refresh
  useEffect(() => {
    getSignedUrl();
    
    // Update signed URL every 45 minutes to avoid expiration
    const refreshInterval = setInterval(getSignedUrl, 45 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [getSignedUrl]);

  const retry = useCallback(() => {
    setRetryCount(0); // Reset retry count
    getSignedUrl();
  }, [getSignedUrl]);

  return { signedUrl, isAudioReady, error, retry };
};
