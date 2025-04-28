import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useRecording } from "@/hooks/useRecording";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { DeviceControls } from "@/components/record/DeviceControls";
import { RecordingPanel } from "@/components/record/RecordingPanel";
import { UploadPanel } from "@/components/record/UploadPanel";
import { ProcessingPanel } from "@/components/record/ProcessingPanel";

const SimpleRecord = () => {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('SimpleRecord Component Mount', true);
  
  const navigate = useNavigate();
  const { session } = useAuth();
  const recordingHook = useRecording();

  const [isSaveProcessing, setIsSaveProcessing] = useState(false);
  const [showConversionLogs, setShowConversionLogs] = useState<boolean>(false);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [currentProcessingId, setCurrentProcessingId] = useState<string | null>(null);
  const [currentUploadInfo, setCurrentUploadInfo] = useState<{
    noteId: string;
    recordingId: string;
  } | null>(null);
  
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
        await recordingHook.refreshDevices();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return Promise.reject(error);
    }
  };

  const handleUploadComplete = (noteId: string, recordingId: string) => {
    setCurrentUploadInfo({ noteId, recordingId });
  };
  
  const handleConversionUpdate = (
    status: 'idle' | 'converting' | 'success' | 'error', 
    progress: number,
    origFile: File | null,
    convFile: File | null
  ) => {
    setConversionStatus(status);
    setConversionProgress(progress);
    setOriginalFile(origFile);
    setConvertedFile(convFile);
    setShowConversionLogs(true);
  };
  
  const handleDownloadConvertedFile = () => {
    if (convertedFile) {
      const url = URL.createObjectURL(convertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = convertedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const saveRecording = async () => {
    if (!session) {
      toast.error("You must be logged in to save recordings");
      return { success: false };
    }
    
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
      
      const fileName = `${user.id}/${Date.now()}.${getExtensionFromMimeType(recordingBlob.type)}`;
      
      console.log('Creating recording with user ID:', user.id);
      console.log('Recording duration in seconds:', recordedDuration);

      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordedDuration * 1000),
          file_path: fileName,
          user_id: user.id,
          status: 'pending',
          needs_compression: true,
          original_file_type: recordingBlob.type
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Failed to save recording: ${dbError.message}`);
      }
      
      setCurrentProcessingId(recordingData.id);

      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, recordingBlob, {
          contentType: recordingBlob.type,
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
          message: 'Original file uploaded successfully, pending compression and processing',
          status: 'success',
          details: {
            originalFormat: recordingBlob.type,
            originalSize: recordingBlob.size,
            pendingCompression: true
          }
        });

      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id, noteId: noteData.id },
        });

      if (processError) {
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      } else {
        toast.success("Recording saved, compression and processing will start soon!");
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

  PageLoadTracker.trackPhase('Render Main Content', true);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="recorder" />
        <div className="flex-1 bg-ghost-white">
          <main className="container mx-auto px-4 py-8 space-y-8">
            <DeviceControls session={session} />
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RecordingPanel 
                  recordingHook={recordingHook}
                  handleWrappedStopRecording={handleWrappedStopRecording}
                  handleWrappedRefreshDevices={handleWrappedRefreshDevices}
                  isSaveProcessing={isSaveProcessing}
                  saveRecording={saveRecording}
                />
                
                <div className="space-y-8">
                  <UploadPanel 
                    session={session}
                    isRecording={recordingHook.isRecording}
                    handleUploadComplete={handleUploadComplete}
                    handleConversionUpdate={handleConversionUpdate}
                    showConversionLogs={showConversionLogs}
                    conversionStatus={conversionStatus}
                    conversionProgress={conversionProgress}
                    originalFile={originalFile}
                    convertedFile={convertedFile}
                    handleDownloadConvertedFile={handleDownloadConvertedFile}
                  />
                  
                  <ProcessingPanel 
                    currentProcessingId={currentProcessingId}
                    currentUploadInfo={currentUploadInfo}
                  />
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

const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/aac': 'aac',
    'audio/flac': 'flac'
  };
  
  return mimeToExt[mimeType] || 'mp3';
};
