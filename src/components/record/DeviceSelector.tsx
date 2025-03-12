
import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Mic, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AudioDevice } from "@/hooks/recording/capture/types";

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
  // Use audioDevices if provided, otherwise use devices
  const deviceList = audioDevices || devices || [];
  
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    hasDevices: boolean;
    deviceCount: number;
    selectedDevice: string | null;
    permissionRequested: boolean;
  }>({
    hasDevices: deviceList.length > 0,
    deviceCount: deviceList.length,
    selectedDevice: null,
    permissionRequested: false
  });

  const isSelectDisabled = disabled || deviceList.length === 0;

  useEffect(() => {
    const checkPermissions = async () => {
      try {
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

  useEffect(() => {
    if (deviceList.length > 0 && !selectedDeviceId && !disabled) {
      const firstDevice = deviceList[0];
      if (firstDevice && firstDevice.deviceId) {
        onDeviceSelect(firstDevice.deviceId);
      }
    }
  }, [deviceList, selectedDeviceId, onDeviceSelect, disabled]);

  const handleDeviceChange = (value: string) => {
    if (value) {
      onDeviceSelect(value);
    }
  };

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
          <SelectValue placeholder="Select a microphone" />
        </SelectTrigger>
        <SelectContent>
          {deviceList.length === 0 ? (
            <SelectItem value="no-devices" disabled>
              No microphones found
            </SelectItem>
          ) : (
            deviceList.map((device) => (
              <SelectItem 
                key={device.deviceId || 'unknown'} 
                value={device.deviceId || 'unknown'}
              >
                {device.label || `Microphone ${(device.deviceId || 'unknown').substring(0, 5)}...`}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <div className="text-xs text-gray-500 mt-1">
        <div>Devices: {deviceList.length} found</div>
        {selectedDeviceId && (
          <div className="truncate max-w-full">
            Selected ID: {selectedDeviceId.substring(0, 10)}...
          </div>
        )}
      </div>
    </div>
  );
}
