import { useCallback } from "react";
import { useToast } from "../use-toast";
import { RecordingStateType } from "./useRecordingState";

export const useRecordingActions = (
  recordingState: RecordingStateType,
  selectedDeviceId: string | null,
  streamManager: {
    requestMicrophoneAccess: (deviceId: string | null, isSystemAudio: boolean) => Promise<MediaStream | null>;
  },
  recorder: React.RefObject<any>,
  setLastAction: (action: {action: string, timestamp: number, success: boolean, error?: string} | null) => void
) => {
  const { toast } = useToast();
  const {
    isRecording, 
    isPaused,
    audioUrl,
    mediaStream,
    isSystemAudio,
    setIsRecording,
    setIsPaused,
    setAudioUrl,
    setMediaStream,
    setIsSaving,
    setIsSystemAudio
  } = recordingState;

  // Handle system audio toggle
  const handleSystemAudioChange = useCallback((enabled: boolean) => {
    console.log('[useRecordingActions] System audio setting changed to:', enabled);
    setIsSystemAudio(enabled);
    setLastAction({
      action: `System audio ${enabled ? 'enabled' : 'disabled'}`,
      timestamp: Date.now(),
      success: true
    });
  }, [setIsSystemAudio, setLastAction]);

  // Request audio capture and start recording
  const handleStartRecording = useCallback(async () => {
    console.log('[useRecordingActions] Starting recording with device ID:', selectedDeviceId);
    
    // Set start action record
    setLastAction({
      action: 'Start recording',
      timestamp: Date.now(),
      success: false // Will be updated if successful
    });
    
    if (!selectedDeviceId) {
      console.error('[useRecordingActions] No device selected');
      toast({
        title: "Error",
        description: "Select a microphone before starting the recording.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // First obtain the media stream
      const stream = await streamManager.requestMicrophoneAccess(selectedDeviceId, isSystemAudio);
      
      if (!stream) {
        throw new Error('Failed to get media stream');
      }
      
      // Set the media stream to state
      setMediaStream(stream);
      
      // Then start recording with the stream
      if (recorder.current) {
        await recorder.current.startRecording(stream);
      } else {
        throw new Error('Recorder not initialized');
      }
      
      // Update state
      setIsRecording(true);
      setIsPaused(false);
      
      // Update the action record if we get this far without errors
      setTimeout(() => {
        if (isRecording) {
          setLastAction({
            action: 'Start recording',
            timestamp: Date.now(),
            success: true
          });
        }
      }, 500);
    } catch (error) {
      console.error('[useRecordingActions] Error starting recording:', error);
      toast({
        title: "Error",
        description: "Failed to start recording. Check browser permissions.",
        variant: "destructive",
      });
      setLastAction({
        action: 'Start recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [selectedDeviceId, isSystemAudio, streamManager, recorder, toast, isRecording, setIsRecording, setIsPaused, setMediaStream, setLastAction]);

  const handleStopRecording = useCallback(async () => {
    console.log('[useRecordingActions] Stopping recording');
    setLastAction({
      action: 'Stop recording',
      timestamp: Date.now(),
      success: false
    });
    
    try {
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      const result = await recorder.current.stopRecording();
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: true
      });
      
      // Stop and remove the media stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
      
      if (result.blob) {
        // Create URL for the blob
        const url = URL.createObjectURL(result.blob);
        setAudioUrl(url);
      }
      
      setIsRecording(false);
      setIsPaused(false);
      
      return { blob: result.blob, duration: result.duration };
    } catch (error) {
      console.error('[useRecordingActions] Error stopping recording:', error);
      toast({
        title: "Error",
        description: "Failed to finalize recording.",
        variant: "destructive",
      });
      setLastAction({
        action: 'Stop recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return { blob: null, duration: 0 };
    }
  }, [recorder, toast, mediaStream, setAudioUrl, setIsRecording, setIsPaused, setMediaStream, setLastAction]);

  const handlePauseRecording = useCallback(() => {
    console.log('[useRecordingActions] Pausing recording');
    
    try {
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      recorder.current.pauseRecording();
      setIsPaused(true);
      
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingActions] Error pausing recording:', error);
      setLastAction({
        action: 'Pause recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [recorder, setIsPaused, setLastAction]);

  const handleResumeRecording = useCallback(() => {
    console.log('[useRecordingActions] Resuming recording');
    
    try {
      if (!recorder.current) {
        throw new Error('Recorder not initialized');
      }
      
      recorder.current.resumeRecording();
      setIsPaused(false);
      
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: true
      });
    } catch (error) {
      console.error('[useRecordingActions] Error resuming recording:', error);
      setLastAction({
        action: 'Resume recording',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [recorder, setIsPaused, setLastAction]);

  // Function to handle delete operation
  const handleDelete = useCallback(() => {
    console.log('[useRecordingActions] Deleting recording');
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    setIsRecording(false);
    setIsPaused(false);
    
    setLastAction({
      action: 'delete',
      timestamp: Date.now(),
      success: true
    });
  }, [audioUrl, mediaStream, setAudioUrl, setIsRecording, setIsPaused, setMediaStream, setLastAction]);

  // Function to handle save operation
  const handleSaveRecording = useCallback(async () => {
    // This would typically involve additional logic to save the recording
    console.log('[useRecordingActions] Saving recording');
    setIsSaving(true);
    
    try {
      // Simulating a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastAction({
        action: 'save',
        timestamp: Date.now(),
        success: true
      });
      
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('[useRecordingActions] Error saving recording:', error);
      setLastAction({
        action: 'save',
        timestamp: Date.now(),
        success: false
      });
      
      setIsSaving(false);
      return false;
    }
  }, [setIsSaving, setLastAction]);

  return {
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    handleSystemAudioChange
  };
};
