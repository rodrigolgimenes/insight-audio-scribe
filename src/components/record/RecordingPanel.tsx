
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { RecordingSection } from "./RecordingSection";
import { RecordTimer } from "./RecordTimer";
import { AudioVisualizer } from "./AudioVisualizer";

interface RecordingPanelProps {
  recordingHook: any;
  handleWrappedStopRecording: () => Promise<void>;
  handleWrappedRefreshDevices: () => Promise<void>;
  isSaveProcessing: boolean;
  saveRecording: () => Promise<any>;
}

export const RecordingPanel: React.FC<RecordingPanelProps> = ({
  recordingHook,
  handleWrappedStopRecording,
  handleWrappedRefreshDevices,
  isSaveProcessing,
  saveRecording
}) => {
  return (
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
          showPlayButton={false}
          lastAction={recordingHook.lastAction}
          onRefreshDevices={handleWrappedRefreshDevices}
          devicesLoading={recordingHook.devicesLoading}
          permissionState={recordingHook.permissionState}
          onSave={saveRecording}
          isLoading={isSaveProcessing}
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
  );
};
