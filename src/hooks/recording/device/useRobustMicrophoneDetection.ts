
import { useStableMicrophoneDetection } from './useStableMicrophoneDetection';

/**
 * Legacy hook that now uses our more stable implementation underneath
 * This maintains backward compatibility with existing components
 */
export function useRobustMicrophoneDetection() {
  // Use our new stable implementation
  return useStableMicrophoneDetection();
}
