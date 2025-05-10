
import React, { useEffect, useRef, useState } from 'react';

interface WaveformProps {
  src: string;
  height?: number;
  barWidth?: number;
  barGap?: number;
  className?: string;
  barColor?: string;
}

export const Waveform = ({ 
  src, 
  height = 128, 
  barWidth = 2, 
  barGap = 1, 
  className = "",
  barColor = "#4285F4" 
}: WaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const audioContext = new AudioContext();
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const audioData = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get the waveform data
        const channelData = audioData.getChannelData(0);
        
        // Canvas setup
        const width = canvas.width;
        const drawHeight = height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, drawHeight);
        ctx.fillStyle = '#F5F5F5';
        ctx.fillRect(0, 0, width, drawHeight);
        
        // Calculate number of bars based on width and bar settings
        const totalBars = Math.floor(width / (barWidth + barGap));
        const samplesPerBar = Math.floor(channelData.length / totalBars);
        
        // Draw bars
        ctx.fillStyle = barColor;
        
        for (let i = 0; i < totalBars; i++) {
          let sum = 0;
          
          // Average the samples for this bar
          for (let j = 0; j < samplesPerBar; j++) {
            const index = (i * samplesPerBar) + j;
            if (index < channelData.length) {
              sum += Math.abs(channelData[index]);
            }
          }
          
          const average = sum / samplesPerBar;
          const barHeight = average * drawHeight * 2;
          
          // Draw the bar
          const x = i * (barWidth + barGap);
          const y = (drawHeight - barHeight) / 2;
          
          ctx.fillRect(x, y, barWidth, barHeight);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error generating waveform:", err);
        setError("Failed to generate waveform");
        setIsLoading(false);
      }
    };
    
    drawWaveform();
  }, [src, height, barWidth, barGap, barColor]);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        width={1000} 
        height={height}
        className="w-full h-full rounded-md border border-gray-200"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-50">
          <div className="animate-pulse text-sm text-gray-400">Loading...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-sm text-red-500">{error}</div>
        </div>
      )}
    </div>
  );
};
