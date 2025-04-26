
// This file is now a proxy to our new DeviceManager system
import React from "react";
import { useDeviceContext, DeviceManagerProvider } from "@/providers/DeviceManagerProvider";

// Re-export the provider component
export { DeviceManagerProvider };

// Export the hook with the same name for backwards compatibility
export function useDeviceManager() {
  return useDeviceContext();
}
