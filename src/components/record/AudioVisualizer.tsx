
import React, { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  mediaStream: MediaStream | null;
  isRecording: boolean;
  isPaused: boolean;
}

export function AudioVisualizer({ mediaStream, isRecording, isPaused }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Clean up function to reset everything
    const cleanup = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }

      analyserRef.current = null;
      dataArrayRef.current = null;
      setIsInitialized(false);
    };

    // Initialize audio context and analyzer when media stream is available
    if (mediaStream && isRecording && !isPaused && canvasRef.current) {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Create analyzer if it doesn't exist
        if (!analyserRef.current) {
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          const bufferLength = analyserRef.current.frequencyBinCount;
          dataArrayRef.current = new Uint8Array(bufferLength);
        }

        // Create source if it doesn't exist
        if (!sourceRef.current) {
          sourceRef.current = audioContextRef.current.createMediaStreamSource(mediaStream);
          sourceRef.current.connect(analyserRef.current);
        }

        setIsInitialized(true);
        setHasError(false);
        
        // Start visualization
        const draw = () => {
          if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
          
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          animationRef.current = requestAnimationFrame(draw);
          
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
          let x = 0;
          
          for (let i = 0; i < dataArrayRef.current.length; i++) {
            const barHeight = dataArrayRef.current[i] / 2;
            
            ctx.fillStyle = isPaused ? 'rgba(253, 186, 116, 0.7)' : 'rgba(239, 68, 68, 0.7)';
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
          }
        };
        
        draw();
      } catch (error) {
        console.error("Error setting up audio visualizer:", error);
        setHasError(true);
      }
    } else if (!isRecording || isPaused) {
      // Clear canvas if not recording or paused
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      // Cancel animation frame if not recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    return cleanup;
  }, [mediaStream, isRecording, isPaused]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, []);

  // Only render if recording is active
  if (!isRecording) {
    return null;
  }

  return (
    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
      {hasError ? (
        <div className="w-full h-full flex items-center justify-center text-red-500">
          Audio visualization not available
        </div>
      ) : isRecording && !isPaused ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={300}
          height={100}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          {isPaused ? "Recording paused" : "Press record to start"}
        </div>
      )}
    </div>
  );
}
