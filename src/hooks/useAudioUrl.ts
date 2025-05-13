
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
      
      // Handle URL encoded characters if present
      let decodedPath = cleanPath;
      try {
        if (cleanPath.includes('%')) {
          decodedPath = decodeURIComponent(cleanPath);
          console.log('[useAudioUrl] Decoded path:', decodedPath);
        }
      } catch (e) {
        console.error('[useAudioUrl] Error decoding path:', e);
      }
      
      console.log('[useAudioUrl] Cleaned path:', cleanPath);

      // Check if the file exists directly using download with head request
      try {
        const { data: fileExists, error: headError } = await supabase
          .storage
          .from('audio_recordings')
          .download(decodedPath, {
            transform: {
              width: 1, // Minimum size
              height: 1,
              resize: 'contain',
            }
          });
        
        if (headError) {
          console.error('[useAudioUrl] Error checking file existence:', headError);
          
          // Try one more direct approach - create a signed URL and check if it works
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from('audio_recordings')
            .createSignedUrl(decodedPath, 60);
          
          if (signedUrlError || !signedUrlData?.signedUrl) {
            throw new Error(`File not accessible in storage: ${cleanPath}`);
          }
          
          // Verify the signed URL actually works
          const signedUrlCheck = await fetch(signedUrlData.signedUrl, { method: 'HEAD' });
          if (!signedUrlCheck.ok) {
            throw new Error(`File exists but is not accessible: ${cleanPath}`);
          }
          
          // If we got here, the file exists and is accessible
          setSignedUrl(signedUrlData.signedUrl);
          setIsAudioReady(true);
          setError(null);
          setRetryCount(0);
          return;
        }
        
        // If we got data back, the file exists
        console.log('[useAudioUrl] File exists check passed');
      } catch (existsErr) {
        console.error('[useAudioUrl] Error in file existence check:', existsErr);
        // Continue to the list-based check as backup method
      }

      // As a fallback, try listing files to check existence
      const pathParts = decodedPath.split('/');
      const bucketFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      const fileName = pathParts[pathParts.length - 1];
      
      console.log('[useAudioUrl] Checking if file exists via listing:', { bucketFolder, fileName });
      
      const { data: existsList, error: listError } = await supabase
        .storage
        .from('audio_recordings')
        .list(bucketFolder, {
          limit: 100,
          search: fileName.split('%')[0] // Search for the first part before any encoding
        });

      if (listError) {
        console.error('[useAudioUrl] Error listing files:', listError);
        throw new Error(`Failed to check file existence: ${listError.message}`);
      }

      // Try to find exact file match first
      let exactFile = existsList?.find(file => file.name === fileName);
      
      // If no exact match and filename has encoded characters, try to find similar files
      if (!exactFile && fileName.includes('%')) {
        const fileNameBase = fileName.split('%')[0];
        const similarFiles = existsList?.filter(file => file.name.startsWith(fileNameBase));
        
        if (similarFiles && similarFiles.length > 0) {
          exactFile = similarFiles[0];
          decodedPath = `${bucketFolder}/${exactFile.name}`;
          console.log('[useAudioUrl] Found similar file:', exactFile.name);
        }
      }
      
      const fileExists = !!exactFile;
      
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
        .createSignedUrl(decodedPath, 3600);

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

  // Auto-retry mechanism with exponential backoff
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
