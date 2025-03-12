
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function DebugMicList() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>("unknown");

  useEffect(() => {
    // Check permission first
    async function checkPermissionAndGetDevices() {
      try {
        console.log("DebugMicList: Checking microphone permission...");
        
        // Check current permission state
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setPermissionState(permission.state);
        console.log("DebugMicList: Permission state:", permission.state);
        
        // If permission is denied, don't attempt to get devices
        if (permission.state === "denied") {
          setError("Microphone permission denied");
          return;
        }
        
        // If in prompt state, explicitly request access
        if (permission.state === "prompt") {
          console.log("DebugMicList: Requesting microphone access...");
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Now enumerate devices
        console.log("DebugMicList: Enumerating devices...");
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(d => d.kind === "audioinput");
        
        console.log("DebugMicList: Microphones found:", audioInputs);
        setDevices(audioInputs);
      } catch (err) {
        console.error("DebugMicList error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }
    
    checkPermissionAndGetDevices();
    
    // Set up device change listener
    const handleDeviceChange = () => {
      console.log("DebugMicList: Device change detected!");
      navigator.mediaDevices.enumerateDevices()
        .then((allDevices) => {
          const audioInputs = allDevices.filter(d => d.kind === "audioinput");
          setDevices(audioInputs);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Unknown error");
        });
    };
    
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, []);

  return (
    <Card className="max-w-md mx-auto my-4">
      <CardContent className="p-4">
        <h2 className="text-lg font-medium mb-2">Debug Mic List</h2>
        
        <div className="text-sm mb-2">
          <span className="font-medium">Permission state:</span>{" "}
          <span className={`
            ${permissionState === "granted" ? "text-green-500 font-medium" : ""}
            ${permissionState === "denied" ? "text-red-500 font-medium" : ""}
            ${permissionState === "prompt" ? "text-amber-500 font-medium" : ""}
          `}>
            {permissionState}
          </span>
        </div>
        
        {error && (
          <div className="text-red-500 mb-2 p-2 bg-red-50 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="text-sm mb-2">
          <span className="font-medium">Total microphones:</span> {devices.length}
        </div>
        
        {devices.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.deviceId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono truncate max-w-[120px]">
                      {device.deviceId.substring(0, 10)}...
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {device.label || "No name"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
            No microphones found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
