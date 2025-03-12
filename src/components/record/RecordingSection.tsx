
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";
import { RecordStatus } from "@/components/record/RecordStatus";
import { RecordingOptions } from "@/components/record/RecordingOptions";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";
import { useEffect, useState } from "react";
import { DiagnosticsPanel } from "@/components/record/DiagnosticsPanel";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void | Promise<void>;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  deviceSelectionReady?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
}

export const RecordingSection = ({
  isRecording,
  isPaused,
  audioUrl,
  mediaStream,
  isSystemAudio,
  handleStartRecording,
  handleStopRecording,
  handlePauseRecording,
  handleResumeRecording,
  handleDelete,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  deviceSelectionReady = false,
  showPlayButton = true,
  showDeleteButton = true,
}: RecordingSectionProps) => {
  // A selected microphone is required to start recording
  const canStartRecording = !!selectedDeviceId && audioDevices.length > 0;
  const hasDevices = audioDevices.length > 0;
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add a log to the debug logs
  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };

  // Log state changes for debugging
  useEffect(() => {
    console.log('[RecordingSection] State updated:', {
      isRecording,
      isPaused,
      hasAudioUrl: !!audioUrl,
      hasStream: !!mediaStream,
      selectedDeviceId,
      deviceCount: audioDevices.length,
      canStartRecording,
      hasDevices,
      isSystemAudio
    });

    addLog(`Estado: recording=${isRecording}, paused=${isPaused}, deviceId=${selectedDeviceId?.substring(0, 8)}..., canStart=${canStartRecording}`);
    
    if (mediaStream) {
      const tracks = mediaStream.getAudioTracks();
      tracks.forEach((track, i) => {
        addLog(`Track ${i}: ${track.label.substring(0, 20)}... (enabled=${track.enabled}, muted=${track.muted}, state=${track.readyState})`);
      });
    }
  }, [isRecording, isPaused, audioUrl, mediaStream, selectedDeviceId, audioDevices.length, canStartRecording, hasDevices, isSystemAudio]);

  return (
    <>
      <RecordStatus isRecording={isRecording} isPaused={isPaused} />

      <div className="mb-8">
        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full" />
        ) : (
          <AudioVisualizer isRecording={isRecording && !isPaused} stream={mediaStream ?? undefined} />
        )}
      </div>

      <RecordingOptions
        isRecording={isRecording}
        isSystemAudio={isSystemAudio}
        onSystemAudioChange={onSystemAudioChange}
        audioDevices={audioDevices}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
      />

      <div className="mb-12">
        <RecordTimer 
          isRecording={isRecording} 
          isPaused={isPaused}
        />
      </div>

      <div className="mb-12">
        <RecordControls
          isRecording={isRecording}
          isPaused={isPaused}
          hasRecording={!!audioUrl}
          onStartRecording={() => {
            addLog("Botão de iniciar gravação clicado");
            handleStartRecording();
          }}
          onStopRecording={() => {
            addLog("Botão de parar gravação clicado");
            handleStopRecording();
          }}
          onPauseRecording={() => {
            addLog("Botão de pausar gravação clicado");
            handlePauseRecording();
          }}
          onResumeRecording={() => {
            addLog("Botão de continuar gravação clicado");
            handleResumeRecording();
          }}
          onDelete={() => {
            addLog("Botão de deletar gravação clicado");
            handleDelete();
          }}
          onPlay={() => {
            addLog("Botão de reproduzir gravação clicado");
            const audio = document.querySelector('audio');
            if (audio) audio.play();
          }}
          disabled={!canStartRecording}
          showPlayButton={showPlayButton}
          showDeleteButton={showDeleteButton}
        />
      </div>

      <DiagnosticsPanel 
        isVisible={diagnosticsVisible}
        onToggle={() => setDiagnosticsVisible(!diagnosticsVisible)}
        logs={debugLogs}
        recordingState={{
          isRecording,
          isPaused,
          hasAudioUrl: !!audioUrl,
          selectedDeviceId,
          deviceCount: audioDevices.length,
          deviceSelectionReady,
          canStartRecording,
          isSystemAudio,
          mediaStreamInfo: mediaStream ? {
            id: mediaStream.id,
            active: mediaStream.active,
            trackCount: mediaStream.getTracks().length,
            audioTrackCount: mediaStream.getAudioTracks().length
          } : null
        }}
      />
    </>
  );
};
