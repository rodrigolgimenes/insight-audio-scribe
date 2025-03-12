
import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RecordingSection } from "./RecordingSection";

interface ModalRecordContentProps {
  recordingHook: any;
  error: string | null;
  errorDetails: string | null;
}

export function ModalRecordContent({ recordingHook, error, errorDetails }: ModalRecordContentProps) {
  if (error) {
    return (
      <div className="text-red-500 p-4">
        <p>{error}</p>
        {errorDetails && <pre className="mt-2 text-xs">{errorDetails}</pre>}
      </div>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record Audio</DialogTitle>
      </DialogHeader>

      <RecordingSection
        isRecording={recordingHook.isRecording}
        isPaused={recordingHook.isPaused}
        audioUrl={recordingHook.audioUrl}
        mediaStream={recordingHook.mediaStream}
        isSystemAudio={recordingHook.isSystemAudio}
        handleStartRecording={recordingHook.handleStartRecording}
        handleStopRecording={recordingHook.handleStopRecording}
        handlePauseRecording={recordingHook.handlePauseRecording}
        handleResumeRecording={recordingHook.handleResumeRecording}
        handleDelete={recordingHook.handleDelete}
        onSystemAudioChange={recordingHook.setIsSystemAudio}
        audioDevices={recordingHook.audioDevices || []}
        selectedDeviceId={recordingHook.selectedDeviceId}
        onDeviceSelect={recordingHook.setSelectedDeviceId}
        deviceSelectionReady={recordingHook.deviceSelectionReady}
        showPlayButton={true}
        showDeleteButton={true}
        lastAction={recordingHook.lastAction}
      />
    </>
  );
}
