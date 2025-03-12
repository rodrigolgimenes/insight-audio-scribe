
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MediaStreamInfo {
  id: string;
  active: boolean;
  trackCount: number;
  audioTrackCount: number;
}

interface RecordingStateInfo {
  isRecording: boolean;
  isPaused: boolean;
  hasAudioUrl: boolean;
  selectedDeviceId: string | null;
  deviceCount: number;
  deviceSelectionReady?: boolean;
  canStartRecording: boolean;
  isSystemAudio: boolean;
  mediaStreamInfo: MediaStreamInfo | null;
}

interface DiagnosticsPanelProps {
  isVisible: boolean;
  onToggle: () => void;
  logs: string[];
  recordingState: RecordingStateInfo;
}

export function DiagnosticsPanel({
  isVisible,
  onToggle,
  logs,
  recordingState
}: DiagnosticsPanelProps) {
  const [expanded, setExpanded] = useState<string[]>(["state", "logs"]);

  const toggleSection = (section: string) => {
    setExpanded(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (!isVisible) return null;

  return (
    <Card className="my-4 p-4 border-2 border-orange-300 bg-orange-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-orange-800">Informações de Diagnóstico</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onToggle}
          className="text-xs"
        >
          Ocultar
        </Button>
      </div>

      <Collapsible 
        open={expanded.includes("state")} 
        onOpenChange={() => toggleSection("state")}
        className="mb-2"
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start font-semibold">
            Estado da Gravação
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="pl-4 space-y-1 text-sm">
            <p className={`${recordingState.isRecording ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
              Gravando: {recordingState.isRecording ? 'Sim' : 'Não'}
            </p>
            <p className={`${recordingState.isPaused ? 'text-amber-600 font-semibold' : 'text-gray-600'}`}>
              Pausado: {recordingState.isPaused ? 'Sim' : 'Não'}
            </p>
            <p className={`${recordingState.hasAudioUrl ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
              Áudio Gravado: {recordingState.hasAudioUrl ? 'Sim' : 'Não'}
            </p>
            <p className={`${recordingState.selectedDeviceId ? 'text-blue-600' : 'text-red-600 font-semibold'}`}>
              Microfone Selecionado: {recordingState.selectedDeviceId ? 'Sim' : 'Não'}
            </p>
            <p className={`${recordingState.deviceCount > 0 ? 'text-blue-600' : 'text-red-600 font-semibold'}`}>
              Microfones Disponíveis: {recordingState.deviceCount}
            </p>
            <p className={`${recordingState.deviceSelectionReady ? 'text-blue-600' : 'text-gray-600'}`}>
              Seleção de Dispositivo Pronta: {recordingState.deviceSelectionReady ? 'Sim' : 'Não'}
            </p>
            <p className={`${recordingState.canStartRecording ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}`}>
              Pode Iniciar Gravação: {recordingState.canStartRecording ? 'Sim' : 'Não'}
            </p>
            <p className="text-gray-600">
              Áudio do Sistema: {recordingState.isSystemAudio ? 'Ativado' : 'Desativado'}
            </p>
            
            {recordingState.mediaStreamInfo && (
              <div className="pt-1 border-t border-gray-200">
                <p className={`${recordingState.mediaStreamInfo.active ? 'text-green-600' : 'text-red-600 font-semibold'}`}>
                  Stream Ativo: {recordingState.mediaStreamInfo.active ? 'Sim' : 'Não'}
                </p>
                <p className="text-gray-600">
                  ID do Stream: {recordingState.mediaStreamInfo.id.substring(0, 10)}...
                </p>
                <p className={`${recordingState.mediaStreamInfo.audioTrackCount > 0 ? 'text-green-600' : 'text-red-600 font-semibold'}`}>
                  Trilhas de Áudio: {recordingState.mediaStreamInfo.audioTrackCount} (de {recordingState.mediaStreamInfo.trackCount} total)
                </p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible 
        open={expanded.includes("logs")} 
        onOpenChange={() => toggleSection("logs")}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start font-semibold">
            Logs de Eventos ({logs.length})
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ScrollArea className="h-40 w-full rounded border p-2">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <p key={index} className="text-xs font-mono mb-1">
                  {log}
                </p>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">Nenhum log disponível</p>
            )}
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
