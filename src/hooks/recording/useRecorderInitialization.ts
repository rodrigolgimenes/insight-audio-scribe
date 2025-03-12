
import { useEffect } from "react";

/**
 * Hook to handle recorder initialization and error handling
 */
export const useRecorderInitialization = (
  initializeRecorder: () => (() => void),
  setInitError: (error: Error | null) => void,
  selectedDeviceId: string | null
) => {
  // Initialize recorder
  useEffect(() => {
    console.log('[useRecorderInitialization] Initializing recorder...');
    let cleanup = () => {};
    
    try {
      cleanup = initializeRecorder();
      console.log('[useRecorderInitialization] Recorder initialized successfully');
    } catch (error) {
      console.error('[useRecorderInitialization] Error initializing recorder:', error);
      setInitError(error instanceof Error ? error : new Error('Unknown error initializing recorder'));
    }
    
    return () => {
      console.log('[useRecorderInitialization] Cleaning up recorder');
      cleanup();
    };
  }, [initializeRecorder, setInitError]);

  // Clear any initialization errors when device selection changes
  useEffect(() => {
    if (selectedDeviceId) {
      setInitError(null);
      console.log('[useRecorderInitialization] Device selected, cleared init error');
    }
  }, [selectedDeviceId, setInitError]);
};
