
import React, { useEffect } from "react";
import { Select } from "@/components/ui/select";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { DeviceSelectorLabel } from "./DeviceSelectorLabel";
import { DeviceDebugInfo } from "./DeviceDebugInfo";
import { formatDeviceLabel } from "./utils/deviceFormatters";
import { DeviceSelectTrigger } from "./device/DeviceSelectTrigger";
import { DeviceSelectContent } from "./device/DeviceSelectContent";
import { RefreshDevicesButton } from "./device/RefreshDevicesButton";
import { NoDevicesMessage } from "./device/NoDevicesMessage";
import { DevicePermissionRequest } from "./device/DevicePermissionRequest";
import { DevicePermissionError } from "./device/DevicePermissionError";
import { useDeviceSelection } from "./device/useDeviceSelection";
import { DeviceAutoSelection } from "./device/DeviceAutoSelection";
import { useDeviceAutoRefresh } from "./device/useDeviceAutoRefresh";

interface DeviceSelectorProps {
  devices?: MediaDeviceInfo[];
  audioDevices?: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isReady?: boolean;
  disabled?: boolean;
  hasDevices?: boolean;
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function DeviceSelector({
  devices = [],
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isReady = true,
  disabled = false,
  hasDevices = true,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
}: DeviceSelectorProps) {
  // Use nosso hook extraído para lógica de seleção de dispositivo
  const {
    hasAttemptedSelection,
    setHasAttemptedSelection,
    isRequesting,
    permissionStatus,
    handleRequestPermission
  } = useDeviceSelection(onRefreshDevices, permissionState);
  
  // Use audioDevices se fornecido, caso contrário, use devices
  const deviceList = audioDevices || devices || [];
  
  const handleDeviceChange = (value: string) => {
    if (value && value !== selectedDeviceId) {
      console.log('[DeviceSelector] Manual device selection:', {
        newDevice: value,
        previousDevice: selectedDeviceId,
        hasAttemptedSelection
      });
      
      // Marcar que uma seleção manual foi feita para evitar que a auto-seleção
      // substitua a escolha do usuário
      setHasAttemptedSelection(true);
      
      // Debug forcing of prop update
      console.log('[DeviceSelector] Before calling onDeviceSelect');
      
      // Chamar o callback para atualizar o componente pai
      onDeviceSelect(value);
      
      // Log final e verificação posterior da alteração
      console.log('[DeviceSelector] Device selection dispatched');
      
      // Verificar em um timeout se a seleção foi aplicada
      setTimeout(() => {
        console.log('[DeviceSelector] Check if selection was applied:', {
          expected: value,
          actual: selectedDeviceId
        });
      }, 300);
    } else {
      console.log('[DeviceSelector] Device selection ignored - same value or empty:', {
        selectedValue: value,
        currentValue: selectedDeviceId
      });
    }
  };

  // Logar alterações de estado
  useEffect(() => {
    console.log('[DeviceSelector] Component state updated:', {
      selectedDeviceId,
      deviceCount: deviceList.length,
      isReady,
      permissionState,
      hasAttemptedSelection
    });
    
    // Validar seleção de dispositivo para garantir que existe na lista de dispositivos
    if (selectedDeviceId && deviceList.length > 0) {
      const deviceExists = deviceList.some(d => d && d.deviceId === selectedDeviceId);
      console.log('[DeviceSelector] Selected device validation:', {
        deviceExists,
        selectedDeviceId
      });
      
      // Se o dispositivo selecionado não existe mais na lista e temos dispositivos,
      // devemos selecionar o primeiro disponível
      if (!deviceExists && deviceList.length > 0) {
        console.log('[DeviceSelector] Selected device no longer exists, selecting first available');
        const firstDevice = deviceList[0];
        if (firstDevice && firstDevice.deviceId) {
          onDeviceSelect(firstDevice.deviceId);
        }
      }
    }
  }, [selectedDeviceId, deviceList, isReady, permissionState, hasAttemptedSelection, onDeviceSelect]);

  // Use nosso hook extraído para lógica de auto-refresh
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;
  useDeviceAutoRefresh(deviceCount, devicesLoading, onRefreshDevices);
  
  // Informações de debug
  const debugInfo = {
    hasDevices: Array.isArray(deviceList) && deviceList.length > 0,
    deviceCount,
    selectedDevice: selectedDeviceId,
    permissionRequested: !!permissionStatus
  };

  // Calcular se select deve ser desativado - agora mais granular
  const isSelectDisabled = 
    disabled || 
    permissionState === 'denied' || 
    (deviceList.length === 0 && !devicesLoading); // Permitir interação durante o carregamento

  // Encontrar o nome do dispositivo selecionado para exibição
  let selectedDeviceName = "Selecionar um microfone";
  
  if (selectedDeviceId && deviceList.length > 0) {
    const selectedDevice = deviceList.find(d => d && d.deviceId === selectedDeviceId);
    if (selectedDevice) {
      selectedDeviceName = formatDeviceLabel(selectedDevice as MediaDeviceInfo, 0);
    } else {
      console.warn('[DeviceSelector] Selected device not found in device list:', {
        selectedDeviceId,
        availableDevices: deviceList.map(d => d.deviceId)
      });
    }
  }
  
  // Determinar se devemos mostrar um aviso sobre nenhum dispositivo
  const showNoDevicesWarning = deviceCount === 0 && isReady && !devicesLoading && permissionState !== 'denied';

  // Mostrar botão de solicitação de permissão quando necessário
  const showPermissionRequest = permissionState === 'prompt' || (permissionState === 'denied' && deviceCount === 0);

  // Só mostrar auto-seleção quando permissão for concedida e tivermos dispositivos
  const showAutoSelection = permissionState === 'granted' && deviceCount > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DeviceSelectorLabel 
          permissionStatus={permissionState === 'unknown' ? permissionStatus : permissionState} 
        />
        <RefreshDevicesButton 
          onRefreshDevices={onRefreshDevices} 
          isLoading={devicesLoading || isRequesting}
        />
      </div>

      {/* Este componente lida com lógica de auto-seleção - só mostrar quando permissão concedida */}
      {showAutoSelection && (
        <DeviceAutoSelection
          deviceList={deviceList}
          selectedDeviceId={selectedDeviceId}
          onDeviceSelect={onDeviceSelect}
          hasAttemptedSelection={hasAttemptedSelection}
          setHasAttemptedSelection={setHasAttemptedSelection}
        />
      )}

      {showPermissionRequest ? (
        <DevicePermissionRequest 
          onRequestPermission={handleRequestPermission}
          isRequesting={isRequesting}
        />
      ) : (
        <Select
          value={selectedDeviceId || ""}
          onValueChange={handleDeviceChange}
          disabled={isSelectDisabled}
        >
          <DeviceSelectTrigger 
            selectedDeviceName={selectedDeviceName}
            isDisabled={isSelectDisabled}
            isLoading={devicesLoading}
          />
          <DeviceSelectContent deviceList={deviceList} isLoading={devicesLoading} />
        </Select>
      )}
      
      {permissionState === 'denied' && <DevicePermissionError />}
      
      <NoDevicesMessage showWarning={showNoDevicesWarning} />
      
      <DeviceDebugInfo 
        deviceCount={deviceCount} 
        selectedDeviceId={selectedDeviceId} 
        isLoading={devicesLoading}
        permissionState={permissionState}
      />
    </div>
  );
}
