
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
    isLoading,
    lastAction,
    refreshDevices,
    devicesLoading,
    permissionState,
    processingProgress,
    processingStage
  } = useRecording();

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
              handleStopRecording={handleStopRecording}
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
              onRefreshDevices={refreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState}
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
