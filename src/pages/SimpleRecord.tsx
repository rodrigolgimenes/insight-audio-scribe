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
import { Mic, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

const SimpleRecord = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processedContent, setProcessedContent] = useState<{ title: string; content: string; styleId: string } | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
  } = useRecording();

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Erro",
        description: "Formato de arquivo não suportado. Por favor, use arquivos de áudio (MP3, WAV, WebM) ou vídeo (MP4).",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(true);

      // Get audio duration
      const duration = await new Promise<number>((resolve) => {
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.onloadedmetadata = () => {
          URL.revokeObjectURL(audio.src);
          resolve(Math.round(audio.duration));
        };
      });

      // Get user data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create initial recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          user_id: user.id,
          title: file.name || `Recording ${new Date().toLocaleString()}`,
          file_path: 'pending',
          status: 'pending',
          duration: duration // Add duration here
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Upload file and process
      const formData = new FormData();
      formData.append('file', file);
      formData.append('recordingId', recordingData.id);
      formData.append('duration', duration.toString());

      const response = await supabase.functions.invoke('transcribe-upload', {
        body: formData,
      });

      if (response.error) {
        throw new Error(`Error processing file: ${response.error.message}`);
      }

      if (!response.data?.success) {
        throw new Error('Failed to process file');
      }

      toast({
        title: "Sucesso",
        description: "Arquivo processado com sucesso!",
      });

      // Navigate to the dashboard instead of note page
      navigate("/app");

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao processar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!styles || styles.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum estilo encontrado para processamento",
        variant: "destructive",
      });
      return;
    }

    try {
      // Stop the recording first if it's still active
      if (isRecording) {
        await handleStopRecording();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      console.log('Creating recording with user ID:', user.id);

      // Create initial recording entry
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: 0,
          file_path: 'temp-path',
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
        title: "Sucesso",
        description: "Gravação salva e processamento iniciado!",
      });
      
      // Navigate to the dashboard instead of notes-record page
      navigate("/app");
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar a gravação",
        variant: "destructive",
      });
    }
  };

  const handleTimeLimit = () => {
    handleStopRecording();
    toast({
      title: "Limite de Tempo",
      description: "Gravação interrompida após atingir o limite de 25 minutos.",
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
                    isSystemAudio={isSystemAudio}
                    handleStartRecording={handleStartRecording}
                    handleStopRecording={handleStopRecording}
                    handlePauseRecording={handlePauseRecording}
                    handleResumeRecording={handleResumeRecording}
                    handleDelete={handleDelete}
                    handleTimeLimit={handleTimeLimit}
                    setIsSystemAudio={setIsSystemAudio}
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      <Button 
                        className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Mic className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Criar nota'}
                      </Button>

                      <div className="relative">
                        <Input
                          type="file"
                          accept="audio/*,video/mp4"
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileUpload}
                          disabled={isUploading}
                        />
                        <Button 
                          className="bg-[#2196F3] hover:bg-[#1976D2] gap-2"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="w-4 h-4" />
                          {isUploading ? 'Enviando...' : 'Upload'}
                        </Button>
                      </div>
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
      {(isTranscribing || isSaving || isUploading || isProcessing) && <TranscriptionLoading />}
    </SidebarProvider>
  );
};

export default SimpleRecord;
