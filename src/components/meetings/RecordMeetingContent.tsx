
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Pause, PlayCircle, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRecording } from "@/hooks/useRecording";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { NoDevicesMessage } from "@/components/record/device/NoDevicesMessage";

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
  // Use the recording hook
  const recordingHook = useRecording();
  const [savingProgress, setSavingProgress] = useState(0);
  
  const handleSaveRecording = async () => {
    if (!recordingHook.audioUrl) {
      toast.error("Nenhuma gravação para salvar");
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
      
      // Create form data for the request
      const formData = new FormData();
      formData.append('file', blob, 'meeting-recording.webm');
      
      setSavingProgress(40);
      
      // Upload to Supabase Edge Function for processing
      toast.info("Enviando para transcrição...");
      const result = await supabase.functions.invoke('transcribe-meeting', {
        body: { 
          recordingData: {
            isSystemAudio: recordingHook.isSystemAudio,
            duration: recordingHook.getCurrentDuration() || 0
          }
        },
        file: blob
      });
      
      setSavingProgress(100);
      
      if (result.error) {
        throw new Error(result.error.message || "Erro ao transcrever áudio");
      }
      
      // Handle successful transcription
      if (result.data && result.data.transcription) {
        onUploadComplete(result.data.transcription);
      } else {
        throw new Error("Não foi possível obter a transcrição");
      }
      
    } catch (error) {
      console.error("[RecordMeetingContent] Error saving recording:", error);
      onError(error instanceof Error ? error.message : "Erro desconhecido ao salvar gravação");
      toast.error("Erro ao processar gravação", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
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
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Dispositivo de Áudio</h3>
                <select 
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={recordingHook.selectedDeviceId || ''}
                  onChange={(e) => recordingHook.setSelectedDeviceId(e.target.value)}
                  disabled={recordingHook.isRecording || !recordingHook.deviceSelectionReady}
                >
                  {recordingHook.audioDevices.length === 0 ? (
                    <option value="">Nenhum dispositivo encontrado</option>
                  ) : (
                    recordingHook.audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.displayName || device.label || `Microfone ${device.index + 1}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
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
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshDevices}
                  disabled={recordingHook.isRecording}
                  className="w-full"
                >
                  Atualizar dispositivos
                </Button>
              </div>
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
