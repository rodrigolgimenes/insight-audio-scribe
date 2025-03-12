
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Mic, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeviceSelectorProps {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isReady: boolean;
}

export function DeviceSelector({
  devices,
  selectedDeviceId,
  onDeviceSelect,
  isReady,
}: DeviceSelectorProps) {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    hasDevices: boolean;
    deviceCount: number;
    selectedDevice: string | null;
    permissionRequested: boolean;
  }>({
    hasDevices: false,
    deviceCount: 0,
    selectedDevice: null,
    permissionRequested: false
  });

  useEffect(() => {
    // Update debug info whenever relevant props change
    setDebugInfo({
      hasDevices: devices.length > 0,
      deviceCount: devices.length,
      selectedDevice: selectedDeviceId,
      permissionRequested: permissionStatus !== null
    });
    
    // Log device information
    console.log('[DeviceSelector] Devices:', devices.length, 'Selected:', selectedDeviceId);
    devices.forEach((device, index) => {
      console.log(`[DeviceSelector] Device ${index}:`, device.label, device.deviceId.substring(0, 8) + '...');
    });
  }, [devices, selectedDeviceId, permissionStatus]);

  // Check permission status
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(result.state);
        console.log('[DeviceSelector] Permission status:', result.state);
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          console.log('[DeviceSelector] Permission changed:', result.state);
          setPermissionStatus(result.state);
        });
      } catch (error) {
        console.error('[DeviceSelector] Error checking permissions:', error);
      }
    };
    
    checkPermissions();
  }, []);

  const handleDeviceChange = (value: string) => {
    console.log('[DeviceSelector] Device changed to:', value);
    onDeviceSelect(value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-1">
          <Mic className="h-4 w-4" />
          Dispositivo de áudio
        </label>
        
        <div className="flex items-center">
          {permissionStatus === 'granted' ? (
            <div className="text-xs text-green-500 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Permitido
            </div>
          ) : permissionStatus === 'denied' ? (
            <div className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Bloqueado
            </div>
          ) : permissionStatus === 'prompt' ? (
            <div className="text-xs text-amber-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Aguardando permissão
            </div>
          ) : null}
        </div>
      </div>

      <Select
        value={selectedDeviceId || ""}
        onValueChange={handleDeviceChange}
        disabled={!isReady || devices.length === 0}
      >
        <SelectTrigger 
          className={cn(
            "w-full",
            !isReady && "opacity-50 cursor-not-allowed"
          )}
        >
          <SelectValue placeholder="Selecione um microfone" />
        </SelectTrigger>
        <SelectContent>
          {devices.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              Nenhum microfone encontrado
            </SelectItem>
          ) : (
            devices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Microfone ${device.deviceId.slice(0, 5)}...`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {/* Debug information */}
      <div className="text-xs text-gray-500 mt-1">
        <div>Dispositivos: {debugInfo.deviceCount} encontrados</div>
        {debugInfo.selectedDevice && (
          <div className="truncate max-w-full">
            ID selecionado: {debugInfo.selectedDevice.substring(0, 10)}...
          </div>
        )}
        {!isReady && (
          <div className="text-amber-500">
            {devices.length === 0 ? "Nenhum dispositivo disponível" : "Aguardando seleção..."}
          </div>
        )}
      </div>
    </div>
  );
}
