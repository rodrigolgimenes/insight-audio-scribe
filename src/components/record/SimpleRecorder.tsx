
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import AudioPlayer from "./AudioPlayer";

interface SimpleRecorderProps {
  disabled?: boolean;
  onRecordingSaved: (noteId: string) => void;
  onError: (error: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export const SimpleRecorder = ({ 
  disabled = false,
  onRecordingSaved,
  onError,
  onLoadingChange
}: SimpleRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);

  // Update parent loading state
  useEffect(() => {
    onLoadingChange(isRecording || isSaving);
  }, [isRecording, isSaving, onLoadingChange]);
  
  const startRecording = async () => {
    try {
      setPermissionError(null);
      chunksRef.current = [];
      setAudioUrl(null);
      
      // Request microphone permission with fallback attempts
      let stream;
      try {
        // First attempt with detailed settings
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (initialError) {
        console.log("Initial attempt failed, trying simpler configuration", initialError);
        
        // Second attempt with simple configuration
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException) {
            if (fallbackError.name === 'NotAllowedError') {
              setPermissionError("Microphone access denied. Please allow access in your browser settings.");
              toast.error("Microphone access denied", {
                description: "Check your browser permission settings"
              });
            } else if (fallbackError.name === 'NotFoundError') {
              setPermissionError("No microphone found. Please connect a microphone and try again.");
              toast.error("No microphone found", {
                description: "Please connect a microphone and try again"
              });
            } else {
              setPermissionError(`Microphone error: ${fallbackError.message}`);
              toast.error("Microphone error", {
                description: fallbackError.message
              });
            }
          } else {
            setPermissionError("Unknown microphone error.");
            toast.error("Unknown error");
          }
          return;
        }
      }
      
      // Check if we got a stream
      if (!stream) {
        setPermissionError("Failed to get audio stream");
        return;
      }
      
      // Try to use high quality codecs with fallback
      let options;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const endTime = Date.now();
        const duration = recordingStartTime ? endTime - recordingStartTime : 0;
        setRecordingDuration(duration);
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Reset state
        setIsRecording(false);
        
        // Clear timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Audio and visual feedback that recording is complete
        toast.success("Recording completed", {
          description: `Duration: ${formatTime(Math.floor(duration / 1000))}`
        });
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      
      // Set start time and start timer
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setElapsedTime(0);
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setIsRecording(true);
      
      toast.success("Recording started", {
        description: "Speak into your microphone"
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      setPermissionError(error instanceof Error ? error.message : "Unknown error");
      toast.error("Error starting recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.info("Finalizing recording...");
    }
  };
  
  const handleTranscribe = async () => {
    if (!audioUrl) {
      toast.error("No audio available");
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveProgress(10);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to save recordings");
      }
      
      // Fetch audio data
      const response = await fetch(audioUrl);
      const recordingBlob = await response.blob();
      
      if (!recordingBlob) {
        throw new Error("Failed to get recording data");
      }
      
      setSaveProgress(25);
      
      console.log('Original recording format:', recordingBlob.type, 'Size:', Math.round(recordingBlob.size / 1024 / 1024 * 100) / 100, 'MB');
      
      // Create a file name with user ID and timestamp
      const fileName = `${user.id}/${Date.now()}.${getExtensionFromMimeType(recordingBlob.type)}`;
      
      // Calculate duration in milliseconds
      const recordedDuration = recordingDuration;
      console.log('Recording duration in milliseconds:', recordedDuration);
      
      setSaveProgress(40);
      
      // Create recording entry in database
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordedDuration),
          file_path: fileName,
          user_id: user.id,
          status: 'pending',
          needs_compression: true,
          original_file_type: recordingBlob.type
        })
        .select()
        .single();
      
      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }
      
      setSaveProgress(60);
      
      // Create note entry
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(recordedDuration)
        })
        .select()
        .single();
      
      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }
      
      setSaveProgress(75);
      
      // Upload the audio file
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, recordingBlob, {
          contentType: recordingBlob.type,
          upsert: true
        });
      
      if (uploadError) {
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      setSaveProgress(90);
      
      // Log the upload success
      await supabase
        .from('processing_logs')
        .insert({
          recording_id: recordingData.id,
          note_id: noteData.id,
          stage: 'upload_complete',
          message: 'Original file uploaded successfully, pending compression and processing',
          status: 'success',
          details: {
            originalFormat: recordingBlob.type,
            originalSize: recordingBlob.size,
            pendingCompression: true
          }
        });
      
      setSaveProgress(95);
      
      // Start background processing
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id, noteId: noteData.id },
        });
      
      if (processError) {
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      } else {
        toast.success("Recording saved! Processing will continue in the background.");
      }
      
      setSaveProgress(100);
      
      // Call the callback with the note ID to navigate to dashboard
      onRecordingSaved(noteData.id);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      onError(error instanceof Error ? error.message : "Unknown error saving recording");
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get file extension from MIME type
  const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeToExt: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/flac': 'flac'
    };
    
    return mimeToExt[mimeType] || 'mp3';
  };
  
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3">
        {(isRecording || elapsedTime > 0) && (
          <div className="text-center font-mono text-xl">
            {formatTime(elapsedTime)}
          </div>
        )}
        
        <div className="flex justify-center">
          {!isRecording ? (
            audioUrl ? (
              <div className="w-full space-y-4">
                <AudioPlayer audioUrl={audioUrl} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setAudioUrl(null);
                      setElapsedTime(0);
                    }}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                  
                  <Button 
                    onClick={handleTranscribe}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isSaving || disabled}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Transcribe"
                    )}
                  </Button>
                </div>
                
                {isSaving && saveProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={saveProgress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      {saveProgress < 100 
                        ? `Saving: ${saveProgress}%`
                        : "Complete"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
                aria-label="Start Recording"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )
          ) : (
            <Button
              onClick={stopRecording}
              disabled={disabled}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Stop Recording"
            >
              <StopCircle className="h-8 w-8" />
            </Button>
          )}
        </div>
        
        {permissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Permission Error</p>
              <p className="text-red-600 text-sm">{permissionError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
