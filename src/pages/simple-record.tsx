
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { useRecordingSave } from "@/components/record/useRecordingSave";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { useAuth } from "@/components/auth/AuthProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mic, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      // Get the current duration from the recording hook if available
      const currentDuration = recordingHook.getCurrentDuration ? recordingHook.getCurrentDuration() : 0;
      
      await saveRecording(
        recordingHook.isRecording,
        recordingHook.handleStopRecording,
        recordingHook.mediaStream,
        recordingHook.audioUrl,
        currentDuration // Use the current duration 
      );
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const handleUploadComplete = (noteId: string, recordingId: string) => {
    setCurrentUploadInfo({ noteId, recordingId });
  };

  const isDisabled = !session;
  
  // Create a wrapper for refreshDevices that returns Promise<void>
  const handleRefreshDevices = async (): Promise<void> => {
    if (recordingHook.refreshDevices) {
      try {
        await recordingHook.refreshDevices();
      } catch (error) {
        console.error("Error refreshing devices:", error);
      }
    }
  };

  // Handle toggling between audio and screen recording
  const handleToggleRecordingMode = () => {
    if (recordingHook.toggleRecordingMode) {
      recordingHook.toggleRecordingMode();
    }
  };

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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Record Content</h3>
              
              <div className="flex space-x-2">
                <Button
                  variant={recordingHook.recordingMode === 'audio' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => recordingHook.setRecordingMode('audio')}
                  disabled={recordingHook.isRecording || !!recordingHook.audioUrl}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Audio
                </Button>
                <Button
                  variant={recordingHook.recordingMode === 'screen' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => recordingHook.setRecordingMode('screen')}
                  disabled={recordingHook.isRecording || !!recordingHook.audioUrl}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Screen
                </Button>
              </div>
            </div>
            
            <RecordingSection
              isRecording={recordingHook.isRecording}
              isPaused={recordingHook.isPaused}
              audioUrl={recordingHook.audioUrl}
              mediaStream={recordingHook.mediaStream}
              isSystemAudio={recordingHook.isSystemAudio}
              recordingMode={recordingHook.recordingMode}
              handleStartRecording={recordingHook.handleStartRecording}
              handleStopRecording={recordingHook.handleStopRecording}
              handlePauseRecording={recordingHook.handlePauseRecording}
              handleResumeRecording={recordingHook.handleResumeRecording}
              handleDelete={recordingHook.handleDelete}
              onSystemAudioChange={recordingHook.setIsSystemAudio}
              onToggleRecordingMode={handleToggleRecordingMode}
              audioDevices={recordingHook.audioDevices}
              selectedDeviceId={recordingHook.selectedDeviceId}
              onDeviceSelect={recordingHook.setSelectedDeviceId}
              deviceSelectionReady={recordingHook.deviceSelectionReady}
              showPlayButton={true}
              onRefreshDevices={handleRefreshDevices}
              devicesLoading={recordingHook.devicesLoading}
              permissionState={recordingHook.permissionState || 'unknown'}
              isRestrictedRoute={false}
              lastAction={recordingHook.lastAction}
              disabled={isDisabled}
              isSaving={isProcessing}
              processingProgress={processingProgress}
              processingStage={processingStage}
              onSave={handleSave}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Already have a recording?</h3>
            <FileUploadSection 
              isDisabled={recordingHook.isRecording || !session}
              showDetailsPanel={true}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
