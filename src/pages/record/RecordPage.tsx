
import React, { useState } from "react";
import { ShellLayout } from "@/components/layouts/ShellLayout";
import { RecordingSection } from "@/components/record/RecordingSection";
import { useRecording } from "@/hooks/useRecording";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { AppPageHeader } from "@/components/dashboard/AppPageHeader";

export default function RecordPage() {
  // Add processingProgress and processingStage states
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  
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
    audioFileSize
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

  // Simulate processing (this would normally be connected to real processing events)
  const handleSave = () => {
    if (handleSaveRecording) {
      setProcessingProgress(0);
      setProcessingStage("Starting processing...");
      
      // Start a fake progress simulation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setProcessingProgress(progress);
        
        if (progress < 30) {
          setProcessingStage("Preparing audio...");
        } else if (progress < 60) {
          setProcessingStage("Processing audio...");
        } else if (progress < 90) {
          setProcessingStage("Finalizing...");
        } else {
          setProcessingStage("Completed");
          clearInterval(interval);
        }
        
        if (progress >= 100) {
          clearInterval(interval);
          handleSaveRecording();
        }
      }, 500);
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
              onSave={handleSave}
              isSaving={isSaving}
              isLoading={false}
              lastAction={lastAction}
              onRefreshDevices={handleWrappedRefreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState as any}
              processingProgress={processingProgress}
              processingStage={processingStage}
              audioFileSize={audioFileSize}
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
