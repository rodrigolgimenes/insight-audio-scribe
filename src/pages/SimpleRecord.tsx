
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionLoading } from "@/components/record/TranscriptionLoading";
import { useRecording } from "@/hooks/useRecording";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { useFileUpload } from "@/hooks/useFileUpload";

const SimpleRecord = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const { isUploading, isProcessing } = useFileUpload();

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

  const isLoading = isTranscribing || isSaving || isUploading || isProcessing;

  const handleSave = async () => {
    try {
      // Stop the recording first if it's still active
      if (isRecording) {
        await handleStopRecording();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Generate a unique filename
      const fileName = `${user.id}/${Date.now()}.webm`;
      
      console.log('Creating recording with user ID:', user.id);

      // Create initial recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: 0,
          file_path: fileName,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      console.log('Recording saved:', recordingData);

      // Upload the audio file
      if (audioUrl) {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('audio_recordings')
          .upload(fileName, blob, {
            contentType: 'audio/webm',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload audio: ${uploadError.message}`);
        }

        // Update the recording with the correct file path
        const { error: updateError } = await supabase
          .from('recordings')
          .update({
            file_path: fileName,
            status: 'uploaded'
          })
          .eq('id', recordingData.id);

        if (updateError) {
          throw new Error(`Failed to update recording: ${updateError.message}`);
        }
      }

      // Process the recording
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id },
        });

      if (processError) {
        console.error('Processing error:', processError);
        throw new Error(`Processing failed: ${processError.message}`);
      }

      console.log('Processing initiated');

      toast({
        title: "Success",
        description: "Recording saved and processing initiated!",
      });
      
      navigate("/app");
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error saving recording",
        variant: "destructive",
      });
    }
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
                    handleStartRecording={handleStartRecording}
                    handleStopRecording={handleStopRecording}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    handleTimeLimit={handleTimeLimit}
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      <Button 
                        className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
                        onClick={handleSave}
                        disabled={isLoading}
                      >
                        <Mic className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Create Note'}
                      </Button>

                      <FileUploadSection isDisabled={isLoading} />
                    </div>
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
      {isLoading && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default SimpleRecord;
