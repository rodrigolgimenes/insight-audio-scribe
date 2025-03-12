
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { RecordingActions } from "@/components/record/RecordingActions";
import { RecordActions } from "@/components/record/RecordActions";
import { useFileUpload } from "@/hooks"; 
import { useRecordingSave } from "@/hooks/record/useRecordingSave";

const SimpleRecord = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading } = useFileUpload();
  const { saveRecording, isProcessing: isSaveProcessing } = useRecordingSave();
  const [keepAudio, setKeepAudio] = useState(true);

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
    handleStopRecording().then(() => {
      toast({
        title: "Time Limit Reached",
        description: "Recording was stopped after reaching the 60-minute limit.",
      });
    });
  };

  const handleSave = async () => {
    if (isRecording) {
      const { blob, duration } = await handleStopRecording();
      if (!blob) {
        toast({
          title: "Error",
          description: "Failed to get recording data.",
          variant: "destructive",
        });
        return;
      }
    }
    
    await saveRecording(isRecording, async () => {
      const result = await handleStopRecording();
      return;
    }, mediaStream, audioUrl, getCurrentDuration());
  };

  const isLoading = isTranscribing || isSaving || isUploading || isSaveProcessing;
  const hasRecording = !!audioUrl;

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
                    showPlayButton={false}
                    showDeleteButton={true}
                  />

                  <div className="mt-8 flex justify-center">
                    <RecordActions
                      onSave={handleSave}
                      isSaving={isLoading}
                      isRecording={isRecording}
                      keepAudio={keepAudio}
                      onKeepAudioChange={setKeepAudio}
                    />
                  </div>

                  <RecordingActions
                    onSave={handleSave}
                    isSaving={isLoading}
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
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SimpleRecord;
