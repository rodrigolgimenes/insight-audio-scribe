
import React, { useEffect, useRef, useState } from "react";

interface WaveformProps {
  src: string;
  height?: number;
}

export const Waveform = ({ src, height = 128 }: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !src) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const drawWaveform = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch audio data
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get channel data (mono - channel 0)
        const channelData = audioBuffer.getChannelData(0);
        
        // Resize canvas
        canvas.width = canvas.offsetWidth;
        canvas.height = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Set drawing style
        ctx.fillStyle = '#4285F4';
        
        // Determine how many samples to skip
        const step = Math.ceil(channelData.length / canvas.width);
        
        // Draw waveform
        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0;
          let max = -1.0;
          
          // Find min/max in this segment
          for (let j = 0; j < step; j++) {
            const datum = channelData[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
          }
          
          // Draw bar
          const barHeight = (max - min) * canvas.height * 0.8;
          const y = ((canvas.height - barHeight) / 2) + (min * canvas.height * 0.5);
          
          ctx.fillRect(i, y, 1, barHeight > 0 ? barHeight : 1);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error drawing waveform:', err);
        setError('Failed to load audio waveform');
        setIsLoading(false);
      }
    };
    
    drawWaveform();
    
    // Handle resize
    const handleResize = () => {
      if (canvas.width !== canvas.offsetWidth) {
        drawWaveform();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      audioContext.close();
    };
  }, [src, height]);

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border">
        <p className="text-gray-400 text-sm">Loading waveform...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-50 rounded-lg border overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
