
import React from "react";
import { RecordingSection } from "./RecordingSection";
import { ProcessedContentSection } from "./ProcessedContentSection";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimpleRecordContentProps {
  recordingHook: any;
  isLoading: boolean;
  error: string | null;
  saveRecording: () => Promise<any>;
  isSaveProcessing: boolean;
}

export function SimpleRecordContent({
  recordingHook,
  isLoading,
  error,
  saveRecording,
  isSaveProcessing
}: SimpleRecordContentProps) {
  // Create wrapper functions that return proper Promise types
  const handleWrappedStopRecording = async () => {
    try {
      await recordingHook.handleStopRecording();
      return Promise.resolve();
    } catch (error) {
      console.error("Error stopping recording:", error);
      return Promise.reject(error);
    }
  };
  
  const handleWrappedRefreshDevices = async () => {
    try {
      if (recordingHook.refreshDevices) {
        await recordingHook.refreshDevices();
      }
      return Promise.resolve();
    } catch (error) {
      console.error("Error refreshing devices:", error);
      return Promise.reject(error);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Record</h1>
        <Button
          onClick={saveRecording}
          disabled={!recordingHook.audioUrl || isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
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
              lastAction={recordingHook.lastAction}
              onRefreshDevices={handleWrappedRefreshDevices}
              devicesLoading={recordingHook.devicesLoading || false}
              permissionState={recordingHook.permissionState}
            />
          </CardContent>
        </Card>
        
        <div className="space-y-8">
          <ProcessedContentSection
            audioUrl={recordingHook.audioUrl}
            isRecording={recordingHook.isRecording}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
