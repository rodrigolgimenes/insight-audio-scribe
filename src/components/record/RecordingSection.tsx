
import { useState } from "react";
import { AudioVisualizer } from "@/components/record/AudioVisualizer";
import { RecordTimer } from "@/components/record/RecordTimer";
import { RecordControls } from "@/components/record/RecordControls";
import { RecordStatus } from "@/components/record/RecordStatus";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";

interface RecordingSectionProps {
  isRecording: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  isSystemAudio: boolean;
  handleStartRecording: () => void;
  handleStopRecording: () => void;
  handlePauseRecording: () => void;
  handleResumeRecording: () => void;
  handleDelete: () => void;
  handleTimeLimit: () => void;
  onSystemAudioChange: (enabled: boolean) => void;
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
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
  handleTimeLimit,
  onSystemAudioChange,
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  showPlayButton = true,
  showDeleteButton = true,
}: RecordingSectionProps) => {
  const canStartRecording = !!selectedDeviceId;

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

      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="audio-device" className="text-sm text-gray-700">
              Select Microphone *
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Please select a microphone before starting the recording.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={selectedDeviceId || undefined}
            onValueChange={onDeviceSelect}
            disabled={isRecording}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="system-audio" className="text-sm text-gray-700">
              If you are using a headset, enable this option
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Enable this option if you're using a headset to capture system audio (like meeting audio).
                    You'll need to grant additional permission when prompted.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            id="system-audio"
            checked={isSystemAudio}
            onCheckedChange={onSystemAudioChange}
            disabled={isRecording}
          />
        </div>
      </div>

      <div className="mb-12">
        <RecordTimer 
          isRecording={isRecording} 
          isPaused={isPaused}
          onTimeLimit={handleTimeLimit}
        />
      </div>

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
          disabled={!canStartRecording}
          showPlayButton={showPlayButton}
          showDeleteButton={showDeleteButton}
        />
      </div>
    </>
  );
};
