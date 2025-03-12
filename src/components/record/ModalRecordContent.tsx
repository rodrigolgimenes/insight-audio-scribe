
import React from "react";
import { RecordingSection } from "./RecordingSection";
import { RecordingActions } from "./RecordingActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";

interface ModalRecordContentProps {
  recordingHook: any;
  error: string | null;
}

export function ModalRecordContent({
  recordingHook,
  error
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

  const isLoading = isSaving;
  const hasRecording = !!audioUrl;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <RecordingSection
        isRecording={isRecording}
        isPaused={isPaused}
        audioUrl={audioUrl}
        mediaStream={mediaStream}
        isSystemAudio={isSystemAudio}
        handleStartRecording={handleStartRecording}
        handleStopRecording={() => handleStopRecording().catch(err => {
          PageLoadTracker.trackPhase('Stop Recording Error', false, err.message);
          return { blob: null, duration: 0 };
        })}
        handlePauseRecording={handlePauseRecording}
        handleResumeRecording={handleResumeRecording}
        handleDelete={handleDelete}
        onSystemAudioChange={setIsSystemAudio}
        audioDevices={audioDevices}
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
