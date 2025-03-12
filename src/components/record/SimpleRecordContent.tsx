
import { useState } from "react";
import { RecordingSection } from "./RecordingSection";
import { RecordingActions } from "./RecordingActions";
import { ProcessedContentSection } from "./ProcessedContentSection";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SimpleRecordContentProps {
  recordingHook: any;
  isLoading: boolean;
  error: string | null;
  saveRecording: () => Promise<void>;
  isSaveProcessing: boolean;
}

export function SimpleRecordContent({
  recordingHook,
  isLoading,
  error,
  saveRecording,
  isSaveProcessing
}: SimpleRecordContentProps) {
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);

  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    isSystemAudio,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady,
    lastAction
  } = recordingHook;

  const hasRecording = !!audioUrl;

  return (
    <div className="max-w-3xl mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error initializing recording: {error}
          </AlertDescription>
        </Alert>
      )}
      
      {!processedContent ? (
        <>
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
            audioDevices={audioDevices || []}
            selectedDeviceId={selectedDeviceId}
            onDeviceSelect={setSelectedDeviceId}
            deviceSelectionReady={deviceSelectionReady}
            showPlayButton={false}
            showDeleteButton={true}
            lastAction={lastAction}
          />

          <RecordingActions
            onSave={saveRecording}
            isSaving={isSaveProcessing}
            isLoading={isLoading}
            isRecording={isRecording}
            hasRecording={hasRecording}
          />
        </>
      ) : (
        <ProcessedContentSection
          processedContent={processedContent}
          transcript={transcript}
          processMutation={{
            isPending: false,
            mutate: () => {},
          }}
        />
      )}
    </div>
  );
}
