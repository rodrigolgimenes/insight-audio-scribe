
import React from "react";
import { SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface DeviceSelectTriggerProps {
  selectedDeviceName: string;
  isDisabled: boolean;
  isLoading?: boolean;
}

export function DeviceSelectTrigger({ 
  selectedDeviceName, 
  isDisabled,
  isLoading = false
}: DeviceSelectTriggerProps) {
  return (
    <SelectTrigger 
      className={cn(
        "w-full",
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <SelectValue placeholder="Select a microphone">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          <span className={isLoading ? "opacity-70" : ""}>
            {selectedDeviceName}
          </span>
        </div>
      </SelectValue>
    </SelectTrigger>
  );
}
