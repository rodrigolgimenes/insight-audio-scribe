
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, StopCircle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface SimpleAudioRecorderProps {
  onNewTranscription: (text: string) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const SimpleAudioRecorder = ({
  onNewTranscription,
  isLoading,
  setIsLoading
}: SimpleAudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcriptionProgress, setTranscriptionProgress] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [isRecording, audioUrl]);
  
  const startRecording = async () => {
    try {
      setIsLoading(true);
      setPermissionError(null);
      chunksRef.current = [];
      setAudioUrl(null);
      
      // Solicite permissão ao microfone com tentativas de fallback
      let stream;
      try {
        // Primeira tentativa com configurações detalhadas
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
      } catch (initialError) {
        console.log("Tentativa inicial falhou, tentando configuração mais simples", initialError);
        
        // Segunda tentativa com configuração simples
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException) {
            if (fallbackError.name === 'NotAllowedError') {
              setPermissionError("Acesso ao microfone negado. Por favor, permita o acesso nas configurações do navegador.");
              toast.error("Acesso ao microfone negado", {
                description: "Verifique as permissões no seu navegador"
              });
            } else if (fallbackError.name === 'NotFoundError') {
              setPermissionError("Nenhum microfone encontrado. Conecte um microfone e tente novamente.");
              toast.error("Nenhum microfone encontrado", {
                description: "Conecte um microfone e tente novamente"
              });
            } else {
              setPermissionError(`Erro ao acessar o microfone: ${fallbackError.message}`);
              toast.error("Erro ao acessar o microfone", {
                description: fallbackError.message
              });
            }
          } else {
            setPermissionError("Erro desconhecido ao acessar o microfone.");
            toast.error("Erro desconhecido");
          }
          setIsLoading(false);
          return;
        }
      }
      
      // Verificar se conseguimos o stream
      if (!stream) {
        setPermissionError("Falha ao obter stream de áudio");
        setIsLoading(false);
        return;
      }
      
      // Tentativa de usar codecs de alta qualidade, com fallback para o padrão
      let options;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const endTime = Date.now();
        const duration = recordingStartTime ? endTime - recordingStartTime : 0;
        setRecordingDuration(duration);
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Parar todos os tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Resetar estado
        setIsRecording(false);
        
        // Limpar o timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        setIsLoading(false);
        
        // Feedback sonoro e visual de que a gravação foi concluída
        toast.success("Gravação concluída", {
          description: `Duração: ${formatTime(Math.floor(duration / 1000))}`
        });
      };
      
      // Iniciar gravação
      mediaRecorder.start(1000); // Coleta dados a cada segundo
      mediaRecorderRef.current = mediaRecorder;
      
      // Definir horário de início e iniciar timer
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      setElapsedTime(0);
      
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      
      setIsRecording(true);
      setIsLoading(false);
      
      toast.success("Gravação iniciada", {
        description: "Fale no microfone"
      });
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      setPermissionError(error instanceof Error ? error.message : "Erro desconhecido");
      toast.error("Erro ao iniciar gravação", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      setIsLoading(false);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      toast.info("Finalizando gravação...");
    }
  };
  
  const handleSubmitAudio = async () => {
    if (!audioUrl) {
      toast.error("Nenhuma gravação disponível");
      return;
    }
    
    try {
      setIsLoading(true);
      setTranscriptionProgress(10);
      
      // Buscar dados de áudio
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Mostrar feedback sobre o tamanho do arquivo
      const fileSizeMB = blob.size / (1024 * 1024);
      console.log(`Tamanho do arquivo de áudio: ${fileSizeMB.toFixed(2)} MB`);
      
      if (fileSizeMB > 25) {
        toast.warning("Arquivo grande detectado", {
          description: `O arquivo tem ${fileSizeMB.toFixed(2)} MB. A transcrição pode demorar mais.`
        });
      }
      
      // Converter blob para base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Audio = base64data.split(',')[1];
        
        setTranscriptionProgress(30);
        toast.info("Iniciando transcrição...");
        
        try {
          setTranscriptionProgress(50);
          
          const { data, error } = await supabase.functions.invoke('transcribe-whisper-local', {
            body: { audioData: base64Audio }
          });
          
          setTranscriptionProgress(90);
          
          if (error) throw new Error(error.message);
          
          if (data.success) {
            onNewTranscription(data.transcription);
            setTranscriptionProgress(100);
            toast.success("Transcrição concluída com sucesso");
          } else {
            throw new Error(data.error || "Erro desconhecido durante a transcrição");
          }
        } catch (invokeError) {
          console.error("Erro durante a transcrição:", invokeError);
          toast.error("Falha na transcrição", {
            description: invokeError instanceof Error ? invokeError.message : "Erro desconhecido"
          });
        } finally {
          setIsLoading(false);
        }
      };
    } catch (error) {
      console.error("Erro ao enviar áudio:", error);
      toast.error("Erro ao enviar áudio", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      setIsLoading(false);
    }
  };
  
  // Formatar segundos para MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        {/* Exibição do timer */}
        {(isRecording || elapsedTime > 0) && (
          <div className="text-center font-mono text-xl">
            {formatTime(elapsedTime)}
          </div>
        )}
        
        {/* Botões de Gravação/Parar */}
        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={isLoading}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Iniciar Gravação"
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full h-16 w-16 flex items-center justify-center"
              aria-label="Parar Gravação"
            >
              <StopCircle className="h-8 w-8" />
            </Button>
          )}
        </div>
        
        {permissionError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}
        
        {/* Prévia de áudio */}
        {audioUrl && (
          <div className="mt-4">
            <audio src={audioUrl} controls className="w-full rounded-md shadow-sm" />
            <Button
              onClick={handleSubmitAudio}
              disabled={isLoading}
              className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Transcrevendo...
                </>
              ) : (
                "Transcrever Áudio"
              )}
            </Button>
            
            {isLoading && transcriptionProgress > 0 && (
              <div className="mt-2">
                <Progress value={transcriptionProgress} className="h-2" />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {transcriptionProgress < 100 ? "Processando..." : "Concluído!"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
