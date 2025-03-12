
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
  // Track selection changes for debugging
  const [lastManualSelection, setLastManualSelection] = useState<string | null>(null);
  const [selectionTime, setSelectionTime] = useState(0);
  
  // Use our hook for device selection logic
  const {
    hasAttemptedSelection,
    setHasAttemptedSelection,
    isRequesting,
    permissionStatus,
    handleRequestPermission
  } = useDeviceSelection(onRefreshDevices, permissionState);
  
  // Use audioDevices if provided, otherwise use devices
  const deviceList = audioDevices || devices || [];
  
  // Log detailed device list on mount and when it changes
  useEffect(() => {
    console.log('[DeviceSelector] Device list updated:', {
      deviceCount: deviceList.length,
      devices: deviceList.map(d => ({
        id: d.deviceId,
        label: d.label || 'No label'
      }))
    });
  }, [deviceList]);
  
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
    const deviceExists = deviceList.some(d => d && d.deviceId === value);
    if (!deviceExists) {
      console.error('[DeviceSelector] Selected device not in device list!', {
        selectedValue: value,
        availableDevices: deviceList.map(d => d.deviceId)
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
    if (deviceList.length > 0 && selectedDeviceId) {
      const deviceExists = deviceList.some(d => d && d.deviceId === selectedDeviceId);
      
      if (!deviceExists) {
        console.warn('[DeviceSelector] Selected device no longer exists in list:', {
          selectedDeviceId,
          availableDevices: deviceList.map(d => d.deviceId)
        });
        
        // Only auto-select if no manual selection was made recently
        const now = Date.now();
        const elapsed = now - selectionTime;
        
        if (elapsed > 3000) { // Only override if last manual selection was more than 3 seconds ago
          const firstDeviceId = deviceList[0].deviceId;
          console.log('[DeviceSelector] Auto-selecting first available device:', firstDeviceId);
          onDeviceSelect(firstDeviceId);
        }
      }
    }
  }, [deviceList, selectedDeviceId, selectionTime, onDeviceSelect]);

  // Use our hook for auto-refresh
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;
  useDeviceAutoRefresh(deviceCount, devicesLoading, onRefreshDevices);
  
  // Debug info
  const debugInfo = {
    hasDevices: Array.isArray(deviceList) && deviceList.length > 0,
    deviceCount,
    selectedDevice: selectedDeviceId,
    permissionRequested: !!permissionStatus
  };

  // Calculate if select should be disabled
  const isSelectDisabled = 
    disabled || 
    permissionState === 'denied' || 
    (deviceList.length === 0 && !devicesLoading); // Allow interaction during loading

  // Find selected device name for display
  let selectedDeviceName = "Select a microphone";
  
  if (selectedDeviceId && deviceList.length > 0) {
    const selectedDevice = deviceList.find(d => d && d.deviceId === selectedDeviceId);
    if (selectedDevice) {
      selectedDeviceName = formatDeviceLabel(selectedDevice as MediaDeviceInfo, 0);
    } else {
      console.warn('[DeviceSelector] Selected device not found in device list:', {
        selectedDeviceId,
        availableDevices: deviceList.map(d => d && d.deviceId)
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
      toast.info("Refreshing device list...", {
        id: "force-refresh",
        duration: 2000
      });
      onRefreshDevices();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DeviceSelectorLabel 
          permissionStatus={permissionState === 'unknown' ? permissionStatus : permissionState} 
        />
        <RefreshDevicesButton 
          onRefreshDevices={handleForceRefresh} 
          isLoading={devicesLoading || isRequesting}
        />
      </div>

      {/* Auto-selection logic - only show when permission granted */}
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
