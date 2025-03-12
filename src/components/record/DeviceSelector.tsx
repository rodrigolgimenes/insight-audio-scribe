
import React, { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";
import { DeviceSelectorLabel } from "./DeviceSelectorLabel";
import { DeviceDebugInfo } from "./DeviceDebugInfo";
import { formatDeviceLabel } from "./utils/deviceFormatters";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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

  // Handle refresh click
  const handleRefresh = () => {
    if (onRefreshDevices) {
      console.log('[DeviceSelector] Refreshing devices...');
      onRefreshDevices();
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
        
        {onRefreshDevices && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh} 
            className="h-7 px-2"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        )}
      </div>

      <Select
        value={selectedDeviceId || ""}
        onValueChange={handleDeviceChange}
        disabled={isSelectDisabled}
      >
        <SelectTrigger 
          className={cn(
            "w-full",
            isSelectDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <SelectValue placeholder="Select a microphone">
            {selectedDeviceName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
          {!Array.isArray(deviceList) || deviceList.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              No microphones found
            </SelectItem>
          ) : (
            deviceList.map((device, index) => {
              // Comprehensive safety check for the device object
              if (!device || typeof device !== 'object') {
                return null;
              }
              
              // Safely extract deviceId with fallbacks
              const deviceId = device.deviceId || `unknown-${index}`;
              
              // Format the label properly
              const label = formatDeviceLabel(device, index);
              
              return (
                <SelectItem 
                  key={deviceId} 
                  value={deviceId}
                >
                  {label}
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      
      {showNoDevicesWarning && (
        <div className="text-amber-500 text-xs mt-1">
          No microphones detected. Please connect a microphone and refresh.
        </div>
      )}
      
      <DeviceDebugInfo 
        deviceCount={deviceCount} 
        selectedDeviceId={selectedDeviceId} 
      />
    </div>
  );
}
