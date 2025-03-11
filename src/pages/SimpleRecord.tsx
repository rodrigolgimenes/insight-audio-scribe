
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useRecordingSave } from "@/hooks/record/useRecordingSave";
import { SaveRecordingButton } from "@/components/record/SaveRecordingButton";

const SimpleRecord = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();

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
    handleSaveRecording,
    getCurrentDuration
  } = useRecording();

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been successfully activated. You can now start recording!",
        duration: 5000,
      });
    }
  }, [searchParams, toast]);

  const handleTimeLimit = () => {
    // Wrap the handleStopRecording in another function that ignores the return value
    handleStopRecording().then(() => {
      toast({
        title: "Time Limit Reached",
        description: "Recording was stopped after reaching the 25-minute limit.",
      });
    });
  };

  const handleSave = async () => {
    const recordedDuration = getCurrentDuration();
    await saveRecording(isRecording, async () => {
      await handleStopRecording();
    }, mediaStream, audioUrl, recordedDuration);
  };

  const isLoading = isTranscribing || isSaving || isUploading || isSaveProcessing;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1">
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
                    handleStopRecording={() => handleStopRecording().then(() => {})}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    handleTimeLimit={handleTimeLimit}
                    onSystemAudioChange={setIsSystemAudio}
                    audioDevices={audioDevices}
                    selectedDeviceId={selectedDeviceId}
                    onDeviceSelect={setSelectedDeviceId}
                  />

                  {audioUrl && (
                    <div className="mt-6 flex justify-center">
                      <SaveRecordingButton
                        onSave={handleSaveRecording}
                        isSaving={isSaving}
                        isDisabled={isTranscribing}
                      />
                    </div>
                  )}

                  <RecordingActions
                    onSave={handleSave}
                    isSaving={isLoading}
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
    </SidebarProvider>
  );
};

export default SimpleRecord;
