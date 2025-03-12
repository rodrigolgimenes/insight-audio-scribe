
import React, { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleMicrophoneSelector } from "./SimpleMicrophoneSelector";
import { toast } from "sonner";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toAudioDevice } from "@/hooks/capture/types";
import { supabase } from "@/integrations/supabase/client";

interface SimpleAudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  onStatusChange?: (status: string) => void;
}

export function SimpleAudioRecorder({ 
  onTranscriptionComplete, 
  onError,
  onStatusChange
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
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load audio devices on mount
  useEffect(() => {
    loadAudioDevices();
    
    // Clean up on unmount
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);
  
  // Notify parent component of status changes
  useEffect(() => {
    if (onStatusChange) {
      if (isRecording) {
        onStatusChange('recording');
      } else if (isProcessing) {
        onStatusChange('processing');
      }
    }
  }, [isRecording, isProcessing, onStatusChange]);
  
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
      setTranscriptionId(null);
      setTranscriptionStatus(null);
      
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
  
  // Check transcription status
  const checkTranscriptionStatus = async () => {
    if (!transcriptionId) return;
    
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();
      
      if (error) {
        console.error('Error checking transcription status:', error);
        return;
      }
      
      setTranscriptionStatus(data.status);
      
      if (data.status === 'completed') {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setIsProcessing(false);
        setProcessingProgress(100);
        onTranscriptionComplete(data.content);
        toast.success('Transcription completed');
      } else if (data.status === 'error') {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
        setIsProcessing(false);
        setProcessingProgress(0);
        onError(data.error_message || 'An error occurred during transcription');
        toast.error('Transcription failed', { 
          description: data.error_message || 'Unknown error' 
        });
      } else if (data.status === 'processing') {
        setProcessingProgress(70);
      }
    } catch (error) {
      console.error('Error polling transcription status:', error);
    }
  };
  
  // Process the recording and get transcription using fast-whisper
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
      
      // Send to fast-whisper service via Edge Function
      const { data, error } = await supabase.functions
        .invoke('transcribe-whisper', { 
          body: { 
            audioData: base64Data,
            recordingData: {
              duration: recordingTime,
              mimeType: blob.type
            }
          }
        });
      
      if (error) {
        throw new Error(error.message || 'Error transcribing audio');
      }
      
      if (data && data.transcriptionId) {
        setTranscriptionId(data.transcriptionId);
        setTranscriptionStatus('pending');
        
        // Start polling for status updates
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(checkTranscriptionStatus, 2000);
        
        // Provide initial feedback to user
        if (data.transcription) {
          onTranscriptionComplete(data.transcription);
        }
        
        toast.success('Transcription initiated', {
          description: 'Your audio is being processed. This may take a moment.'
        });
      } else {
        throw new Error('No transcription ID received from server');
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
      toast.error('Transcription failed', { description: errorMessage });
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  // Function to retry failed transcription
  const retryTranscription = async () => {
    if (!transcriptionId || !audioUrl) {
      toast.error('Cannot retry transcription without original audio');
      return;
    }
    
    setIsProcessing(true);
    setProcessingProgress(10);
    
    try {
      // Fetch the audio blob
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
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
      
      // Send to fast-whisper service via Edge Function
      const { data, error } = await supabase.functions
        .invoke('transcribe-whisper', { 
          body: { 
            audioData: base64Data,
            recordingData: {
              duration: recordingTime,
              mimeType: blob.type
            },
            retryTranscriptionId: transcriptionId
          }
        });
      
      if (error) {
        throw new Error(error.message || 'Error retrying transcription');
      }
      
      if (data && data.transcriptionId) {
        setTranscriptionId(data.transcriptionId);
        setTranscriptionStatus('pending');
        
        // Start polling for status updates
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        
        pollingRef.current = setInterval(checkTranscriptionStatus, 2000);
        
        toast.success('Transcription retry initiated');
      } else {
        throw new Error('No transcription ID received from server');
      }
    } catch (error) {
      console.error('Error retrying transcription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onError(errorMessage);
      toast.error('Transcription retry failed', { description: errorMessage });
      setIsProcessing(false);
      setProcessingProgress(0);
    }
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
              
              {transcriptionStatus === 'error' ? (
                <Button
                  onClick={retryTranscription}
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <RefreshCcw className="h-5 w-5 mr-2" />
                  Retry Transcription
                </Button>
              ) : (
                <Button
                  onClick={transcribeAudio}
                  disabled={isProcessing}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {transcriptionStatus === 'pending' && 'Initializing...'}
                      {transcriptionStatus === 'processing' && 'Transcribing...'}
                      {!transcriptionStatus && `Processing (${processingProgress}%)`}
                    </>
                  ) : (
                    "Transcribe with Fast-Whisper"
                  )}
                </Button>
              )}
              
              {isProcessing && transcriptionStatus && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${
                        transcriptionStatus === 'pending' ? 30 : 
                        transcriptionStatus === 'processing' ? 70 : 
                        transcriptionStatus === 'completed' ? 100 : 
                        processingProgress
                      }%` 
                    }}
                  ></div>
                </div>
              )}
              
              {transcriptionStatus && (
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  Status: 
                  <span className={`ml-1 font-medium ${
                    transcriptionStatus === 'pending' ? 'text-yellow-600' : 
                    transcriptionStatus === 'processing' ? 'text-blue-600' : 
                    transcriptionStatus === 'completed' ? 'text-green-600' : 
                    'text-red-600'
                  }`}>
                    {transcriptionStatus.charAt(0).toUpperCase() + transcriptionStatus.slice(1)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
