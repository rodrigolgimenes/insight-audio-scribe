
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Pause, Play, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecordControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  hasRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onDelete: () => void;
  onPlay?: () => void;
  disabled?: boolean;
  showPlayButton?: boolean;
  showDeleteButton?: boolean;
}

export function RecordControls({
  isRecording,
  isPaused,
  hasRecording,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onDelete,
  onPlay,
  disabled = false,
  showPlayButton = true,
  showDeleteButton = true,
}: RecordControlsProps) {
  const [buttonState, setButtonState] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [buttonClickCount, setButtonClickCount] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  // Update button state based on props
  useEffect(() => {
    if (isRecording) {
      setButtonState(isPaused ? 'paused' : 'recording');
    } else {
      setButtonState('idle');
    }
    
    console.log('[RecordControls] State updated:', { 
      isRecording, 
      isPaused, 
      hasRecording, 
      disabled,
      buttonState: isRecording ? (isPaused ? 'paused' : 'recording') : 'idle'
    });
  }, [isRecording, isPaused, hasRecording]);

  // Start recording handler
  const handleStartClick = () => {
    console.log('[RecordControls] Start button clicked, disabled:', disabled);
    setButtonClickCount(prev => prev + 1);
    if (!disabled) {
      onStartRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {showDebugInfo && (
        <div className="w-full mb-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-xs">
          <div className="flex justify-between mb-2">
            <h4 className="font-semibold">Status do Botão:</h4>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 text-xs px-2 py-0"
              onClick={() => setShowDebugInfo(false)}
            >
              Ocultar
            </Button>
          </div>
          <div className="space-y-1">
            <p><span className="font-medium">Estado:</span> {buttonState} ({isRecording ? 'gravando' : 'não gravando'})</p>
            <p><span className="font-medium">Desabilitado:</span> {disabled ? 'Sim' : 'Não'}</p>
            <p><span className="font-medium">Cliques botão:</span> {buttonClickCount}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={disabled ? "destructive" : "outline"}>
                {disabled ? 'Botão Desabilitado' : 'Botão Habilitado'}
              </Badge>
              <Badge variant={buttonState === 'idle' ? "default" : "secondary"}>
                {buttonState === 'idle' ? 'Pronto para Gravar' : 'Gravando'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center space-x-4">
        {buttonState === 'idle' && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className={`h-16 w-16 rounded-full relative ${
              disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#4285F4] text-white hover:bg-[#3367D6] focus:ring-2 focus:ring-[#3367D6] focus:ring-offset-2'
            }`}
            onClick={handleStartClick}
            disabled={disabled}
            aria-label="Iniciar Gravação"
          >
            <Mic className="h-8 w-8" />
            {disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full">
                <span className="text-xs text-white font-medium px-1">Desabilitado</span>
              </div>
            )}
          </Button>
        )}

        {buttonState === 'recording' && (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              onClick={onPauseRecording}
              aria-label="Pausar Gravação"
            >
              <Pause className="h-8 w-8" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              onClick={onStopRecording}
              aria-label="Parar Gravação"
            >
              <Square className="h-8 w-8" />
            </Button>
          </>
        )}

        {buttonState === 'paused' && (
          <>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-green-100 hover:bg-green-200 text-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
              onClick={onResumeRecording}
              aria-label="Continuar Gravação"
            >
              <Play className="h-8 w-8" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
              onClick={onStopRecording}
              aria-label="Parar Gravação"
            >
              <Square className="h-8 w-8" />
            </Button>
          </>
        )}

        {hasRecording && !isRecording && (
          <div className="flex space-x-4">
            {showPlayButton && onPlay && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-16 w-16 rounded-full bg-green-100 hover:bg-green-200 text-green-600 focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                onClick={onPlay}
                aria-label="Reproduzir Gravação"
              >
                <Play className="h-8 w-8" />
              </Button>
            )}

            {showDeleteButton && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-16 w-16 rounded-full bg-red-100 hover:bg-red-200 text-red-600 focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                onClick={onDelete}
                aria-label="Apagar Gravação"
              >
                <Trash2 className="h-8 w-8" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
