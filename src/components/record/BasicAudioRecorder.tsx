
import React from "react";
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

  // Safely handle the transcribe action with error handling
  const handleTranscribe = async () => {
    try {
      if (!audioUrl) {
        console.error("No audio URL available for transcription");
        return;
      }
      
      console.log("Starting transcription with duration:", recordingDuration);
      await handleSave(audioUrl, recordingDuration);
    } catch (error) {
      console.error("Error in transcribe handler:", error);
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
                    onClick={handleTranscribe}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isSaving || disabled || !audioUrl}
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
                      {saveProgress < 100 ? `Saving: ${saveProgress}%` : "Complete"}
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
              onClick={() => stopRecording()}
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
