
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function DebugMicList() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>("unknown");

  useEffect(() => {
    // Verificar permissão primeiro
    async function checkPermissionAndGetDevices() {
      try {
        console.log("DebugMicList: Verificando permissão do microfone...");
        
        // Verifica estado atual da permissão
        const permission = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setPermissionState(permission.state);
        console.log("DebugMicList: Estado da permissão:", permission.state);
        
        // Se a permissão for negada, não tenta obter dispositivos
        if (permission.state === "denied") {
          setError("Permissão de microfone negada");
          return;
        }
        
        // Se estiver no estado prompt, solicita acesso explicitamente
        if (permission.state === "prompt") {
          console.log("DebugMicList: Solicitando acesso ao microfone...");
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
        }
        
        // Agora enumera os dispositivos
        console.log("DebugMicList: Enumerando dispositivos...");
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = allDevices.filter(d => d.kind === "audioinput");
        
        console.log("DebugMicList: Microfones encontrados:", audioInputs);
        setDevices(audioInputs);
      } catch (err) {
        console.error("DebugMicList error:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      }
    }
    
    checkPermissionAndGetDevices();
    
    // Configurar listener para mudanças de dispositivo
    const handleDeviceChange = () => {
      console.log("DebugMicList: Mudança de dispositivo detectada!");
      navigator.mediaDevices.enumerateDevices()
        .then((allDevices) => {
          const audioInputs = allDevices.filter(d => d.kind === "audioinput");
          setDevices(audioInputs);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
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
          <span className="font-medium">Estado da permissão:</span>{" "}
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
          <span className="font-medium">Total de microfones:</span> {devices.length}
        </div>
        
        {devices.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices.map((device) => (
                  <tr key={device.deviceId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-xs text-gray-500 font-mono truncate max-w-[120px]">
                      {device.deviceId.substring(0, 10)}...
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {device.label || "Sem nome"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
            Nenhum microfone encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
