
import React from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDevicesMessageProps {
  showWarning: boolean;
  onRefresh?: () => void;
}

export function NoDevicesMessage({ 
  showWarning,
  onRefresh 
}: NoDevicesMessageProps) {
  if (!showWarning) return null;
  
  return (
    <div className="flex flex-col items-center p-3 bg-amber-50 border border-amber-200 rounded-md mt-2">
      <Mic className="h-10 w-10 text-amber-500 mb-2" />
      <h3 className="text-sm font-medium text-amber-700">No microphones detected</h3>
      <p className="text-xs text-amber-600 text-center mt-1 mb-3">
        This could be because:
        <ul className="list-disc pl-5 mt-1 text-left">
          <li>No microphone is connected</li>
          <li>Your microphone isn't recognized by the browser</li>
          <li>Your browser needs to be refreshed</li>
        </ul>
      </p>
      
      {onRefresh && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh}
          className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          Scan for Microphones
        </Button>
      )}
    </div>
  );
}
