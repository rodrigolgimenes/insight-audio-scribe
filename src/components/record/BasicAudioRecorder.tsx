
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import AudioPlayer from "./AudioPlayer";
import { useBasicRecording } from "@/hooks/useBasicRecording";
import { useSaveRecording } from "@/hooks/useSaveRecording";
import { RecordingTimer } from "./RecordingTimer";
import { PermissionError } from "./PermissionError";

interface BasicAudioRecorderProps {
  onRecordingSaved: (noteId: string) => void;
  disabled?: boolean;
}

export const BasicAudioRecorder = ({ onRecordingSaved, disabled = false }: BasicAudioRecorderProps) => {
  const {
    isRecording,
    audioUrl,
    elapsedTime,
    permissionError,
    recordingDuration,
    startRecording,
    stopRecording,
    setAudioUrl
  } = useBasicRecording();

  const {
    handleSave,
    isSaving,
    saveProgress
  } = useSaveRecording(onRecordingSaved);

  const [status, setStatus] = useState<string>("");

  // Safely handle the transcribe action with proper promise handling
  const handleTranscribe = async () => {
    try {
      console.log("Starting transcription process");
      setStatus("Preparing recording...");
      
      // If we're currently recording, stop the recording first and get the blob
      let audioBlob: Blob | null = null;
      let audioDuration = recordingDuration;
      
      if (isRecording) {
        setStatus("Stopping recording...");
        console.log("Stopping active recording before transcription");
        
        try {
          // Wait for the recording to stop and get the blob
          const result = await stopRecording();
          console.log("stopRecording completed with result:", result);
          
          if (!result.blob) {
            throw new Error("Failed to get audio data from recording");
          }
          
          audioBlob = result.blob;
          audioDuration = result.duration;
          console.log("Recording stopped successfully, blob size:", audioBlob.size, "duration:", audioDuration);
        } catch (error) {
          console.error("Failed to stop recording:", error);
          setStatus("Error stopping recording");
          toast.error("Failed to stop recording properly");
          throw new Error("Failed to stop recording properly");
        }
      } else if (audioUrl) {
        // If we have an audioUrl but we're not recording, fetch the blob from the URL
        setStatus("Preparing audio data...");
        console.log("Fetching audio data from URL");
        
        try {
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch audio data");
          }
          audioBlob = await response.blob();
          console.log("Fetched audio blob, size:", audioBlob.size);
        } catch (error) {
          console.error("Error fetching audio data:", error);
          setStatus("Error preparing audio");
          throw new Error("Failed to prepare audio data");
        }
      }
      
      // Validate we have a valid audio blob to process
      if (!audioBlob) {
        console.error("No audio data available for transcription");
        setStatus("No audio available");
        throw new Error("No audio data available for transcription");
      }

      // Now we have a valid audio blob, proceed with saving and transcription
      setStatus("Processing audio...");
      console.log("Starting transcription with duration:", audioDuration);
      
      // Pass audioBlob and audioDuration to handleSave
      await handleSave(audioBlob, audioDuration);
      setStatus(""); // Clear status when done
      console.log("Transcription process completed successfully");
      
    } catch (error) {
      console.error("Error in transcribe handler:", error);
      setStatus("Error: " + (error instanceof Error ? error.message : "Unknown error"));
      toast.error("Transcription failed", { 
        description: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3">
        {(isRecording || elapsedTime > 0) && (
          <RecordingTimer elapsedTime={elapsedTime} />
        )}
        
        <div className="flex justify-center">
          {!isRecording ? (
            audioUrl ? (
              <div className="w-full space-y-4">
                <AudioPlayer audioUrl={audioUrl} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setAudioUrl();
                    }}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        await handleTranscribe();
                      } catch (error) {
                        console.error("Transcription failed:", error);
                      }
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isSaving || disabled || !audioUrl}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {status || "Saving..."}
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
                      {saveProgress < 100 ? `${status || "Saving"}: ${saveProgress}%` : "Complete"}
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
              onClick={async () => {
                try {
                  await stopRecording();
                } catch (error) {
                  console.error("Error stopping recording:", error);
                  toast.error("Failed to stop recording");
                }
              }}
              disabled={disabled}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Stop Recording"
            >
              <StopCircle className="h-8 w-8" />
            </Button>
          )}
        </div>
        
        {permissionError && <PermissionError error={permissionError} />}
      </div>
    </div>
  );
};
