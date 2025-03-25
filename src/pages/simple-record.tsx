
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { useRecordingSave } from "@/components/record/useRecordingSave";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function SimpleRecord() {
  const { session } = useAuth();
  const [keepAudio, setKeepAudio] = useState(true);
  const [currentUploadInfo, setCurrentUploadInfo] = useState<{
    noteId: string;
    recordingId: string;
  } | null>(null);
  
  const recordingHook = useRecording();
  const {
    saveRecording,
    isProcessing,
    processingProgress,
    processingStage
  } = useRecordingSave();

  const handleSave = async () => {
    try {
      await saveRecording(
        recordingHook.isRecording,
        recordingHook.handleStopRecording,
        recordingHook.mediaStream,
        recordingHook.audioUrl,
        recordingHook.recordedDuration
      );
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const handleUploadComplete = (noteId: string, recordingId: string) => {
    setCurrentUploadInfo({ noteId, recordingId });
  };

  const isDisabled = !session;

  return (
    <div className="container py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Simple Recorder</h1>

      {isDisabled && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to be logged in to use this feature.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Record Audio</h3>
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
              audioDevices={recordingHook.audioDevices}
              selectedDeviceId={recordingHook.selectedDeviceId}
              onDeviceSelect={recordingHook.setSelectedDeviceId}
              deviceSelectionReady={recordingHook.deviceSelectionReady}
              showPlayButton={true}
              onRefreshDevices={recordingHook.refreshDevices}
              devicesLoading={recordingHook.devicesLoading}
              permissionState={recordingHook.permissionState}
              isRestrictedRoute={false}
              lastAction={recordingHook.lastAction}
              disabled={isDisabled}
            />

            <div className="mt-4">
              <RecordingActions
                onSave={handleSave}
                isSaving={isProcessing}
                isLoading={recordingHook.isLoading}
                isRecording={recordingHook.isRecording}
                hasRecording={!!recordingHook.audioUrl}
                processingProgress={processingProgress}
                processingStage={processingStage}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Already have a recording?</h3>
            {/* Substitui o FileUpload pelo FileUploadSection que já implementa corretamente os logs */}
            <FileUploadSection 
              isDisabled={recordingHook.isRecording || !session}
              showDetailsPanel={true} // Ativa a exibição do painel de logs de conversão
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
