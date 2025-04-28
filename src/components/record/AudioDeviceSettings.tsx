
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { MicrophoneSelector } from '@/components/microphone/MicrophoneSelector';

interface AudioDeviceSettingsProps {
  isSystemAudio: boolean;
  setIsSystemAudio: (checked: boolean) => void;
  status: string;
}

export const AudioDeviceSettings: React.FC<AudioDeviceSettingsProps> = ({
  isSystemAudio,
  setIsSystemAudio,
  status
}) => {
  return (
    <div className="mb-8 space-y-4">
      <div>
        <Label htmlFor="microphone" className="block mb-2 text-sm">Select Microphone</Label>
        <MicrophoneSelector className="w-full" disabled={status === 'recording'} />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="system-audio" 
          checked={isSystemAudio}
          disabled={status === 'recording' || !navigator.mediaDevices.getDisplayMedia}
          onCheckedChange={(checked) => setIsSystemAudio(checked)}
        />
        <Label htmlFor="system-audio" className="text-sm">
          Also record system audio (Chrome only)
        </Label>
      </div>
    </div>
  );
};
