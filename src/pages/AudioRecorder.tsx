
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mic, MicOff, StopCircle, Loader, Upload, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { useRecorder } from '@/hooks/useRecorder';
import { MicrophoneSelector } from '@/components/microphone/MicrophoneSelector';
import { useDeviceManager } from '@/context/DeviceManagerContext';
import { formatTime } from '@/utils/timeUtils';
import { useFileUpload } from '@/hooks/upload/useFileUpload';
import { useNavigate } from 'react-router-dom';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

  // Handle recording status changes
  useEffect(() => {
    // Reset canvas when not recording
    if (status !== 'recording' && visualizerRef.current.animationFrame) {
      window.cancelAnimationFrame(visualizerRef.current.animationFrame);
      visualizerRef.current = {};
      
      // Reset canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = '#f5f6fa';
          ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.fillStyle = '#9ca3af';
          ctx.font = '14px Inter, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            status === 'idle' && audioUrl ? 'Recording complete' : 'Loading waveform...',
            canvasRef.current.width / 2,
            canvasRef.current.height / 2
          );
        }
      }
    }
  }, [status, audioUrl]);

  // Initialize waveform canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to parent size
    canvas.width = canvas.parentElement?.clientWidth || 640;
    canvas.height = 110;
    
    // Set initial state
    ctx.fillStyle = '#f5f6fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Loading waveform...', canvas.width / 2, canvas.height / 2);
  }, []);

  // Setup audio visualizer during recording
  const setupVisualization = (stream: MediaStream) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
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
      if (!canvasRef.current || !visualizerRef.current.analyser || !visualizerRef.current.dataArray) {
        return;
      }

      // Request next animation frame
      visualizerRef.current.animationFrame = requestAnimationFrame(draw);

      // Get canvas context
      const canvas = canvasRef.current;
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
      
      // FIX: Only try to set up visualization if recording started successfully AND status is 'recording'
      // The previous version was checking 'if (success && status === "recording")' which caused the type error
      // because TypeScript inferred that status couldn't be 'recording' in this branch
      if (success) {
        // Add delay for stream to be available
        setTimeout(() => {
          // We need to check status again after the timeout
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

  // Get status text and color based on current status
  const getStatusInfo = () => {
    switch (status) {
      case 'idle':
        return { text: audioUrl ? 'Ready' : 'Ready', color: '#22c55e' };
      case 'recording':
        return { text: 'Recording...', color: '#ef4444' };
      case 'saving':
        return { text: 'Uploading...', color: '#4338ca' };
      case 'error':
        return { text: 'Error', color: '#9ca3af' };
      default:
        return { text: 'Ready', color: '#22c55e' };
    }
  };

  const { text: statusText, color: statusColor } = getStatusInfo();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-2xl p-8">
        <h1 className="text-2xl font-semibold mb-6">Audio Recorder</h1>
        
        {/* Waveform visualization */}
        <div className="mb-8 bg-[#f5f6fa] rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-[110px]"></canvas>
        </div>
        
        {/* Microphone selection and system audio toggle */}
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
        
        {/* Recording controls and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: statusColor }}
            ></div>
            <span>{statusText}</span>
            {status === 'recording' && (
              <span className="text-sm font-medium">
                {formatDuration(recordingTime)}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {audioUrl && status === 'idle' && (
              <Button
                onClick={handleTranscribe}
                disabled={!audioUrl || duration < 1000 || isUploading}
                className="bg-[#4338ca] hover:bg-[#3730a3] text-white flex items-center gap-2"
              >
                <Upload size={16} />
                Transcribe
              </Button>
            )}
            
            <button
              onClick={handleRecordClick}
              disabled={!selectedDeviceId || status === 'saving'}
              className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none ${
                status === 'recording' 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-[#ef4444] hover:bg-[#dc2626]'
              }`}
            >
              {status === 'recording' ? (
                <StopCircle className="text-white" size={32} />
              ) : (
                <Mic className="text-white" size={32} />
              )}
            </button>
          </div>
        </div>
        
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
                Seu registro está sendo carregado na nuvem. Aguarde...
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AudioRecorder;
