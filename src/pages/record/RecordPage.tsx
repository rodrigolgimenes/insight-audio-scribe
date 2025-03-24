
import { useState, useEffect } from "react";
import { useRecording } from "@/hooks/useRecording";
import { PageLayout } from "@/components/layouts/PageLayout";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { audioCompressor } from "@/utils/audio/processing/AudioCompressor";
import { SimpleRecordContent } from "@/components/record/SimpleRecordContent";
import { PageLoadTracker } from "@/utils/debug/pageLoadTracker";

// Helper type to make TypeScript happy
type LastActionType = string | { 
  action: string; 
  timestamp: number; 
  success: boolean; 
  error?: string 
};

export default function RecordPage() {
  PageLoadTracker.init();
  PageLoadTracker.trackPhase('RecordPage Component Mount', true);
  
  const recordingHook = useRecording();
  const { toast: legacyToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSaveProcessing, setIsSaveProcessing] = useState(false);
  const navigate = useNavigate();
  
  // Force permission state to be granted and ensure we have a device on simple-record page
  useEffect(() => {
    console.log("[RecordPage] Force setting device selection ready on simple-record page");
    if (recordingHook.setDeviceSelectionReady) {
      recordingHook.setDeviceSelectionReady(true);
    }
  }, []);
  
  useEffect(() => {
    console.log("[RecordPage] Rendering with hook state:", {
      audioDevicesCount: recordingHook.audioDevices?.length || 0,
      selectedDeviceId: recordingHook.selectedDeviceId,
      deviceSelectionReady: recordingHook.deviceSelectionReady,
      permissionState: recordingHook.permissionState,
      path: window.location.pathname
    });
  }, [
    recordingHook.audioDevices,
    recordingHook.selectedDeviceId,
    recordingHook.deviceSelectionReady,
    recordingHook.permissionState
  ]);
  
  useEffect(() => {
    // Always set a default device if none exists
    if ((!recordingHook.selectedDeviceId || (!recordingHook.audioDevices || recordingHook.audioDevices.length === 0))) {
      console.log("[RecordPage] Setting default suppressed device");
      recordingHook.setSelectedDeviceId("default-suppressed-device");
    }
  }, [recordingHook.audioDevices, recordingHook.selectedDeviceId, recordingHook.setSelectedDeviceId]);
  
  // Fix return type for handleStopRecording
  const handleWrappedStopRecording = async (): Promise<void> => {
    try {
      await recordingHook.handleStopRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };
  
  // Fix return type for refreshDevices
  const handleWrappedRefreshDevices = async (): Promise<void> => {
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
  
  const saveRecording = async (): Promise<{ success: boolean }> => {
    console.log("[RecordPage] Save recording button clicked");
    
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
      
      console.log("Preparing to compress audio...", {
        originalFormat: recordingBlob.type,
        originalSize: Math.round(recordingBlob.size / 1024 / 1024 * 100) / 100 + " MB"
      });
      
      toast.info("Compressing audio...");
      
      const compressedBlob = await audioCompressor.compressAudio(recordingBlob, {
        targetBitrate: 32, // 32kbps for high compression
        mono: true, // Convert to mono
        targetSampleRate: 16000 // 16kHz sample rate
      });
      
      const compressionRatio = Math.round((1 - compressedBlob.size / recordingBlob.size) * 100);
      console.log("Audio compression complete", {
        compressedFormat: compressedBlob.type,
        compressedSize: Math.round(compressedBlob.size / 1024 / 1024 * 100) / 100 + " MB",
        compressionRatio: compressionRatio + "%"
      });
      
      const fileName = `${user.id}/${Date.now()}.mp3`;
      
      console.log("Creating recording in database...");
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
      
      console.log("Uploading audio file...");
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, compressedBlob, {
          contentType: 'audio/mp3',
          upsert: true
        });
      
      if (uploadError) {
        // Clean up the recording entry if upload fails
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      console.log("Creating note for the recording...");
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
      
      console.log("Adding initial processing log...");
      await supabase
        .from('processing_logs')
        .insert({
          recording_id: recordingData.id,
          note_id: noteData.id,
          stage: 'upload_complete',
          message: 'File uploaded successfully, starting processing',
          status: 'success'
        });
      
      console.log("Invoking serverless function to process recording...");
      const { error: processError } = await supabase.functions
        .invoke('process-recording', {
          body: { recordingId: recordingData.id, noteId: noteData.id },
        });
      
      if (processError) {
        console.warn("Error invoking process-recording function:", processError);
        toast.warning("Recording saved but processing failed to start. It will retry automatically.");
      } else {
        toast.success("Recording saved and processing started!");
      }
      
      console.log("Redirecting to dashboard...");
      navigate("/app");
      return { success: true };
    } catch (error) {
      console.error("Error saving recording:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
      return { success: false };
    } finally {
      setIsSaveProcessing(false);
    }
  };
  
  PageLoadTracker.trackPhase('Render Main Content', true);
  
  return (
    <PageLayout>
      <SimpleRecordContent
        recordingHook={{
          ...recordingHook,
          handleStopRecording: handleWrappedStopRecording,
          refreshDevices: handleWrappedRefreshDevices,
          deviceSelectionReady: true, // Force to true
          permissionState: 'granted', // Force to granted
          // Ensure we never send empty devices array
          audioDevices: recordingHook.audioDevices?.length ? recordingHook.audioDevices : [{
            deviceId: "default-suppressed-device",
            groupId: "default-group",
            label: "Default Microphone",
            kind: "audioinput",
            isDefault: true,
            index: 0
          }],
          // Ensure we always have a selectedDeviceId
          selectedDeviceId: recordingHook.selectedDeviceId || "default-suppressed-device",
          // Fix the lastAction type
          lastAction: recordingHook.lastAction as LastActionType
        }}
        isLoading={isSaveProcessing}
        error={error}
        saveRecording={saveRecording}
        isSaveProcessing={isSaveProcessing}
      />
    </PageLayout>
  );
}
