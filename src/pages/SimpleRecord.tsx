
import { useState, useEffect, useCallback } from "react";
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
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { FileUploadSection } from "@/components/record/FileUploadSection";
import { RecordTimer } from "@/components/record/RecordTimer";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { ProcessingLogs } from "@/components/record/ProcessingLogs";
import { NoDevicesMessage } from "@/components/record/device/NoDevicesMessage";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const navigate = useNavigate();
  const { toast: legacyToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSaveProcessing, setIsSaveProcessing] = useState(false);
  const { isUploading } = useFileUpload();

  const recordingHook = useRecording();
  
  const handleWrappedStopRecording = async () => {
    try {
      await recordingHook.handleStopRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };
  
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

  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);

  const saveRecording = async () => {
    if (!recordingHook.audioUrl) {
      toast.error("No recording to save");
      return { success: false };
    }

    setIsSaveProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save recordings");
        return { success: false };
      }

      let recordingBlob: Blob | null = null;
      let recordedDuration = 0;

      if (recordingHook.isRecording) {
        const result = await recordingHook.handleStopRecording();
        if (result && 'blob' in result) {
          recordingBlob = result.blob;
          recordedDuration = result.duration || 0;
        }
      } else {
        const response = await fetch(recordingHook.audioUrl);
        recordingBlob = await response.blob();
        recordedDuration = recordingHook.getCurrentDuration ? recordingHook.getCurrentDuration() : 0;
      }

      if (!recordingBlob) {
        throw new Error("Failed to get recording data");
      }
      
      console.log('Original recording format:', recordingBlob.type, 'Size:', Math.round(recordingBlob.size / 1024 / 1024 * 100) / 100, 'MB');
      
      toast.info("Compressing audio...");
      const compressedBlob = await audioCompressor.compressAudio(recordingBlob, {
        targetBitrate: 32,      // 32kbps for high compression
        mono: true,             // Convert to mono
        targetSampleRate: 16000 // 16kHz sample rate
      });
      
      console.log('Compressed to MP3:', compressedBlob.type, 
                  'Size:', Math.round(compressedBlob.size / 1024 / 1024 * 100) / 100, 'MB',
                  'Compression ratio:', Math.round((1 - compressedBlob.size / recordingBlob.size) * 100) + '%');

      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      console.log('Creating recording with user ID:', user.id);
      console.log('Recording duration in seconds:', recordedDuration);

      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordedDuration * 1000),
          file_path: fileName,
          user_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }
      
      setCurrentProcessingId(recordingData.id);

      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, compressedBlob, {
          contentType: 'audio/mp3',
          upsert: true
        });

      if (uploadError) {
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(recordedDuration * 1000)
        })
        .select()
        .single();

      if (noteError) {
        throw new Error(`Failed to create note: ${noteError.message}`);
      }

      await supabase
        .from('processing_logs')
        .insert({
          recording_id: recordingData.id,
          note_id: noteData.id,
          stage: 'upload_complete',
          message: 'File uploaded successfully, starting processing',
          status: 'success'
        });

      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id, noteId: noteData.id },
        });

      if (processError) {
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      } else {
        toast.success("Recording saved and processing started!");
      }

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
                      showPlayButton={false}
                      onSave={saveRecording}
                      isLoading={isSaveProcessing}
                      // Passar false para showNoDevicesWarning impede que a mensagem seja exibida
                      showNoDevicesWarning={false}
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
                  <FileUploadSection 
                    isDisabled={isUploading || isSaveProcessing} 
                    showDetailsPanel={true}
                  />
                  
                  {currentProcessingId && (
                    <ProcessingLogs recordingId={currentProcessingId} />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SimpleRecord;
