
import React from "react";
import { ShellLayout } from "@/components/layouts/ShellLayout";
import { RecordingSection } from "@/components/record/RecordingSection";
import { useRecording } from "@/hooks/useRecording";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { AppPageHeader } from "@/components/dashboard/AppPageHeader";

export default function RecordPage() {
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    isSystemAudio,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    handleSaveRecording,
    handleDelete,
    deviceSelectionReady,
    lastAction,
    refreshDevices,
    devicesLoading,
    permissionState,
    processingProgress = 0,  // Provide default value
    processingStage = "",    // Provide default value
    isLoading = false        // Provide default value
  } = useRecording();

  // Create wrapper functions that return proper Promise types
  const handleWrappedStopRecording = async () => {
    try {
      await handleStopRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };
  
  const handleWrappedRefreshDevices = async () => {
    try {
      if (refreshDevices) {
        await refreshDevices();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return Promise.reject(error);
    }
  };

  return (
    <ShellLayout>
      <div className="container mx-auto p-4">
        <AppPageHeader
          title="New Recording"
          description="Record audio for automatic transcription and meeting notes"
        />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-6">
          <div>
            <RecordingSection
              isRecording={isRecording}
              isPaused={isPaused}
              audioUrl={audioUrl}
              mediaStream={mediaStream}
              isSystemAudio={isSystemAudio}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleWrappedStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              handleDelete={handleDelete}
              onSystemAudioChange={setIsSystemAudio}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={setSelectedDeviceId}
              deviceSelectionReady={deviceSelectionReady}
              onSave={handleSaveRecording}
              isSaving={isSaving}
              isLoading={isLoading}
              lastAction={lastAction}
              onRefreshDevices={handleWrappedRefreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState as any}
              processingProgress={processingProgress}
              processingStage={processingStage}
            />
          </div>

          <div>
            <ProcessedContentSection
              audioUrl={audioUrl}
              isLoading={isTranscribing || isSaving}
              isRecording={isRecording}
            />
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
