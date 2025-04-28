
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useRecorder, RecorderStatus } from '@/hooks/useRecorder';
import { useDeviceManager } from '@/context/DeviceManagerContext';
import { useFileUpload } from '@/hooks/upload/useFileUpload';
import { useNavigate } from 'react-router-dom';
import { AudioWaveformVisualizer } from '@/components/record/AudioWaveformVisualizer';
import { AudioRecordingControls } from '@/components/record/AudioRecordingControls';
import { AudioDeviceSettings } from '@/components/record/AudioDeviceSettings';

// Helper function to format milliseconds to MM:SS
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const AudioRecorder: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // State
  const [isSystemAudio, setIsSystemAudio] = useState<boolean>(
    localStorage.getItem('insightscribe-record-system-audio') === 'true'
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  
  // Device manager for microphone access
  const { selectedDeviceId } = useDeviceManager();
  
  // File upload utility
  const { handleFileUpload } = useFileUpload();
  
  // Custom recorder hook
  const { 
    status, 
    audioBlob, 
    audioUrl, 
    recordingTime,
    duration,
    start,
    stop 
  } = useRecorder();
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const visualizerRef = useRef<{
    analyser?: AnalyserNode;
    dataArray?: Uint8Array;
    source?: MediaStreamAudioSourceNode;
    animationFrame?: number;
  }>({});

  // Effect to save system audio preference to localStorage
  useEffect(() => {
    localStorage.setItem('insightscribe-record-system-audio', isSystemAudio.toString());
  }, [isSystemAudio]);

  // Setup audio visualizer during recording
  const setupVisualization = (stream: MediaStream) => {
    const canvasRef = document.querySelector('canvas');
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    // Clear previous visualization
    if (visualizerRef.current.animationFrame) {
      window.cancelAnimationFrame(visualizerRef.current.animationFrame);
      visualizerRef.current = {};
    }

    // Create audio context
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    
    // Get audio source from stream
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    // Set up data array for visualization
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Save references
    visualizerRef.current.analyser = analyser;
    visualizerRef.current.dataArray = dataArray;
    visualizerRef.current.source = source;

    // Draw function for the waveform visualization
    const draw = () => {
      if (!canvasRef || !visualizerRef.current.analyser || !visualizerRef.current.dataArray) {
        return;
      }

      // Request next animation frame
      visualizerRef.current.animationFrame = requestAnimationFrame(draw);

      // Get canvas context
      const canvas = canvasRef;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Get time domain data
      visualizerRef.current.analyser.getByteTimeDomainData(visualizerRef.current.dataArray);

      // Clear canvas
      ctx.fillStyle = '#f5f6fa';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444'; // Red color for recording
      ctx.beginPath();

      // Calculate width between data points
      const sliceWidth = canvas.width / visualizerRef.current.dataArray.length;
      let x = 0;

      for (let i = 0; i < visualizerRef.current.dataArray.length; i++) {
        // Normalize data (0-255) to (-1 to 1)
        const v = (visualizerRef.current.dataArray[i] / 128.0) - 1;
        // Scale to canvas height and position at center
        const y = (v * 40) + (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    // Start drawing
    draw();
  };

  // Handle record button click
  const handleRecordClick = async () => {
    if (status === 'recording') {
      // Stop recording
      const result = await stop();
      
      // If we got a result, log it
      if (result) {
        console.log('Recording stopped, duration:', formatDuration(result.duration));
      }
    } else {
      // Start recording
      console.log('Starting recording');
      const success = await start(isSystemAudio);
      
      if (success) {
        // Add delay for stream to be available
        setTimeout(() => {
          if (status === 'recording' && window.navigator.mediaDevices) {
            // Get all media devices for visualization
            window.navigator.mediaDevices.enumerateDevices()
              .then(() => {
                if (window.navigator.mediaDevices.getUserMedia) {
                  // Get audio stream for visualization
                  window.navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(setupVisualization)
                    .catch(err => console.error('Error getting audio stream for visualization:', err));
                }
              })
              .catch(err => console.error('Error enumerating devices:', err));
          }
        }, 500);
      }
    }
  };

  // Handle transcribe button click
  const handleTranscribe = async () => {
    if (!audioBlob || duration < 1000) {
      toast.warning('Recording is too short', {
        description: 'Recording must be at least 1 second long.',
        duration: 3000
      });
      return;
    }

    try {
      setIsUploading(true);
      setIsUploadDialogOpen(true);

      // Create a File object from the blob
      const file = new File([audioBlob], 'recording.webm', {
        type: 'audio/webm',
        lastModified: Date.now()
      });

      // Upload the file
      const result = await handleFileUpload(undefined, true, file);
      
      if (result) {
        toast.success('Recording uploaded successfully');
        
        // Navigate to the note
        navigate(`/notes/${result.noteId}`);
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Transcription failed', {
        description: 'There was an error uploading your recording.',
        duration: 5000
      });
    } finally {
      setIsUploading(false);
      setIsUploadDialogOpen(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-2xl p-8">
        <h1 className="text-2xl font-semibold mb-6">Audio Recorder</h1>
        
        {/* Waveform visualization */}
        <AudioWaveformVisualizer 
          isRecording={status === 'recording'} 
          status={status} 
          audioUrl={audioUrl}
          setupVisualization={setupVisualization}
        />
        
        {/* Microphone selection and system audio toggle */}
        <AudioDeviceSettings
          isSystemAudio={isSystemAudio}
          setIsSystemAudio={setIsSystemAudio}
          status={status}
        />
        
        {/* Recording controls */}
        <AudioRecordingControls
          status={status}
          audioUrl={audioUrl}
          duration={duration}
          recordingTime={recordingTime}
          selectedDeviceId={selectedDeviceId}
          handleRecordClick={handleRecordClick}
          handleTranscribe={handleTranscribe}
          formatDuration={formatDuration}
        />
        
        {/* Audio playback (hidden) */}
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} controls className="hidden" />
        )}
        
        {/* Upload dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="animate-spin mb-4 text-[#4338ca]" size={48} />
              <h3 className="text-xl font-medium mb-2">Processing Recording</h3>
              <p className="text-gray-500 text-center">
                Your recording is being uploaded to the cloud. Please wait...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AudioRecorder;
