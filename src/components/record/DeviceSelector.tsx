
import React, { useState, useEffect, useRef } from "react";
import { Select } from "@/components/ui/select";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { DeviceSelectorLabel } from "./DeviceSelectorLabel";
import { DeviceDebugInfo } from "./DeviceDebugInfo";
import { formatDeviceLabel } from "./utils/deviceFormatters";
import { DeviceSelectTrigger } from "./device/DeviceSelectTrigger";
import { DeviceSelectContent } from "./device/DeviceSelectContent";
import { RefreshDevicesButton } from "./device/RefreshDevicesButton";
import { NoDevicesMessage } from "./device/NoDevicesMessage";

interface DeviceSelectorProps {
  devices?: MediaDeviceInfo[];
  audioDevices?: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isReady?: boolean;
  disabled?: boolean;
  hasDevices?: boolean;
  onRefreshDevices?: () => void;
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
}: DeviceSelectorProps) {
  // Use audioDevices if provided, otherwise fall back to devices
  const deviceList = audioDevices || devices || [];
  
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [hasAttemptedSelection, setHasAttemptedSelection] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    hasDevices: boolean;
    deviceCount: number;
    selectedDevice: string | null;
    permissionRequested: boolean;
  }>({
    hasDevices: Array.isArray(deviceList) && deviceList.length > 0,
    deviceCount: Array.isArray(deviceList) ? deviceList.length : 0,
    selectedDevice: null,
    permissionRequested: false
  });

  // Calculate if select should be disabled
  const isSelectDisabled = disabled || !Array.isArray(deviceList) || deviceList.length === 0;
  
  // Track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check permissions and handle errors gracefully
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions) {
          console.log('Permissions API not available');
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (isMounted.current) {
          setPermissionStatus(result.state);
        }
        
        result.addEventListener('change', () => {
          if (isMounted.current) {
            setPermissionStatus(result.state);
            // Refresh devices when permissions change
            if (result.state === 'granted' && onRefreshDevices) {
              onRefreshDevices();
            }
          }
        });
      } catch (error) {
        console.error('[DeviceSelector] Error checking permissions:', error);
      }
    };
    
    checkPermissions();
  }, [onRefreshDevices]);

  // Auto-select a device when devices become available (once only)
  useEffect(() => {
    if (Array.isArray(deviceList) && deviceList.length > 0 && !hasAttemptedSelection) {
      setHasAttemptedSelection(true);
      
      // Only auto-select if no device is already selected
      if (!selectedDeviceId) {
        const firstDevice = deviceList[0];
        if (firstDevice && typeof firstDevice === 'object') {
          const deviceId = firstDevice.deviceId || '';
          if (deviceId) {
            console.log('[DeviceSelector] Auto-selecting first device:', deviceId);
            onDeviceSelect(deviceId);
          }
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, hasAttemptedSelection]);

  // Update debug info when devices change
  useEffect(() => {
    if (isMounted.current && Array.isArray(deviceList)) {
      console.log('[DeviceSelector] Device list updated:', deviceList.length, 'devices');
      
      // Update the debug info
      setDebugInfo(prev => ({
        ...prev,
        hasDevices: deviceList.length > 0,
        deviceCount: deviceList.length,
        selectedDevice: selectedDeviceId
      }));
    }
  }, [deviceList, selectedDeviceId]);

  const handleDeviceChange = (value: string) => {
    if (value && value !== selectedDeviceId) {
      console.log('[DeviceSelector] Device selected by user:', value);
      onDeviceSelect(value);
    }
  };

  // Safely get device count
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;

  // Find the selected device name for display
  let selectedDeviceName = "Select a microphone";
  
  if (selectedDeviceId && deviceList.length > 0) {
    const selectedDevice = deviceList.find(d => d && d.deviceId === selectedDeviceId);
    if (selectedDevice) {
      selectedDeviceName = formatDeviceLabel(selectedDevice as MediaDeviceInfo, 0);
    }
  }
  
  // Determine if we should show a warning about no devices
  const showNoDevicesWarning = deviceCount === 0 && isReady;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <DeviceSelectorLabel permissionStatus={permissionStatus} />
        <RefreshDevicesButton onRefreshDevices={onRefreshDevices} />
      </div>

      <Select
        value={selectedDeviceId || ""}
        onValueChange={handleDeviceChange}
        disabled={isSelectDisabled}
      >
        <DeviceSelectTrigger 
          selectedDeviceName={selectedDeviceName}
          isDisabled={isSelectDisabled}
        />
        <DeviceSelectContent deviceList={deviceList} />
      </Select>
      
      <NoDevicesMessage showWarning={showNoDevicesWarning} />
      
      <DeviceDebugInfo 
        deviceCount={deviceCount} 
        selectedDeviceId={selectedDeviceId} 
      />
    </div>
  );
}
