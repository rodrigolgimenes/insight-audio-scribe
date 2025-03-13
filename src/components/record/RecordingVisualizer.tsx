
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
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !audioStream || !isRecording) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create audio context and analyser
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect the stream to the analyser
    const source = audioContext.createMediaStreamSource(audioStream);
    source.connect(analyser);
    
    // Store references
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    // Handle canvas sizing
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Visualization function
    const draw = () => {
      if (!analyser || !ctx) return;
      
      // Stop drawing if paused
      if (isPaused) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }
      
      // Get frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set bar width based on canvas size and buffer length
      const barWidth = canvas.width / bufferLength * 2.5;
      let x = 0;
      
      // Draw bars
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        // Use a gradient based on amplitude
        const hue = (i / bufferLength) * 180 + 200; // Blue to purple range
        ctx.fillStyle = `hsl(${hue}, 100%, ${50 + (dataArray[i] / 10)}%)`;
        
        // Draw bar centered vertically
        const y = (canvas.height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        x += barWidth + 1; // Add a small gap between bars
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioStream, isRecording, isPaused]);

  return (
    <div className="h-full w-full rounded-lg border bg-gray-50 overflow-hidden">
      {isRecording ? (
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-gray-400 text-sm">Ready to record</p>
        </div>
      )}
    </div>
  );
};
