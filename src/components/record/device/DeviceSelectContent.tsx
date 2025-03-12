
import React from "react";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { AudioDevice } from "@/hooks/recording/capture/types";
import { formatDeviceLabel } from "../utils/deviceFormatters";
import { Loader2 } from "lucide-react";

interface DeviceSelectContentProps {
  deviceList: (AudioDevice | MediaDeviceInfo)[];
  isLoading?: boolean;
}

export function DeviceSelectContent({ 
  deviceList,
  isLoading = false
}: DeviceSelectContentProps) {
  const hasDevices = Array.isArray(deviceList) && deviceList.length > 0;
  
  return (
    <SelectContent className="max-h-[200px] overflow-y-auto bg-white">
      {isLoading ? (
        <div className="py-6 flex flex-col items-center justify-center text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mb-2" />
          <span>Detecting microphones...</span>
        </div>
      ) : !hasDevices ? (
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
  );
}
