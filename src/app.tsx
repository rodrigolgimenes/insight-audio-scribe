import React from "react";
import { FilteredToast } from "@/components/toast/FilteredToast";
import { AudioDeviceProvider } from "@/context/AudioDeviceContext";
import { DeviceManagerProvider } from "@/context/DeviceManagerContext";
import { Toaster } from "@/components/ui/toaster";
import SimpleRecord from "@/pages/SimpleRecord";

export function App() {
  return (
    <>
      <DeviceManagerProvider>
        <AudioDeviceProvider>
          <SimpleRecord />
        </AudioDeviceProvider>
      </DeviceManagerProvider>
      
      {/* Substitua o Toaster original pelo FilteredToast */}
      <FilteredToast />
      
    </>
  );
}
