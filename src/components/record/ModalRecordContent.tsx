
import React, { useEffect } from "react";
import { RecordingSection } from "./RecordingSection";
import { RecordingActions } from "./RecordingActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { toast } from "sonner";

interface ModalRecordContentProps {
  recordingHook: any;
  error: string | null;
  errorDetails?: string | null;
}

export function ModalRecordContent({
  recordingHook,
  error,
  errorDetails
}: ModalRecordContentProps) {
  PageLoadTracker.trackPhase('ModalRecordContent Render', true);
  
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    handleSaveRecording,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady,
    lastAction
  } = recordingHook;

  // Log state changes for debugging
  useEffect(() => {
    console.log("[ModalRecordContent] State:", {
      isRecording,
      isPaused,
      hasAudioUrl: !!audioUrl,
      hasMediaStream: !!mediaStream,
      deviceSelectionReady,
      deviceCount: audioDevices?.length || 0,
      selectedDeviceId
    });
  }, [isRecording, isPaused, audioUrl, mediaStream, deviceSelectionReady, audioDevices, selectedDeviceId]);

  // Notify user when device selection is ready
  useEffect(() => {
    if (deviceSelectionReady) {
      toast.success("Audio devices detected", {
        description: `${audioDevices?.length || 0} devices available`
      });
    }
  }, [deviceSelectionReady, audioDevices]);

  const isLoading = isSaving;
  const hasRecording = !!audioUrl;

  const handleSafeStopRecording = () => {
    return handleStopRecording().catch(err => {
      PageLoadTracker.trackPhase('Stop Recording Error', false, err.message);
      console.error("[ModalRecordContent] Stop recording error:", err);
      toast.error("Failed to stop recording", {
        description: err.message
      });
      return { blob: null, duration: 0 };
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">{error}</div>
            {errorDetails && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer">Technical details</summary>
                <div className="mt-1 text-xs opacity-80 whitespace-pre-wrap">
                  {errorDetails}
                </div>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <RecordingSection
        isRecording={isRecording}
        isPaused={isPaused}
        audioUrl={audioUrl}
        mediaStream={mediaStream}
        isSystemAudio={isSystemAudio}
        handleStartRecording={handleStartRecording}
        handleStopRecording={handleSafeStopRecording}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        handleDelete={handleDelete}
        onSystemAudioChange={setIsSystemAudio}
        audioDevices={audioDevices || []}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={setSelectedDeviceId}
        deviceSelectionReady={deviceSelectionReady}
        showPlayButton={true}
        showDeleteButton={true}
        lastAction={lastAction}
      />

      <RecordingActions
        onSave={handleSaveRecording}
        isSaving={isSaving}
        isLoading={isLoading}
        isRecording={isRecording}
        hasRecording={hasRecording}
      />
    </div>
  );
}
