
import React, { useEffect } from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceContext } from "@/providers/DeviceManagerProvider"; 
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";

export function UnifiedRecordingSection() {
  const { selectedDeviceId, permissionState } = useDeviceContext();
  const [isRecording, setIsRecording] = React.useState(false);

  // Log device and permission state for debugging
  useEffect(() => {
    console.log("[UnifiedRecordingSection] State update:", {
      selectedDeviceId,
      permissionState
    });
  }, [selectedDeviceId, permissionState]);

  const handleStartRecording = async () => {
    if (!selectedDeviceId) {
      toast.error("No microphone selected", {
        description: "Please select a microphone first"
      });
      return;
    }

    try {
      setIsRecording(true);
      toast.success("Recording started", {
        description: "Using selected microphone"
      });
    } catch (error) {
      console.error('[UnifiedRecordingSection] Error starting recording:', error);
      toast.error("Failed to start recording", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    toast.info("Recording stopped");
  };

  // Simplified canRecord check
  const canRecord = permissionState === 'granted' && !!selectedDeviceId;

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Record Audio</h2>
        
        <div className="space-y-6">
          <MicrophoneSelector disabled={isRecording} className="w-full" />
          
          {permissionState !== 'granted' && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-amber-700 text-sm flex items-center">
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Please allow microphone access to record audio
            </div>
          )}
          
          <div className="flex gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                disabled={!canRecord}
                className={`flex items-center gap-2 px-4 py-2 rounded ${
                  canRecord 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                } transition-colors`}
              >
                <Mic className="h-4 w-4" />
                Start Recording
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded transition-colors"
              >
                <MicOff className="h-4 w-4" />
                Stop Recording
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
