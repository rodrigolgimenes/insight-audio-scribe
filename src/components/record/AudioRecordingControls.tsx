
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Save } from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import { formatDuration } from '@/utils/formatters';

interface AudioRecordingControlsProps {
  status: string;
  audioUrl: string | null;
  duration: number;
  recordingTime: number;
  selectedDeviceId: string | null;
  handleRecordClick: () => void;
  handleTranscribe: () => void;
}

export const AudioRecordingControls: React.FC<AudioRecordingControlsProps> = ({
  status,
  audioUrl,
  duration,
  recordingTime,
  selectedDeviceId,
  handleRecordClick,
  handleTranscribe
}) => {
  return (
    <div className="space-y-4">
      {/* Recording time display */}
      {status === 'recording' && (
        <div className="text-center">
          <div className="text-4xl font-mono font-bold">
            {formatDuration(recordingTime)}
          </div>
          <div className="text-sm text-gray-500">Recording in progress</div>
        </div>
      )}
      
      {/* Record button */}
      <div className="flex justify-center">
        {status !== 'recording' ? (
          <div className="space-y-4 w-full">
            {/* Record button */}
            <Button
              onClick={handleRecordClick}
              disabled={!selectedDeviceId}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-6"
            >
              <Mic className="mr-2 h-5 w-5" />
              {audioUrl ? "Record again" : "Start recording"}
            </Button>
            
            {/* Audio player and transcribe button */}
            {audioUrl && (
              <div className="space-y-4">
                <AudioPlayer audioUrl={audioUrl} />
                <div className="text-sm text-gray-500 flex justify-between">
                  <span>Duration: {formatDuration(duration)}</span>
                </div>
                <Button
                  onClick={handleTranscribe}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6"
                >
                  <Save className="mr-2 h-5 w-5" />
                  Transcribe Recording
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            onClick={handleRecordClick}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-6 rounded-lg"
          >
            <StopCircle className="mr-2 h-5 w-5" />
            Stop Recording
          </Button>
        )}
      </div>
    </div>
  );
};
