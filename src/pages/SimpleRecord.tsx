
import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useRecordingSave } from "@/components/record/useRecordingSave";

const SimpleRecord = () => {
  const { toast } = useToast();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading, isProcessing } = useFileUpload();
  const { saveRecording } = useRecordingSave();

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
    handleDelete,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording();
    toast({
      title: "Tempo Limite Atingido",
      description: "A gravação foi interrompida após atingir o limite de 25 minutos.",
    });
  };

  const isLoading = isTranscribing || isSaving || isUploading || isProcessing;

  const handleSave = () => {
    saveRecording(isRecording, handleStopRecording, mediaStream, audioUrl);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-white">
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
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
                    handleTimeLimit={handleTimeLimit}
                    onSystemAudioChange={setIsSystemAudio}
                    audioDevices={audioDevices}
                    selectedDeviceId={selectedDeviceId}
                    onDeviceSelect={setSelectedDeviceId}
                  />

                  <RecordingActions
                    onSave={handleSave}
                    isSaving={isSaving}
                    isLoading={isLoading}
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
          </main>
        </div>
      </div>
      {isLoading && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default SimpleRecord;
