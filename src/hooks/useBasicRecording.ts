
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useBasicRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);

  const startRecording = async () => {
    try {
      setPermissionError(null);
      chunksRef.current = [];
      setAudioUrl(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const endTime = Date.now();
        const duration = recordingStartTime ? endTime - recordingStartTime : 0;
        setRecordingDuration(duration);
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        toast.success("Recording completed");
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setElapsedTime(0);
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setIsRecording(true);
      toast.success("Recording started");
      
    } catch (error) {
      console.error("Error starting recording:", error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setPermissionError("Please allow microphone access to record");
        toast.error("Microphone access denied");
      } else {
        setPermissionError("Error accessing microphone");
        toast.error("Error starting recording");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  return {
    isRecording,
    audioUrl,
    elapsedTime,
    permissionError,
    recordingDuration,
    startRecording,
    stopRecording,
    setAudioUrl
  };
};
