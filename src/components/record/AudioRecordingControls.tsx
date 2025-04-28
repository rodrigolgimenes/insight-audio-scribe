
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Upload } from 'lucide-react';
import { RecorderStatus } from '@/hooks/useRecorder';

interface AudioRecordingControlsProps {
  status: RecorderStatus;
  audioUrl: string | null;
  duration: number;
  recordingTime: number;
  selectedDeviceId: string | null;
  handleRecordClick: () => void;
  handleTranscribe: () => void;
  formatDuration: (ms: number) => string;
}

export const AudioRecordingControls: React.FC<AudioRecordingControlsProps> = ({
  status,
  audioUrl,
  duration,
  recordingTime,
  selectedDeviceId,
  handleRecordClick,
  handleTranscribe,
  formatDuration
}) => {
  // Get status text and color based on current status
  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return { text: audioUrl ? 'Ready' : 'Ready', color: '#22c55e' };
      case 'recording':
        return { text: 'Recording...', color: '#ef4444' };
      case 'saving':
        return { text: 'Uploading...', color: '#4338ca' };
      case 'error':
        return { text: 'Error', color: '#9ca3af' };
      default:
        return { text: 'Ready', color: '#22c55e' };
    }
  };

  const { text: statusText, color: statusColor } = getStatusInfo();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: statusColor }}
        ></div>
        <span>{statusText}</span>
        {status === 'recording' && (
          <span className="text-sm font-medium">
            {formatDuration(recordingTime)}
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-3">
        {audioUrl && status === 'idle' && (
          <Button
            onClick={handleTranscribe}
            disabled={!audioUrl || duration < 1000}
            className="bg-[#4338ca] hover:bg-[#3730a3] text-white flex items-center gap-2"
          >
            <Upload size={16} />
            Transcribe
          </Button>
        )}
        
        <button
          onClick={handleRecordClick}
          disabled={!selectedDeviceId || status === 'saving'}
          className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none ${
            status === 'recording' 
              ? 'bg-gray-500 hover:bg-gray-600' 
              : 'bg-[#ef4444] hover:bg-[#dc2626]'
          }`}
        >
          {status === 'recording' ? (
            <StopCircle className="text-white" size={32} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>
      </div>
    </div>
  );
};
