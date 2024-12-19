import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";
import { RecordHeader } from "@/components/record/RecordHeader";
import { RecordStatus } from "@/components/record/RecordStatus";
import { RecordActions } from "@/components/record/RecordActions";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";
import { useRecording } from "@/hooks/useRecording";

const Record = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    isSaving,
    isTranscribing,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
  } = useRecording();

  const handleTimeLimit = () => {
    handleStopRecording();
    toast({
      title: "Time Limit Reached",
      description: "Recording stopped after reaching the 25-minute limit.",
    });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-white">
          <RecordHeader onBack={() => navigate("/app")} />

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <RecordStatus isRecording={isRecording} isPaused={isPaused} />

              <div className="mb-8">
                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full max-w-md" />
                ) : (
                  <AudioVisualizer isRecording={isRecording && !isPaused} stream={mediaStream ?? undefined} />
                )}
              </div>

              <div className="mb-12">
                <RecordTimer 
                  isRecording={isRecording} 
                  isPaused={isPaused}
                  onTimeLimit={handleTimeLimit}
                />
              </div>

              <div className="mb-12">
                <RecordControls
                  isRecording={isRecording}
                  isPaused={isPaused}
                  hasRecording={!!audioUrl}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  onPauseRecording={handlePauseRecording}
                  onResumeRecording={handleResumeRecording}
                  onDelete={handleDelete}
                  onPlay={() => {
                    const audio = document.querySelector('audio');
                    if (audio) audio.play();
                  }}
                />
              </div>

              <RecordActions
                onSave={handleStopRecording}
                isSaving={isSaving}
                isRecording={isRecording}
              />
            </div>
          </main>
        </div>
      </div>
      {isTranscribing && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default Record;