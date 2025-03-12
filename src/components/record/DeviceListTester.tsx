
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function DeviceListTester() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | "unknown">("unknown");

  const requestDevices = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[DeviceListTester] Checking microphone permission...");
      // Primeiro, checamos a permissão
      const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
      console.log("[DeviceListTester] Permission state:", permission.state);
      setPermissionState(permission.state);
      
      if (permission.state === "denied") {
        setError("Microphone access denied. Please allow access in your browser settings.");
        toast.error("Microphone access denied", {
          description: "Please allow access in your browser settings"
        });
        setIsLoading(false);
        return;
      }
      
      // Se a permissão não for concedida, solicite-a
      if (permission.state === "prompt") {
        console.log("[DeviceListTester] Requesting microphone access...");
        
        // Solicitar acesso ao microfone para obter labels
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Esperar um pouco para que o navegador atualize a lista de dispositivos
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Fecha a stream temporária depois de obter acesso
        tempStream.getTracks().forEach(track => track.stop());
        
        // Atualizar o estado da permissão
        const updatedPermission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setPermissionState(updatedPermission.state);
      }
      
      // Agora podemos enumerar os dispositivos
      console.log("[DeviceListTester] Enumerating devices...");
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter(device => device.kind === "audioinput");
      
      console.log("[DeviceListTester] Found audio devices:", audioInputs);
      setDevices(audioInputs);
      
      if (audioInputs.length === 0) {
        setError("No microphones found. Please check your connections.");
        toast.warning("No microphones found", {
          description: "Please check your connections"
        });
      } else {
        toast.success(`Found ${audioInputs.length} microphone(s)`, {
          description: "Microphones listed successfully"
        });
      }
    } catch (err) {
      console.error("[DeviceListTester] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error accessing microphone");
      toast.error("Error accessing microphone", {
        description: err instanceof Error ? err.message : "Unknown error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listar dispositivos na montagem do componente
  useEffect(() => {
    requestDevices();
  }, []);

  return (
    <div className="p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Device List Tester</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={requestDevices} 
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Devices
        </Button>
      </div>
      
      {error && (
        <div className="text-red-500 mb-3 p-2 bg-red-50 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div className="mb-2 text-sm">
        <span className="font-medium">Permission Status:</span>{" "}
        <span className={`
          ${permissionState === "granted" ? "text-green-500 font-medium" : ""}
          ${permissionState === "denied" ? "text-red-500 font-medium" : ""}
          ${permissionState === "prompt" ? "text-amber-500 font-medium" : ""}
        `}>
          {permissionState}
        </span>
      </div>
      
      <div className="text-sm mb-2">
        <span className="font-medium">Found:</span> {devices.length} microphone(s)
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600">Detecting microphones...</span>
        </div>
      ) : devices.length > 0 ? (
        <div className="max-h-60 overflow-y-auto border rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {devices.map((device, index) => (
                <tr key={device.deviceId || index} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-500 font-mono truncate max-w-[120px]">
                    {device.deviceId.substring(0, 10)}...
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {device.label || `Microphone ${index + 1}`}
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
    </div>
  );
}
