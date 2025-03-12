
import React, { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleMicrophoneSelector } from "./SimpleMicrophoneSelector";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toAudioDevice } from "@/hooks/capture/types";

interface SimpleAudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

export function SimpleAudioRecorder({ 
  onTranscriptionComplete, 
  onError 
}: SimpleAudioRecorderProps) {
  // Audio devices state
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load audio devices on mount
  useEffect(() => {
    loadAudioDevices();
    
    // Clean up on unmount
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Load available audio devices
  const loadAudioDevices = async () => {
    setIsLoadingDevices(true);
    try {
      // Check permissions first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Then enumerate devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = allDevices.filter(device => device.kind === 'audioinput');
      
      console.log('Found audio devices:', audioInputDevices);
      
      // Convert MediaDeviceInfo[] to AudioDevice[]
      const formattedDevices: AudioDevice[] = audioInputDevices.map((device, index) => 
        toAudioDevice(device, index === 0, index)
      );
      
      setDevices(formattedDevices);
      
      // Auto-select first device if available
      if (formattedDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(formattedDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error loading audio devices:', error);
      toast.error('Could not access microphone', {
        description: 'Please ensure you have given permission to use your microphone.'
      });
    } finally {
      setIsLoadingDevices(false);
    }
  };
  
  // Format time (seconds) to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start recording
  const startRecording = async () => {
    if (!selectedDeviceId) {
      toast.error('No microphone selected');
      return;
    }
    
    try {
      const constraints = {
        audio: { deviceId: { exact: selectedDeviceId } }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Reset recording state
      chunksRef.current = [];
      setRecordingTime(0);
      
      // Create and configure MediaRecorder
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };
      
      // Start recording
      recorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    toast.info('Recording stopped');
  };
  
  // Process the recording and get transcription
  const transcribeAudio = async () => {
    if (!audioUrl) {
      toast.error('No recording to transcribe');
      return;
    }
    
    try {
      setIsProcessing(true);
      setProcessingProgress(10);
      
      // Fetch the audio blob
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      setProcessingProgress(30);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to convert file to base64'));
          }
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;
      
      setProcessingProgress(50);
      
      // Send to server for transcription
      const { data, error } = await supabaseCall('transcribe-meeting', { 
        audioData: base64Data,
        recordingData: {
          duration: recordingTime,
          mimeType: blob.type
        }
      });
      
      setProcessingProgress(100);
      
      if (error) {
        throw new Error(error.message || 'Error transcribing audio');
      }
      
      if (data && data.transcription) {
        onTranscriptionComplete(data.transcription);
        toast.success('Transcription complete');
      } else {
        throw new Error('No transcription received from server');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
      toast.error('Transcription failed', { description: errorMessage });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  // Mock supabase call - replace with actual implementation
  const supabaseCall = async (functionName: string, payload: any) => {
    // This is a placeholder - in a real app, use actual supabase client
    console.log(`Calling ${functionName} with payload:`, payload);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return mock response
    return {
      data: {
        transcription: "This is a simulated transcription of the audio recording. In a real application, this would be the actual text transcribed from your audio by the server."
      },
      error: null
    };
  };
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md mx-auto">
      <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-blue-700 flex items-center">
          <Mic className="h-5 w-5 mr-2" />
          Simple Audio Recorder
        </h2>
        
        {isRecording && (
          <div className="flex items-center text-red-500 text-sm font-medium">
            <span className="h-2 w-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
            Recording {formatTime(recordingTime)}
          </div>
        )}
      </div>
      
      <div className="p-6 space-y-6">
        {/* Microphone selector */}
        <SimpleMicrophoneSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={setSelectedDeviceId}
          disabled={isRecording || isProcessing}
        />
        
        {/* Recording controls */}
        <div className="space-y-4">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!selectedDeviceId || isProcessing}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
              disabled={isProcessing}
            >
              <StopCircle className="h-5 w-5 mr-2" />
              Stop Recording
            </Button>
          )}
          
          {audioUrl && !isRecording && (
            <div className="space-y-4">
              <audio src={audioUrl} controls className="w-full" />
              
              <Button
                onClick={transcribeAudio}
                disabled={isProcessing}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processing ({processingProgress}%)
                  </>
                ) : (
                  "Transcribe Recording"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
