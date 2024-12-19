import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { RecordHeader } from "@/components/record/RecordHeader";
import { RecordActions } from "@/components/record/RecordActions";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";
import { StyleSelector } from "@/components/record/StyleSelector";
import { useRecording } from "@/hooks/useRecording";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";

const Record = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [keepAudio, setKeepAudio] = useState(true);
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string; styleId: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
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

  // Fetch styles and set default style
  const { data: styles } = useQuery({
    queryKey: ['styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Set the first style as default if no style is selected and styles exist
      if (!selectedStyleId && data && data.length > 0) {
        setSelectedStyleId(data[0].id);
      }
    }
  });

  const processMutation = useMutation({
    mutationFn: async ({ styleId, transcript }: { styleId: string; transcript: string }) => {
      console.log('Processing with style:', styleId);
      console.log('Transcript:', transcript);
      
      const response = await supabase.functions.invoke('process-with-style', {
        body: { styleId, transcript },
      });
      
      if (response.error) {
        console.error('Process mutation error:', response.error);
        throw response.error;
      }
      
      console.log('Processed response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Setting processed content:', data);
      setProcessedContent(data);
    },
    onError: (error) => {
      console.error('Process mutation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process transcript",
        variant: "destructive",
      });
    },
  });

  const handleTimeLimit = () => {
    handleStopRecording();
    toast({
      title: "Time Limit Reached",
      description: "Recording stopped after reaching the 25-minute limit.",
    });
  };

  const handleStyleSelect = async (styleId: string) => {
    console.log('Style selected:', styleId);
    setSelectedStyleId(styleId);
    if (transcript) {
      processMutation.mutate({ styleId, transcript });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-white">
          <RecordHeader onBack={() => navigate("/app")} />

          <main className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
              {!processedContent ? (
                <>
                  <RecordingSection
                    isRecording={isRecording}
                    isPaused={isPaused}
                    audioUrl={audioUrl}
                    mediaStream={mediaStream}
                    handleStartRecording={handleStartRecording}
                    handleStopRecording={handleStopRecording}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    handleTimeLimit={handleTimeLimit}
                  />

                  <RecordActions
                    onSave={handleStopRecording}
                    isSaving={isSaving}
                    isRecording={isRecording}
                    styles={styles || []}
                    selectedStyleId={selectedStyleId}
                    onStyleSelect={handleStyleSelect}
                    keepAudio={keepAudio}
                    onKeepAudioChange={setKeepAudio}
                  />
                </>
              ) : (
                <ProcessedContentSection
                  processedContent={processedContent}
                  transcript={transcript}
                  processMutation={processMutation}
                />
              )}
            </div>
          </main>
        </div>
      </div>
      {(isTranscribing || processMutation.isPending) && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default Record;