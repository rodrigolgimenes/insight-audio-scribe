
import { MicrophoneSelector as UnifiedMicrophoneSelector } from "@/components/device/MicrophoneSelector";

// Este é um wrapper de compatibilidade para manter imports existentes
export function MicrophoneSelector(props: { disabled?: boolean; className?: string }) {
  return <UnifiedMicrophoneSelector {...props} />;
}
