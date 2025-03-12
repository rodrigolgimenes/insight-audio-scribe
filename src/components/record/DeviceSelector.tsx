
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AudioDevice } from "@/hooks/recording/useAudioCapture";
import { AlertCircle, CheckCircle2, Mic } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  disabled?: boolean;
  hasDevices?: boolean;
}

export function DeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  disabled = false,
  hasDevices = false,
}: DeviceSelectorProps) {
  const [lastAttemptedDeviceId, setLastAttemptedDeviceId] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  useEffect(() => {
    // Attempt to get microphone permission status
    const checkPermission = async () => {
      try {
        const permResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(permResult.state as 'granted' | 'denied' | 'prompt');
        
        // Set up listener for permission changes
        permResult.addEventListener('change', () => {
          setPermissionStatus(permResult.state as 'granted' | 'denied' | 'prompt');
        });
        
        return () => {
          permResult.removeEventListener('change', () => {
            // Cleanup
          });
        };
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    };
    
    checkPermission();
  }, []);

  const handleDeviceSelect = (deviceId: string) => {
    setLastAttemptedDeviceId(deviceId);
    onDeviceSelect(deviceId);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="device-select" className="text-sm font-medium flex items-center gap-1">
          <Mic className="h-4 w-4" />
          Selecione um Microfone <span className="text-red-500">*</span>
        </label>
        
        {permissionStatus !== 'unknown' && (
          <div className="flex items-center text-xs">
            {permissionStatus === 'granted' ? (
              <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500 mr-1" />
            )}
            <span className={permissionStatus === 'granted' ? 'text-green-600' : 'text-amber-600'}>
              {permissionStatus === 'granted' 
                ? 'Permissão concedida' 
                : permissionStatus === 'denied'
                  ? 'Permissão negada'
                  : 'Permissão pendente'}
            </span>
          </div>
        )}
      </div>

      {audioDevices.length > 0 ? (
        <>
          <Select 
            disabled={disabled} 
            value={selectedDeviceId || ''}
            onValueChange={handleDeviceSelect}
          >
            <SelectTrigger id="device-select" className="w-full">
              <SelectValue placeholder="Escolha um microfone..." />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microfone (${device.deviceId.substring(0, 8)}...)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedDeviceId && (
            <div className="text-xs text-green-600 flex items-center mt-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Microfone selecionado: {audioDevices.find(d => d.deviceId === selectedDeviceId)?.label || selectedDeviceId}
            </div>
          )}
          
          {lastAttemptedDeviceId && lastAttemptedDeviceId !== selectedDeviceId && (
            <div className="text-xs text-amber-600 flex items-center mt-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Tentativa de selecionar: {audioDevices.find(d => d.deviceId === lastAttemptedDeviceId)?.label || lastAttemptedDeviceId}
            </div>
          )}
        </>
      ) : (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs flex items-center">
            <AlertCircle className="h-3 w-3 mr-2" />
            {permissionStatus === 'denied' 
              ? 'Permissão de microfone negada. Verifique as configurações do seu navegador.'
              : 'Nenhum microfone detectado. Por favor, conecte um microfone e recarregue a página.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
