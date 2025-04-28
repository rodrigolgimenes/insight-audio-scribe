
import React, { useEffect, useRef } from "react";

interface RecordingVisualizerProps {
  audioStream: MediaStream | null;
  isRecording: boolean;
  isPaused: boolean;
}

export const RecordingVisualizer = ({
  audioStream,
  isRecording,
  isPaused
}: RecordingVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    
    const setupVisualizer = async () => {
      if (!audioStream || !isRecording || !canvasRef.current) return;
      
      try {
        // Create audio context and analyzer
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        audioContextRef.current = audioContext;
        
        // Connect the stream to the analyzer
        source = audioContext.createMediaStreamSource(audioStream);
        source.connect(analyser);
        
        // Start visualization
        if (!isPaused) {
          visualize();
        }
      } catch (error) {
        console.error("Error setting up audio visualizer:", error);
      }
    };
    
    const visualize = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) return;
      
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const analyser = analyserRef.current;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      
      const draw = () => {
        if (!isRecording) return;
        
        animationRef.current = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        canvasCtx.fillStyle = '#f5f5f5';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
        
        const barWidth = (WIDTH / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = isPaused ? 5 : (dataArray[i] / 255) * HEIGHT;
          
          canvasCtx.fillStyle = isPaused 
            ? '#F97316' // Amber color for paused state
            : `rgb(${dataArray[i]}, 155, 245)`; // Dynamic purple-ish for active
            
          canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
      };
      
      draw();
    };
    
    if (isRecording && audioStream) {
      setupVisualizer();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [audioStream, isRecording, isPaused]);
  
  return (
    <div className="w-full h-full bg-gray-50 rounded-lg border overflow-hidden">
      {isRecording ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          width={300}
          height={100}
        ></canvas>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            Waiting for recording to start...
          </p>
        </div>
      )}
    </div>
  );
};
