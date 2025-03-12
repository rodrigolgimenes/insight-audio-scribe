import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Pause, PlayCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRecording } from "@/hooks/useRecording";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { NoDevicesMessage } from "@/components/record/device/NoDevicesMessage";
import { TestDeviceSelector } from "./TestDeviceSelector";

interface RecordMeetingContentProps {
  isLoading: boolean;
  isUploading: boolean;
  onUploadStart: () => void;
  onUploadComplete: (transcription: string) => void;
  onError: (error: string) => void;
}

export function RecordMeetingContent({
  isLoading,
  isUploading,
  onUploadStart,
  onUploadComplete,
  onError
}: RecordMeetingContentProps) {
  const recordingHook = useRecording();
  const [savingProgress, setSavingProgress] = useState(0);
  
  const handleSaveRecording = async () => {
    if (!recordingHook.audioUrl) {
      toast.error("No recording to save");
      return;
    }
    
    try {
      onUploadStart();
      setSavingProgress(10);
      
      // If still recording, stop it first
      if (recordingHook.isRecording) {
        await recordingHook.handleStopRecording();
      }
      
      setSavingProgress(20);
      
      // Get the audio blob
      const response = await fetch(recordingHook.audioUrl);
      const blob = await response.blob();
      
      setSavingProgress(30);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      setSavingProgress(40);
      
      // Upload to Supabase Edge Function for processing
      toast.info("Sending for transcription...");
      const { data, error } = await supabase.functions.invoke('transcribe-meeting', {
        body: { 
          audioData: base64Data,
          recordingData: {
            isSystemAudio: recordingHook.isSystemAudio,
            duration: recordingHook.getCurrentDuration() || 0,
            mimeType: blob.type
          }
        }
      });
      
      setSavingProgress(100);
      
      if (error) {
        throw new Error(error.message || "Error transcribing audio");
      }
      
      // Handle successful transcription
      if (data && data.transcription) {
        onUploadComplete(data.transcription);
      } else {
        throw new Error("Could not get transcription");
      }
      
    } catch (error) {
      console.error("[RecordMeetingContent] Error saving recording:", error);
      onError(error instanceof Error ? error.message : "Unknown error saving recording");
      toast.error("Error processing recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setSavingProgress(0);
    }
  };
  
  const handleRefreshDevices = () => {
    if (recordingHook.refreshDevices) {
      recordingHook.refreshDevices();
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Gravação</h2>
            
            <AudioVisualizer 
              mediaStream={recordingHook.mediaStream}
              isRecording={recordingHook.isRecording}
              isPaused={recordingHook.isPaused}
            />
            
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {!recordingHook.isRecording ? (
                <Button 
                  onClick={recordingHook.handleStartRecording} 
                  className="bg-primary text-white hover:bg-primary/90"
                  disabled={isLoading || !recordingHook.deviceSelectionReady}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Iniciar Gravação
                </Button>
              ) : (
                <>
                  {!recordingHook.isPaused ? (
                    <Button 
                      onClick={recordingHook.handlePauseRecording}
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                  ) : (
                    <Button 
                      onClick={recordingHook.handleResumeRecording}
                      variant="outline"
                      disabled={isLoading}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                  )}
                  
                  <Button 
                    onClick={recordingHook.handleStopRecording}
                    variant="destructive"
                    disabled={isLoading}
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Parar
                  </Button>
                </>
              )}
            </div>
            
            <div className="mt-6">
              <Button
                onClick={handleSaveRecording}
                disabled={isLoading || !recordingHook.audioUrl || isUploading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando ({savingProgress}%)
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar e Transcrever
                  </>
                )}
              </Button>
            </div>
            
            <NoDevicesMessage 
              showWarning={recordingHook.audioDevices.length === 0 && recordingHook.deviceSelectionReady}
              onRefresh={handleRefreshDevices}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Controles e Configurações</h2>
            
            <TestDeviceSelector 
              audioDevices={recordingHook.audioDevices}
              selectedDeviceId={recordingHook.selectedDeviceId}
              onDeviceSelect={recordingHook.setSelectedDeviceId}
              onRefreshDevices={recordingHook.refreshDevices}
              isLoading={recordingHook.devicesLoading}
            />
            
            <div className="flex items-center mt-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 mr-2 rounded border-gray-300"
                  checked={recordingHook.isSystemAudio}
                  onChange={(e) => recordingHook.setIsSystemAudio(e.target.checked)}
                  disabled={recordingHook.isRecording}
                />
                <span className="text-sm">Capturar áudio do sistema (compartilhamento de tela)</span>
              </label>
            </div>
            
            {recordingHook.audioUrl && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Pré-visualização</h3>
                <audio 
                  src={recordingHook.audioUrl} 
                  controls 
                  className="w-full" 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
