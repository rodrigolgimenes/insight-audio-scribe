
import { RecordingEvent, RecordingObserver } from './types';

export class RecordingLogger implements RecordingObserver {
  update(event: RecordingEvent): void {
    switch (event.type) {
      case 'start':
        console.log('[RecordingLogger] Recording started');
        break;
      case 'stop':
        console.log('[RecordingLogger] Recording stopped:', event.data?.stats);
        break;
      case 'pause':
        console.log('[RecordingLogger] Recording paused');
        break;
      case 'resume':
        console.log('[RecordingLogger] Recording resumed');
        break;
      case 'dataAvailable':
        console.log('[RecordingLogger] Data chunk received:', {
          size: event.data?.chunk?.size,
          type: event.data?.chunk?.type
        });
        break;
      case 'error':
        console.error('[RecordingLogger] Recording error:', event.data?.error);
        break;
    }
  }
}
