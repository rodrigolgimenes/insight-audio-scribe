
import React from "react";
import { SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DeviceSelectTriggerProps {
  selectedDeviceName: string;
  isDisabled: boolean;
}

export function DeviceSelectTrigger({ selectedDeviceName, isDisabled }: DeviceSelectTriggerProps) {
  return (
    <SelectTrigger 
      className={cn(
        "w-full",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <SelectValue placeholder="Select a microphone">
        {selectedDeviceName}
      </SelectValue>
    </SelectTrigger>
  );
}
