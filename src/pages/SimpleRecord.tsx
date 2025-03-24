
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRecording } from "@/hooks/useRecording";
import { RecordingSection } from "@/components/record/RecordingSection";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function SimpleRecord() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  const {
    isRecording,
    isPaused,
    audioUrl,
    mediaStream,
    handleStartRecording,
    handleStopRecording,
    handlePauseRecording,
    handleResumeRecording,
    handleDelete,
    isSystemAudio,
    setIsSystemAudio,
    audioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    deviceSelectionReady,
    refreshDevices,
    devicesLoading,
    permissionState,
  } = useRecording();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
  }, []);

  const handleUploadClick = () => {
    if (isAuthenticated) {
      navigate("/app");
    } else {
      toast.error("Please sign in to upload files");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold mb-6">Record Audio</h1>
          <Button 
            variant="default" 
            className="bg-palatinate-blue hover:bg-palatinate-blue/90 text-white"
            onClick={handleUploadClick}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Audio
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <RecordingSection
              isRecording={isRecording}
              isPaused={isPaused}
              audioUrl={audioUrl}
              mediaStream={mediaStream}
              isSystemAudio={isSystemAudio}
              handleStartRecording={handleStartRecording}
              handleStopRecording={handleStopRecording}
              handlePauseRecording={handlePauseRecording}
              handleResumeRecording={handleResumeRecording}
              handleDelete={handleDelete}
              onSystemAudioChange={setIsSystemAudio}
              audioDevices={audioDevices}
              selectedDeviceId={selectedDeviceId}
              onDeviceSelect={setSelectedDeviceId}
              deviceSelectionReady={deviceSelectionReady}
              onRefreshDevices={refreshDevices}
              devicesLoading={devicesLoading}
              permissionState={permissionState as any}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
