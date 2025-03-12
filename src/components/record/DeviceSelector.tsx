
import React, { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { toast } from "sonner";
import { DeviceSelectorLabel } from "./DeviceSelectorLabel";
import { DeviceDebugInfo } from "./DeviceDebugInfo";
import { formatDeviceLabel } from "./utils/deviceFormatters";

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
  const autoSelectAttemptedRef = useRef(false);
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

  // Safely select default device if available - only once
  useEffect(() => {
    if (Array.isArray(deviceList) && deviceList.length > 0 && !selectedDeviceId && !disabled && !autoSelectAttemptedRef.current) {
      autoSelectAttemptedRef.current = true;
      const firstDevice = deviceList[0];
      if (firstDevice && typeof firstDevice === 'object') {
        const deviceId = firstDevice.deviceId || '';
        if (deviceId) {
          console.log('[DeviceSelector] Auto-selecting first device:', deviceId, 
            'label', firstDevice.label || ('displayName' in firstDevice ? firstDevice.displayName : 'No label'));
          onDeviceSelect(deviceId);
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
    if (value && value !== selectedDeviceId) {
      console.log('[DeviceSelector] Device selected by user:', value);
      onDeviceSelect(value);
    }
  };

  // Safely get device count
  const deviceCount = Array.isArray(deviceList) ? deviceList.length : 0;

  // Find the selected device name for display
  const selectedDeviceName = selectedDeviceId && deviceList.length > 0 ? 
    deviceList.find(d => d && d.deviceId === selectedDeviceId) ?
      formatDeviceLabel(deviceList.find(d => d && d.deviceId === selectedDeviceId) as MediaDeviceInfo, 0) :
      "Select a microphone" :
    "Select a microphone";

  return (
    <div className="space-y-2">
      <DeviceSelectorLabel permissionStatus={permissionStatus} />

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
      
      <DeviceDebugInfo 
        deviceCount={deviceCount} 
        selectedDeviceId={selectedDeviceId} 
      />
    </div>
  );
}
