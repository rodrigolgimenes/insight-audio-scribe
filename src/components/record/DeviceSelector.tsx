
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
import { Button } from "@/components/ui/button";
import { MicrophoneIcon, RefreshCw, AlertTriangle } from "lucide-react";
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
  // Use audioDevices if provided, otherwise fall back to devices
  const deviceList = audioDevices || devices || [];
  
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [hasAttemptedSelection, setHasAttemptedSelection] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
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

  // Calculate if select should be disabled - now more granular
  const isSelectDisabled = 
    disabled || 
    permissionState === 'denied' || 
    (deviceList.length === 0 && !devicesLoading); // Allow interaction during loading
  
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

  const handleRequestPermission = async () => {
    if (!onRefreshDevices || isRequesting) return;
    
    setIsRequesting(true);
    try {
      await onRefreshDevices();
    } finally {
      if (isMounted.current) {
        setIsRequesting(false);
      }
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

      {showPermissionRequest ? (
        <Button 
          onClick={handleRequestPermission}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isRequesting}
        >
          <MicrophoneIcon className="h-4 w-4" />
          {isRequesting ? 'Requesting access...' : 'Allow microphone access'}
          {isRequesting && <RefreshCw className="h-4 w-4 animate-spin" />}
        </Button>
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
      
      {permissionState === 'denied' && (
        <div className="text-red-500 text-xs mt-1 flex items-start gap-1">
          <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            Microphone access denied. Please allow access in your browser settings and refresh the page.
          </span>
        </div>
      )}
      
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
