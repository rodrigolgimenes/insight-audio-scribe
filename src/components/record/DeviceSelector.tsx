
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Mic, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";

interface DeviceSelectorProps {
  devices?: MediaDeviceInfo[];
  audioDevices?: AudioDevice[];
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  isReady?: boolean;
  disabled?: boolean;
  hasDevices?: boolean;
}

export function DeviceSelector({
  devices = [],
  audioDevices,
  selectedDeviceId,
  onDeviceSelect,
  isReady = true,
  disabled = false,
  hasDevices = true,
}: DeviceSelectorProps) {
  // Use audioDevices if provided, otherwise fall back to devices
  const deviceList = audioDevices || devices || [];
  
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
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

  const isSelectDisabled = disabled || !Array.isArray(deviceList) || deviceList.length === 0;

  // Check permissions and handle errors gracefully
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions) {
          console.log('Permissions API not available');
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermissionStatus(result.state);
        
        result.addEventListener('change', () => {
          setPermissionStatus(result.state);
        });
      } catch (error) {
        console.error('[DeviceSelector] Error checking permissions:', error);
      }
    };
    
    checkPermissions();
  }, []);

  // Safely select default device if available
  useEffect(() => {
    if (Array.isArray(deviceList) && deviceList.length > 0 && !selectedDeviceId && !disabled) {
      const firstDevice = deviceList[0];
      if (firstDevice && typeof firstDevice === 'object') {
        const deviceId = firstDevice.deviceId || '';
        if (deviceId) {
          console.log('[DeviceSelector] Auto-selecting first device:', deviceId, 
            'label', firstDevice.label || ('displayName' in firstDevice ? firstDevice.displayName : 'No label'));
          onDeviceSelect(deviceId);
          toast.success("Microphone auto-selected");
        }
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, disabled]);

  // Update debug info when devices change
  useEffect(() => {
    if (Array.isArray(deviceList)) {
      console.log('[DeviceSelector] Device list updated:', deviceList.length, 'devices');
      deviceList.forEach((device, i) => {
        if (device) {
          const label = 'displayName' in device 
            ? device.displayName 
            : (device.label || `Microphone ${i+1}`);
          console.log(`[DeviceSelector] Device ${i}:`, device.deviceId, label);
        }
      });
      
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
    if (value) {
      console.log('[DeviceSelector] Device selected by user:', value);
      onDeviceSelect(value);
      // Add a delay to ensure the state is updated
      setTimeout(() => {
        toast.success("Microphone selected");
      }, 100);
    }
  };

  // Safely get device count
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;

  // Format device label to be more readable
  const formatDeviceLabel = (device: MediaDeviceInfo | AudioDevice, index: number): string => {
    if (!device) return `Microphone ${index + 1}`;
    
    // Check if label is available and not empty
    if (device.label && device.label.trim() !== '') {
      return device.label;
    }
    
    // If AudioDevice, check displayName
    if ('displayName' in device && device.displayName && device.displayName.trim() !== '') {
      return device.displayName;
    }
    
    // Fall back to a numbered microphone if no label is available
    return `Microphone ${index + 1}`;
  };

  // Find the selected device name for display
  const selectedDeviceName = selectedDeviceId ? 
    deviceList.find(d => d && d.deviceId === selectedDeviceId) ?
      formatDeviceLabel(deviceList.find(d => d && d.deviceId === selectedDeviceId) as MediaDeviceInfo, 0) :
      "Select a microphone" :
    "Select a microphone";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium flex items-center gap-1">
          <Mic className="h-4 w-4" />
          Audio device
        </label>
        
        <div className="flex items-center">
          {permissionStatus === 'granted' ? (
            <div className="text-xs text-green-500 flex items-center">
              <Check className="h-3 w-3 mr-1" />
              Allowed
            </div>
          ) : permissionStatus === 'denied' ? (
            <div className="text-xs text-red-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Blocked
            </div>
          ) : permissionStatus === 'prompt' ? (
            <div className="text-xs text-amber-500 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Waiting for permission
            </div>
          ) : null}
        </div>
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
        <SelectContent>
          {!Array.isArray(deviceList) || deviceList.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              No microphones found
            </SelectItem>
          ) : (
            deviceList.map((device, index) => {
              // Comprehensive safety check for the device object
              if (!device || typeof device !== 'object') {
                return (
                  <SelectItem key={`unknown-device-${index}`} value={`unknown-${index}`}>
                    Unknown device
                  </SelectItem>
                );
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
      
      <div className="text-xs text-gray-500 mt-1">
        <div>Devices: {deviceCount} found</div>
        {selectedDeviceId && (
          <div className="truncate max-w-full">
            Selected ID: {selectedDeviceId.substring(0, 10)}...
          </div>
        )}
      </div>
    </div>
  );
}
