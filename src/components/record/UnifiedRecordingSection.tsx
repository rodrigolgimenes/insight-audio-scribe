
import React, { useEffect } from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";
import { useDeviceManager } from "@/context/DeviceManagerContext";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Mic, MicOff, RefreshCw, AlertCircle } from "lucide-react";

export function UnifiedRecordingSection() {
  const { selectedDeviceId, permissionState, requestPermission } = useDeviceManager();
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
              <AlertCircle className="h-4 w-4 mr-2" />
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
            
            <button
              onClick={requestPermission}
              disabled={isRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded border ${
                isRecording 
                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
              } transition-colors`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Devices
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
