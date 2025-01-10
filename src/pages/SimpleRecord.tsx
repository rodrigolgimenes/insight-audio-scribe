import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { RecordHeader } from "@/components/record/RecordHeader";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";
import { useRecording } from "@/hooks/useRecording";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

const SimpleRecord = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // Fetch default style for processing
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
  });

  const handleSave = async () => {
    if (!styles || styles.length === 0) {
      toast({
        title: "Error",
        description: "No default style found for processing",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.id) {
        // For development, use a default user ID
        const defaultUserId = '00000000-0000-0000-0000-000000000000';
        console.warn('No authenticated user found, using default user ID:', defaultUserId);
        
        const { error: dbError, data: recordingData } = await supabase
          .from('recordings')
          .insert({
            title: `Recording ${new Date().toLocaleString()}`,
            duration: 0,
            file_path: 'temp-path',
            user_id: defaultUserId,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`Failed to save recording: ${dbError.message}`);
        }

        // Process transcription with GPT
        const { error: processError, data: processData } = await supabase.functions
          .invoke('process-with-style', {
            body: { 
              transcript: "Sample transcript for testing",
              styleId: styles[0].id 
            },
          });

        if (processError) {
          throw new Error(`Processing failed: ${processError.message}`);
        }

        toast({
          title: "Success",
          description: "Recording saved and processed successfully!",
        });
        
        navigate(`/app/notes-record/${recordingData.id}`);
      }
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save recording",
        variant: "destructive",
      });
    }
  };

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

                  <div className="flex flex-col items-center gap-4">
                    <Button 
                      className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
                      onClick={handleSave}
                      disabled={!isRecording || isSaving}
                    >
                      <Mic className="w-4 h-4" />
                      {isSaving ? 'Saving...' : 'Create note'}
                    </Button>
                  </div>
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
      {(isTranscribing || isSaving) && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default SimpleRecord;