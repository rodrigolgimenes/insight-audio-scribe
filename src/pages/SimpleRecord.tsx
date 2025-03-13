import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useRecording } from "@/hooks/useRecording";
import { useFileUpload } from "@/hooks";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { RecordPageError } from "@/components/record/RecordPageError";
import { SimpleRecordContent } from "@/components/record/SimpleRecordContent";
import { toast } from "sonner";
import { RecordingSection } from "@/components/record/RecordingSection";
import { ProcessedContentSection } from "@/components/record/ProcessedContentSection";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { RecordTimer } from "@/components/record/RecordTimer";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const navigate = useNavigate();
  const { toast: legacyToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSaveProcessing, setIsSaveProcessing] = useState(false);
  const { isUploading } = useFileUpload();

  const recordingHook = useRecording();
  
  // Create a wrapper for stopRecording that returns a Promise
  const handleWrappedStopRecording = async () => {
    try {
      await recordingHook.handleStopRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };
  
  // Create a wrapper for refreshDevices that returns a Promise
  const handleWrappedRefreshDevices = async () => {
    try {
      if (recordingHook.refreshDevices) {
        const result = await recordingHook.refreshDevices();
        return Promise.resolve();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return Promise.reject(error);
    }
  };
  
  useEffect(() => {
    console.log("[SimpleRecord RENDER] Recording hook states:", {
      compName: 'SimpleRecord',
      deviceCount: recordingHook.audioDevices.length,
      selectedDeviceId: recordingHook.selectedDeviceId,
      deviceSelectionReady: recordingHook.deviceSelectionReady,
      permissionState: recordingHook.permissionState,
      devicesLoading: recordingHook.devicesLoading
    });
  }, [
    recordingHook.audioDevices, 
    recordingHook.selectedDeviceId, 
    recordingHook.deviceSelectionReady,
    recordingHook.permissionState,
    recordingHook.devicesLoading
  ]);

  useEffect(() => {
    if (
      recordingHook.audioDevices.length > 0 && 
      (!recordingHook.selectedDeviceId || 
        !recordingHook.audioDevices.some(d => d.deviceId === recordingHook.selectedDeviceId))
    ) {
      console.log("[SimpleRecord] Auto-selecting first device:", recordingHook.audioDevices[0].deviceId);
      recordingHook.setSelectedDeviceId(recordingHook.audioDevices[0].deviceId);
    }
  }, [recordingHook.audioDevices, recordingHook.selectedDeviceId, recordingHook.setSelectedDeviceId]);

  useEffect(() => {
    if (recordingHook.initError) {
      PageLoadTracker.trackPhase('Initialization Error Detected', false, recordingHook.initError.message);
      setError(recordingHook.initError.message);
      toast.error("Recording initialization failed", {
        description: recordingHook.initError.message
      });
    } else {
      setError(null);
    }
  }, [recordingHook.initError]);

  // Handler to save the recording to the database and process it
  const saveRecording = async () => {
    if (!recordingHook.audioUrl) {
      toast.error("No recording to save");
      return { success: false };
    }

    setIsSaveProcessing(true);
    try {
      // Get user information
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save recordings");
        return { success: false };
      }

      // Get recording duration and blob
      let recordingBlob: Blob | null = null;
      let recordedDuration = 0;

      // If we're still recording, stop it first
      if (recordingHook.isRecording) {
        const result = await recordingHook.handleStopRecording();
        if (result && 'blob' in result) {
          recordingBlob = result.blob;
          recordedDuration = result.duration || 0;
        }
      } else {
        // Get the blob from the audioUrl
        const response = await fetch(recordingHook.audioUrl);
        recordingBlob = await response.blob();
        recordedDuration = recordingHook.getCurrentDuration ? recordingHook.getCurrentDuration() : 0;
      }

      if (!recordingBlob) {
        throw new Error("Failed to get recording data");
      }
      
      console.log('Original recording format:', recordingBlob.type, 'Size:', Math.round(recordingBlob.size / 1024 / 1024 * 100) / 100, 'MB');
      
      // Convert to MP3 before upload
      toast.info("Compressing audio...");
      const compressedBlob = await audioCompressor.compressAudio(recordingBlob);
      console.log('Compressed to MP3:', compressedBlob.type, 'Size:', Math.round(compressedBlob.size / 1024 / 1024 * 100) / 100, 'MB');

      // Generate a unique filename WITH MP3 EXTENSION
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      console.log('Creating recording with user ID:', user.id);
      console.log('Recording duration in seconds:', recordedDuration);

      // Create the recording entry in the database
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordedDuration * 1000), // Convert to milliseconds
          file_path: fileName,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }

      // Upload the audio file - EXPLICITLY set contentType to MP3
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, compressedBlob, {
          contentType: 'audio/mp3',
          upsert: true
        });

      if (uploadError) {
        // Clean up on failure
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      // Create a note for the recording
      const { error: noteError } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(recordedDuration * 1000)
        });

      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      // Start the processing via the edge function
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id },
        });

      if (processError) {
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      } else {
        toast.success("Recording saved and processing started!");
      }

      // Navigate to the dashboard
      navigate("/app");
      return { success: true };
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
      return { success: false };
    } finally {
      setIsSaveProcessing(false);
    }
  };

  PageLoadTracker.trackPhase('Render Main Content', true);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8 space-y-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <RecordingSection
                      isRecording={recordingHook.isRecording}
                      isPaused={recordingHook.isPaused}
                      audioUrl={recordingHook.audioUrl}
                      mediaStream={recordingHook.mediaStream}
                      isSystemAudio={recordingHook.isSystemAudio}
                      handleStartRecording={recordingHook.handleStartRecording}
                      handleStopRecording={handleWrappedStopRecording}
                      handlePauseRecording={recordingHook.handlePauseRecording}
                      handleResumeRecording={recordingHook.handleResumeRecording}
                      handleDelete={recordingHook.handleDelete}
                      onSystemAudioChange={recordingHook.setIsSystemAudio}
                      audioDevices={recordingHook.audioDevices}
                      selectedDeviceId={recordingHook.selectedDeviceId}
                      onDeviceSelect={recordingHook.setSelectedDeviceId}
                      deviceSelectionReady={recordingHook.deviceSelectionReady}
                      lastAction={recordingHook.lastAction}
                      onRefreshDevices={handleWrappedRefreshDevices}
                      devicesLoading={recordingHook.devicesLoading}
                      permissionState={recordingHook.permissionState as any}
                    />
                    
                    {recordingHook.isRecording && (
                      <div className="mt-6">
                        <RecordTimer 
                          isRecording={recordingHook.isRecording} 
                          isPaused={recordingHook.isPaused} 
                        />
                        <div className="mt-4">
                          <AudioVisualizer 
                            mediaStream={recordingHook.mediaStream} 
                            isRecording={recordingHook.isRecording} 
                            isPaused={recordingHook.isPaused}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="space-y-8">
                  <ProcessedContentSection
                    audioUrl={recordingHook.audioUrl}
                    isRecording={recordingHook.isRecording}
                    isLoading={isUploading || isSaveProcessing}
                  />
                  
                  <FileUploadSection />
                </div>
              </div>
              
              {recordingHook.audioUrl && !recordingHook.isRecording && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={saveRecording}
                    disabled={isSaveProcessing}
                    className="bg-palatinate-blue hover:bg-palatinate-blue/90 active:bg-palatinate-blue/80 text-white px-6 py-3 rounded-md font-medium flex items-center gap-2"
                  >
                    {isSaveProcessing ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                          <polyline points="17 21 17 13 7 13 7 21"></polyline>
                          <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        <span>Save & Transcribe</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SimpleRecord;
