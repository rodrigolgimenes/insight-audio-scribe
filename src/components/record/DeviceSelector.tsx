
import React from "react";
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
  // Use audioDevices if provided, otherwise fall back to devices
  const deviceList = audioDevices || devices || [];
  
  // Use our extracted hook for device selection logic
  const {
    hasAttemptedSelection,
    setHasAttemptedSelection,
    isRequesting,
    permissionStatus,
    handleRequestPermission
  } = useDeviceSelection(onRefreshDevices, permissionState);
  
  // Use our extracted hook for auto-refresh logic
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;
  useDeviceAutoRefresh(deviceCount, devicesLoading, onRefreshDevices);
  
  // Debug information
  const debugInfo = {
    hasDevices: Array.isArray(deviceList) && deviceList.length > 0,
    deviceCount,
    selectedDevice: selectedDeviceId,
    permissionRequested: !!permissionStatus
  };

  // Calculate if select should be disabled - now more granular
  const isSelectDisabled = 
    disabled || 
    permissionState === 'denied' || 
    (deviceList.length === 0 && !devicesLoading); // Allow interaction during loading

  const handleDeviceChange = (value: string) => {
    if (value && value !== selectedDeviceId) {
      console.log('[DeviceSelector] Device selected by user:', value);
      console.log('[DeviceSelector] Current state before selection:', {
        selectedDeviceId,
        deviceCount,
        isReady,
        permissionState
      });
      
      // Log devices available for selection
      if (deviceList.length > 0) {
        console.log('[DeviceSelector] Available devices:', deviceList.map(d => ({
          id: d.deviceId,
          label: d.label || 'Unnamed device'
        })));
      }
      
      // Call the callback to update the parent component
      console.log('[DeviceSelector] Calling onDeviceSelect with deviceId:', value);
      onDeviceSelect(value);
      
      // Log state change intent
      console.log('[DeviceSelector] Device selection dispatched. Will log actual state in next render.');
      
      // Add a delayed check to verify the state was updated
      setTimeout(() => {
        console.log('[DeviceSelector] State after selection (timeout check):', {
          selectedDeviceIdNow: selectedDeviceId,
          selected: value
        });
      }, 100);
    } else {
      console.log('[DeviceSelector] Device selection unchanged or empty:', {
        value,
        selectedDeviceId,
        noChange: value === selectedDeviceId,
        isEmpty: !value 
      });
    }
  };

  // Find the selected device name for display
  let selectedDeviceName = "Select a microphone";
  
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
  
  // Add useEffect to log when props change
  React.useEffect(() => {
    console.log('[DeviceSelector] Props updated:', {
      selectedDeviceId,
      deviceCount,
      isReady,
      permissionState
    });
  }, [selectedDeviceId, deviceCount, isReady, permissionState]);
  
  // Determine if we should show a warning about no devices
  const showNoDevicesWarning = deviceCount === 0 && isReady && !devicesLoading && permissionState !== 'denied';

  // Show permission request button when needed
  const showPermissionRequest = permissionState === 'prompt' || (permissionState === 'denied' && deviceCount === 0);

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

      {/* This component handles auto-selection logic */}
      <DeviceAutoSelection
        deviceList={deviceList}
        selectedDeviceId={selectedDeviceId}
        onDeviceSelect={onDeviceSelect}
        hasAttemptedSelection={hasAttemptedSelection}
        setHasAttemptedSelection={setHasAttemptedSelection}
      />

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
