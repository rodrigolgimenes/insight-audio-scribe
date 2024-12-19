import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AudioRecorder } from "@/utils/audioRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";

const Record = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const audioRecorder = useRef(new AudioRecorder());

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      await audioRecorder.current.startRecording();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "Could not start recording. Please check your microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save recordings.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { blob, duration } = await audioRecorder.current.stopRecording();
      setIsRecording(false);
      setIsPaused(false);
      setMediaStream(null);

      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      const fileName = `${session.user.id}/${Date.now()}.webm`;
      
      // Upload to storage bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, blob);

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload successful but file path is missing');
      }

      // Save to database
      const { error: dbError } = await supabase.from('recordings').insert({
        user_id: session.user.id,
        title: `Recording ${new Date().toLocaleString()}`,
        duration,
        file_path: fileName,
      });

      if (dbError) {
        // If database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('audio_recordings')
          .remove([fileName]);
        throw new Error(`Database error: ${dbError.message}`);
      }

      toast({
        title: "Success",
        description: "Recording saved successfully!",
      });
      
      // Navigate back to dashboard after successful save
      navigate("/app");
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: "Error",
        description: "Failed to save recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePauseRecording = () => {
    audioRecorder.current.pauseRecording();
    setIsPaused(true);
  };

  const handleResumeRecording = () => {
    audioRecorder.current.resumeRecording();
    setIsPaused(false);
  };

  const handleBack = () => navigate("/app");

  const handleDelete = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setMediaStream(null);
    setIsRecording(false);
    setIsPaused(false);
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
          {/* Header */}
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </button>
                <Button variant="outline" className="text-primary">
                  <span className="mr-2">↑</span>
                  Upload
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              {/* Recording Status */}
              <div className="mb-8">
                <span className="inline-flex items-center text-gray-600">
                  <span className={`w-2 h-2 rounded-full mr-2 ${isRecording && !isPaused ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  {isRecording ? (isPaused ? 'Paused' : 'Recording...') : 'Recording off'}
                </span>
              </div>

              {/* Waveform Visualization */}
              <div className="mb-8">
                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full max-w-md" />
                ) : (
                  <AudioVisualizer isRecording={isRecording && !isPaused} stream={mediaStream ?? undefined} />
                )}
              </div>

              {/* Timer */}
              <div className="mb-12">
                <RecordTimer 
                  isRecording={isRecording} 
                  isPaused={isPaused}
                  onTimeLimit={handleTimeLimit}
                />
              </div>

              {/* Controls */}
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

              {/* Settings and Create Note */}
              <div className="flex flex-col items-center gap-4">
                <Button variant="outline" className="gap-2 border-2 text-primary">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
                <Button 
                  className="bg-[#E91E63] hover:bg-[#D81B60] gap-2"
                  onClick={handleStopRecording}
                  disabled={!isRecording || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Create note'}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Record;