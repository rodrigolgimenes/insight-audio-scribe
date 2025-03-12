
import { MicrophoneSelector as UnifiedMicrophoneSelector } from "@/components/device/MicrophoneSelector";

// This is a compatibility wrapper to maintain existing imports
export function MicrophoneSelector(props: { disabled?: boolean; className?: string }) {
  return <UnifiedMicrophoneSelector {...props} />;
}
