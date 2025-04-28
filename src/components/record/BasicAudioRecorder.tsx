
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import AudioPlayer from "./AudioPlayer";

interface BasicAudioRecorderProps {
  onRecordingSaved: (noteId: string) => void;
  disabled?: boolean;
}

export const BasicAudioRecorder = ({ onRecordingSaved, disabled = false }: BasicAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  
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
  
  const handleSave = async () => {
    if (!audioUrl) return;
    
    try {
      setIsSaving(true);
      setSaveProgress(10);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to save recordings");
      }
      
      const response = await fetch(audioUrl);
      const recordingBlob = await response.blob();
      
      setSaveProgress(25);
      
      const fileName = `${user.id}/${Date.now()}.${recordingBlob.type.split('/')[1]}`;
      
      const { error: dbError, data: recordingData } = await supabase
        .from('recordings')
        .insert({
          title: `Recording ${new Date().toLocaleString()}`,
          duration: Math.round(recordingDuration),
          file_path: fileName,
          user_id: user.id,
          status: 'pending',
          needs_compression: true,
          original_file_type: recordingBlob.type
        })
        .select()
        .single();
      
      if (dbError) throw new Error(`Failed to save recording: ${dbError.message}`);
      
      setSaveProgress(60);
      
      const { error: noteError, data: noteData } = await supabase
        .from('notes')
        .insert({
          title: recordingData.title,
          recording_id: recordingData.id,
          user_id: user.id,
          status: 'pending',
          processing_progress: 0,
          duration: Math.round(recordingDuration)
        })
        .select()
        .single();
      
      if (noteError) throw new Error(`Failed to create note: ${noteError.message}`);
      
      setSaveProgress(75);
      
      const { error: uploadError } = await supabase.storage
        .from('audio_recordings')
        .upload(fileName, recordingBlob, {
          contentType: recordingBlob.type,
          upsert: true
        });
      
      if (uploadError) {
        await supabase.from('recordings').delete().eq('id', recordingData.id);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }
      
      setSaveProgress(90);
      
      await supabase.functions.invoke('process-recording', {
        body: { 
          recordingId: recordingData.id, 
          noteId: noteData.id,
          priority: 'high'
        },
      });
      
      setSaveProgress(100);
      toast.success("Recording saved! Processing will continue in the background.");
      
      onRecordingSaved(noteData.id);
      
    } catch (error) {
      console.error('Error saving recording:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save recording");
    } finally {
      setIsSaving(false);
      setSaveProgress(0);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-3">
        {(isRecording || elapsedTime > 0) && (
          <div className="text-center font-mono text-xl">
            {formatTime(elapsedTime)}
          </div>
        )}
        
        <div className="flex justify-center">
          {!isRecording ? (
            audioUrl ? (
              <div className="w-full space-y-4">
                <AudioPlayer audioUrl={audioUrl} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setAudioUrl(null);
                      setElapsedTime(0);
                    }}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                    disabled={isSaving}
                  >
                    Delete
                  </Button>
                  
                  <Button 
                    onClick={handleSave}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={isSaving || disabled}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Transcribe"
                    )}
                  </Button>
                </div>
                
                {isSaving && saveProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={saveProgress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      {saveProgress < 100 ? `Saving: ${saveProgress}%` : "Complete"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="bg-green-500 hover:bg-green-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
                aria-label="Start Recording"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )
          ) : (
            <Button
              onClick={stopRecording}
              disabled={disabled}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Stop Recording"
            >
              <StopCircle className="h-8 w-8" />
            </Button>
          )}
        </div>
        
        {permissionError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Permission Error</p>
              <p className="text-red-600 text-sm">{permissionError}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
