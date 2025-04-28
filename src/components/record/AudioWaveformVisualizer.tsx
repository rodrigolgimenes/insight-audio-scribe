
import React, { useEffect, useRef } from 'react';

interface AudioWaveformVisualizerProps {
  isRecording: boolean;
  status: string;
  audioUrl: string | null;
  stream?: MediaStream | null;
  setupVisualization: (stream: MediaStream) => void;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({ 
  isRecording, 
  status, 
  audioUrl,
  stream,
  setupVisualization 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualizerRef = useRef<{
    analyser?: AnalyserNode;
    dataArray?: Uint8Array;
    source?: MediaStreamAudioSourceNode;
    animationFrame?: number;
  }>({});

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

  // Setup visualization when stream becomes available
  useEffect(() => {
    if (isRecording && stream) {
      setupVisualization(stream);
    }
  }, [isRecording, stream, setupVisualization]);

  return (
    <div className="mb-8 bg-[#f5f6fa] rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-[110px]"></canvas>
    </div>
  );
};
