
import React from "react";
import { MicrophoneSelector } from "@/components/device/MicrophoneSelector";

export function DebugMicrophonePanel() {
  return (
    <div className="p-3 border rounded space-y-2">
      <h3 className="text-sm font-medium">Record Audio</h3>
      <MicrophoneSelector />
    </div>
  );
}
