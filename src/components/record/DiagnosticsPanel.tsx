
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiagnosticsPanelProps {
  isRecording: boolean;
  isPaused: boolean;
  mediaStream: MediaStream | null;
  deviceSelectionReady: boolean;
  deviceId: string | null;
  deviceCount?: number;
  lastAction?: { 
    action: string; 
    timestamp: number; 
    success: boolean;
    error?: string;
  };
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function DiagnosticsPanel({
  isRecording,
  isPaused, 
  mediaStream,
  deviceSelectionReady,
  deviceId,
  deviceCount = 0,
  lastAction,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown'
}: DiagnosticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const audioTracks = mediaStream?.getAudioTracks() || [];
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border rounded-md p-2 bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
            <span className="text-xs text-gray-500 flex items-center">
              Diagnostics
              {isOpen ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </span>
          </Button>
        </CollapsibleTrigger>
        
        {onRefreshDevices && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefreshDevices}
            className="p-0 hover:bg-transparent text-xs text-blue-500"
            disabled={devicesLoading}
          >
            {devicesLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            {devicesLoading ? 'Refreshing...' : 'Refresh devices'}
          </Button>
        )}
      </div>
      
      <CollapsibleContent className="text-xs text-gray-600 space-y-1 mt-2">
        <div>Recording state: {isRecording ? (isPaused ? "Paused" : "Recording") : "Stopped"}</div>
        <div>Device selection ready: {deviceSelectionReady ? "Yes" : "No"}</div>
        <div>Device count: {deviceCount} {devicesLoading && <span className="text-blue-500">(refreshing...)</span>}</div>
        <div className="truncate max-w-full">Device ID: {deviceId || "None"}</div>
        <div>Permission: <span className={`
          ${permissionState === 'granted' ? 'text-green-500' : ''}
          ${permissionState === 'denied' ? 'text-red-500' : ''}
          ${permissionState === 'prompt' ? 'text-amber-500' : ''}
        `}>{permissionState}</span></div>
        
        {mediaStream && (
          <>
            <div>Audio tracks: {audioTracks.length}</div>
            {audioTracks.map((track, index) => (
              <div key={index} className="pl-2 text-gray-500">
                Track {index}: {track.label.substring(0, 20)}... ({track.enabled ? "enabled" : "disabled"})
              </div>
            ))}
          </>
        )}
        
        {lastAction && (
          <div className={cn(
            "mt-1",
            lastAction.success ? "text-green-600" : "text-red-500"
          )}>
            Last action: {lastAction.action} ({new Date(lastAction.timestamp).toLocaleTimeString()})
            {lastAction.error && <div className="text-red-500">{lastAction.error}</div>}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
