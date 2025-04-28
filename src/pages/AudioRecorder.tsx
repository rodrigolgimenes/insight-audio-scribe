
import React, { useRef } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { useDeviceManager } from '@/context/DeviceManagerContext';
import { AudioWaveformVisualizer } from '@/components/record/AudioWaveformVisualizer';
import { AudioRecordingControls } from '@/components/record/AudioRecordingControls';
import { AudioDeviceSettings } from '@/components/record/AudioDeviceSettings';
import { AudioTranscribeHandler } from '@/components/record/AudioTranscribeHandler';
import { ShellLayout } from '@/components/layouts/ShellLayout';

const AudioRecorder: React.FC = () => {
  // State
  const [isSystemAudio, setIsSystemAudio] = React.useState<boolean>(
    localStorage.getItem('insightscribe-record-system-audio') === 'true'
  );
  
  // Device manager for microphone access
  const { selectedDeviceId } = useDeviceManager();
  
  // Custom recorder hook
  const { 
    status, 
    statusRef,
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
  React.useEffect(() => {
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
        console.log('Recording stopped, duration:', result.duration);
      }
    } else {
      // Start recording
      console.log('Starting recording');
      const success = await start(isSystemAudio);
      
      if (success) {
        // Add delay for stream to be available
        setTimeout(() => {
          if (statusRef.current === 'recording' && window.navigator.mediaDevices) {
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

  return (
    <ShellLayout>
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
          
          {/* Recording controls with transcription handler */}
          <AudioTranscribeHandler audioBlob={audioBlob} duration={duration}>
            {(handleTranscribe) => (
              <AudioRecordingControls
                status={status}
                audioUrl={audioUrl}
                duration={duration}
                recordingTime={recordingTime}
                selectedDeviceId={selectedDeviceId}
                handleRecordClick={handleRecordClick}
                handleTranscribe={handleTranscribe}
              />
            )}
          </AudioTranscribeHandler>
          
          {/* Audio playback (hidden) */}
          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} controls className="hidden" />
          )}
        </div>
      </div>
    </ShellLayout>
  );
};

export default AudioRecorder;
