
import React, { useEffect, useRef } from 'react';

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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Clean up previous animation frame if exists
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Clean up previous audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
      analyserRef.current = null;
    }

    // Only initialize if we are recording and have a stream
    if (isRecording && audioStream && !isPaused) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Create audio context and analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const analyzer = audioContext.createAnalyser();
      analyserRef.current = analyzer;
      analyzer.fftSize = 256;
      
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyzer);
      
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = (width / bufferLength) * 2.5;
      
      let barHeight;
      let x = 0;
      
      const renderFrame = () => {
        if (!analyserRef.current || !ctx) return;

        x = 0;
        animationRef.current = requestAnimationFrame(renderFrame);
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgb(240, 240, 240)';
        ctx.fillRect(0, 0, width, height);
        
        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;
          
          const r = barHeight + 25;
          const g = 100;
          const b = 200;
          
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
      };
      
      renderFrame();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
        analyserRef.current = null;
      }
    };
  }, [audioStream, isRecording, isPaused]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full rounded-md border border-gray-200 bg-gray-50"
      width={700} 
      height={128} 
    />
  );
};
