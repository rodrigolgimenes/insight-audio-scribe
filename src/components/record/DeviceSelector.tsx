
import React, { useEffect, useState } from "react";
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
import { toast } from "sonner";

interface DeviceSelectorProps {
  audioDevices: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isReady?: boolean;
  disabled?: boolean;
  onRefreshDevices?: () => void;
  devicesLoading?: boolean;
  permissionState?: 'prompt'|'granted'|'denied'|'unknown';
}

export function DeviceSelector({
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isReady = true,
  disabled = false,
  onRefreshDevices,
  devicesLoading = false,
  permissionState = 'unknown',
}: DeviceSelectorProps) {
  // Track selection changes for debugging
  const [lastManualSelection, setLastManualSelection] = useState<string | null>(null);
  const [selectionTime, setSelectionTime] = useState(0);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  
  // Use our hook for device selection logic
  const {
    hasAttemptedSelection,
    setHasAttemptedSelection,
    isRequesting,
    permissionStatus,
    handleRequestPermission
  } = useDeviceSelection(onRefreshDevices, permissionState);
  
  // Calculate device count safely
  const deviceCount = Array.isArray(audioDevices) ? audioDevices.length : 0;
  
  // CRITICALLY IMPORTANT: Log detailed device information on EVERY render
  console.log('[DeviceSelector RENDER]', {
    compName: 'DeviceSelector',
    deviceCount: deviceCount,
    permissionState,
    permissionStatus,
    isReady,
    devicesLoading,
    selectedDeviceId,
    devices: Array.isArray(audioDevices) ? audioDevices.map(d => ({
      id: d.deviceId,
      label: d.label || 'No label'
    })) : 'Invalid device list',
    timestamp: new Date().toISOString()
  });
  
  // Log detailed device list on mount and when it changes
  useEffect(() => {
    console.log('[DeviceSelector] Device list updated:', {
      compName: 'DeviceSelector',
      deviceCount: deviceCount,
      permissionState,
      localPermissionStatus: permissionStatus,
      devices: Array.isArray(audioDevices) ? audioDevices.map(d => ({
        id: d.deviceId,
        label: d.label || 'No label'
      })) : 'Invalid device list',
      timestamp: new Date().toISOString()
    });
    
    // Force a re-render whenever device list changes
    setForceRenderKey(prev => prev + 1);
    
    // Show toast when devices change
    if (deviceCount > 0) {
      toast.success(`Found ${deviceCount} microphone(s)`, {
        id: "device-list-updated",
        duration: 3000
      });
    }
  }, [audioDevices, permissionState, permissionStatus, deviceCount]);
  
  // Improved device change handler with validation and debugging
  const handleDeviceChange = (value: string) => {
    if (!value) {
      console.warn('[DeviceSelector] Empty device ID received, ignoring selection');
      return;
    }
    
    console.log('[DeviceSelector] Manual device selection:', {
      newDevice: value,
      previousSelection: selectedDeviceId,
      lastManualSelection,
      time: new Date().toISOString()
    });
    
    // Validate device exists in list
    const deviceExists = Array.isArray(audioDevices) && audioDevices.some(d => d && d.deviceId === value);
    if (!deviceExists) {
      console.error('[DeviceSelector] Selected device not in device list!', {
        selectedValue: value,
        availableDevices: Array.isArray(audioDevices) ? audioDevices.map(d => d.deviceId) : 'No devices'
      });
      
      toast.error("Device selection error", {
        description: "The selected device was not found in the available devices list",
        id: "device-selection-error"
      });
      return;
    }
    
    // Track manual selection
    setLastManualSelection(value);
    setSelectionTime(Date.now());
    
    // Mark that a selection was made to prevent auto-selection override
    setHasAttemptedSelection(true);
    
    // Call the provided callback to update parent component
    onDeviceSelect(value);
    
    // Log that the selection was dispatched
    console.log('[DeviceSelector] Device selection dispatched');
    
    // Check after a timeout if the selection was applied
    setTimeout(() => {
      console.log('[DeviceSelector] Selection verification check:', {
        expected: value,
        actual: selectedDeviceId,
        selectionApplied: value === selectedDeviceId
      });
      
      if (value !== selectedDeviceId) {
        console.warn('[DeviceSelector] Selection not applied!');
      }
    }, 300);
  };

  // If selected device is not in the list but we have devices, select the first one
  useEffect(() => {
    if (deviceCount > 0 && selectedDeviceId) {
      const deviceExists = audioDevices.some(d => d && d.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[DeviceSelector] Selected device no longer exists in list:', {
          selectedDeviceId,
          availableDevices: audioDevices.map(d => d.deviceId)
        });
        
        // Only auto-select if no manual selection was made recently
        const now = Date.now();
        const elapsed = now - selectionTime;
        
        if (elapsed > 3000) { // Only override if last manual selection was more than 3 seconds ago
          const firstDeviceId = audioDevices[0].deviceId;
          console.log('[DeviceSelector] Auto-selecting first available device:', firstDeviceId);
          onDeviceSelect(firstDeviceId);
        }
      }
    }
  }, [audioDevices, selectedDeviceId, selectionTime, onDeviceSelect, deviceCount]);

  // Use our hook for auto-refresh
  useDeviceAutoRefresh(deviceCount, devicesLoading, onRefreshDevices);
  
  // Debug info
  const debugInfo = {
    hasDevices: deviceCount > 0,
    deviceCount,
    selectedDevice: selectedDeviceId,
    permissionRequested: !!permissionStatus
  };

  // Calculate if select should be disabled
  const isSelectDisabled = 
    disabled || 
    permissionState === 'denied' || 
    (deviceCount === 0 && !devicesLoading); // Allow interaction during loading

  // Find selected device name for display
  let selectedDeviceName = "Select a microphone";
  
  if (selectedDeviceId && deviceCount > 0) {
    const selectedDevice = audioDevices.find(d => d && d.deviceId === selectedDeviceId);
    if (selectedDevice) {
      selectedDeviceName = formatDeviceLabel(selectedDevice, 0);
    } else {
      console.warn('[DeviceSelector] Selected device not found in device list:', {
        selectedDeviceId,
        availableDevices: audioDevices.map(d => d && d.deviceId)
      });
    }
  }
  
  // Determine if we should show warnings or info
  const showNoDevicesWarning = deviceCount === 0 && isReady && !devicesLoading && permissionState !== 'denied';
  const showPermissionRequest = permissionState === 'prompt' || (permissionState === 'denied' && deviceCount === 0);
  const showAutoSelection = permissionState === 'granted' && deviceCount > 0;

  // Handle force refresh
  const handleForceRefresh = () => {
    if (onRefreshDevices) {
      console.log('[DeviceSelector] Force refreshing devices');
      onRefreshDevices();
    }
  };

  return (
    <div className="space-y-2" key={forceRenderKey}>
      <div className="flex items-center justify-between">
        <DeviceSelectorLabel 
          permissionStatus={permissionState === 'unknown' ? permissionStatus : permissionState} 
        />
        <RefreshDevicesButton 
          onRefreshDevices={handleForceRefresh} 
          isLoading={devicesLoading || isRequesting}
          deviceCount={deviceCount}
        />
      </div>
      
      {/* Source debugging info - CRITICAL */}
      <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
        <div><strong>Devices:</strong> {deviceCount} found | <strong>Permission:</strong> {permissionState} | <strong>Local Permission:</strong> {permissionStatus}</div>
        <div><strong>Device Selection Ready:</strong> {isReady ? 'Yes' : 'No'} | <strong>Loading:</strong> {devicesLoading ? 'Yes' : 'No'}</div>
      </div>

      {/* Auto-selection logic - only show when permission granted */}
      {showAutoSelection && (
        <DeviceAutoSelection
          deviceList={audioDevices}
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
          <DeviceSelectContent deviceList={audioDevices} isLoading={devicesLoading} />
        </Select>
      )}
      
      {permissionState === 'denied' && <DevicePermissionError />}
      
      <NoDevicesMessage 
        showWarning={showNoDevicesWarning} 
        onRefresh={onRefreshDevices}
        permissionState={permissionState}
        audioDevices={audioDevices}
      />
      
      <DeviceDebugInfo 
        deviceCount={deviceCount} 
        selectedDeviceId={selectedDeviceId} 
        isLoading={devicesLoading}
        permissionState={permissionState}
        showDetails={true}
      />
    </div>
  );
}
