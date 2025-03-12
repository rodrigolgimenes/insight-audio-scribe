
import React, { useState, useEffect } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bug, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface DiagnosticsPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  mediaStream: MediaStream | null;
  deviceSelectionReady: boolean;
  deviceId: string | null;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
  onRefreshDevices?: () => void;
}

export function DiagnosticsPanel({
  isRecording,
  isPaused,
  mediaStream,
  deviceSelectionReady,
  deviceId,
  lastAction,
  onRefreshDevices
}: DiagnosticsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [browserInfo, setBrowserInfo] = useState<string>("");
  const [browserPermissions, setBrowserPermissions] = useState<string>("Verificando...");
  
  // Add log entry
  const addLog = (message: string) => {
    setLogs(prevLogs => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prevLogs.slice(0, 19) // Keep only the last 20 logs
    ]);
  };
  
  // Get browser information
  useEffect(() => {
    const userAgent = navigator.userAgent;
    let browserName = "Unknown";
    
    if (userAgent.indexOf("Firefox") > -1) {
      browserName = "Firefox";
    } else if (userAgent.indexOf("Chrome") > -1) {
      browserName = "Chrome";
    } else if (userAgent.indexOf("Safari") > -1) {
      browserName = "Safari";
    } else if (userAgent.indexOf("Edge") > -1) {
      browserName = "Edge";
    }
    
    setBrowserInfo(`${browserName} - ${navigator.platform}`);
  }, []);
  
  // Check browser permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setBrowserPermissions(`Microfone: ${micPermission.state}`);
          addLog(`Permissão do microfone: ${micPermission.state}`);
        } else {
          setBrowserPermissions("API de permissões não suportada");
          addLog("API de permissões não suportada neste navegador");
        }
      } catch (error) {
        setBrowserPermissions(`Erro ao verificar permissões: ${error}`);
        addLog(`Erro ao verificar permissões: ${error}`);
      }
    };
    
    checkPermissions();
  }, []);
  
  // Log media stream changes
  useEffect(() => {
    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      addLog(`Stream obtido: ${tracks.length} faixas`);
      
      tracks.forEach((track, index) => {
        addLog(`Faixa ${index}: ${track.kind} - ${track.label} (${track.enabled ? 'ativada' : 'desativada'})`);
      });
    } else {
      addLog("Nenhum stream de mídia ativo");
    }
  }, [mediaStream]);
  
  // Log state changes
  useEffect(() => {
    addLog(`Estado de gravação alterado: ${isRecording ? (isPaused ? 'Pausado' : 'Gravando') : 'Parado'}`);
  }, [isRecording, isPaused]);
  
  // Log device selection
  useEffect(() => {
    addLog(`Seleção de dispositivo: ${deviceSelectionReady ? 'Pronto' : 'Aguardando'}`);
    if (deviceId) {
      addLog(`ID do dispositivo: ${deviceId.substring(0, 10)}...`);
    }
  }, [deviceSelectionReady, deviceId]);
  
  // Log last action
  useEffect(() => {
    if (lastAction) {
      addLog(`Ação: ${lastAction.action} - ${lastAction.success ? 'Sucesso' : 'Falha'}${lastAction.error ? ` - Erro: ${lastAction.error}` : ''}`);
    }
  }, [lastAction]);

  return (
    <div className="mt-6 border rounded-lg overflow-hidden bg-gray-50">
      <div 
        className="p-3 bg-blue-50 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">Diagnóstico de Gravação</span>
        </div>
        <Button variant="ghost" size="sm">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {expanded && (
        <div className="p-3 text-sm">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <div className="font-semibold mb-1">Informações do navegador</div>
              <div className="text-xs">{browserInfo}</div>
              <div className="text-xs mt-1">{browserPermissions}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Estado atual</div>
              <div className="text-xs">Gravação: {isRecording ? (isPaused ? 'Pausada' : 'Ativa') : 'Inativa'}</div>
              <div className="text-xs">Dispositivo: {deviceSelectionReady ? 'Pronto' : 'Aguardando'}</div>
              <div className="text-xs">Stream: {mediaStream ? 'Ativo' : 'Inativo'}</div>
            </div>
          </div>
          
          {lastAction && lastAction.error && (
            <Alert variant="destructive" className="mb-3">
              <AlertTitle>Erro na última ação</AlertTitle>
              <AlertDescription>{lastAction.error}</AlertDescription>
            </Alert>
          )}
          
          <div className="mb-2 flex justify-between items-center">
            <div className="font-semibold">Registro de eventos</div>
            {onRefreshDevices && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshDevices();
                  addLog("Solicitação de atualização de dispositivos");
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Atualizar dispositivos
              </Button>
            )}
          </div>
          
          <div className="bg-gray-100 p-2 rounded max-h-40 overflow-y-auto text-xs font-mono">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">Nenhum evento registrado</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap mb-1">{log}</div>
              ))
            )}
          </div>
          
          {mediaStream && (
            <div className="mt-3">
              <div className="font-semibold mb-1">Detalhes do stream de áudio</div>
              {mediaStream.getAudioTracks().map((track, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded mb-1">
                  <div>Faixa {index}: {track.label || 'Sem nome'}</div>
                  <div>Estado: {track.readyState} | Ativa: {track.enabled ? 'Sim' : 'Não'} | Muda: {track.muted ? 'Sim' : 'Não'}</div>
                  <div className="mt-1 text-xs">ID: {track.id.substring(0, 15)}...</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
