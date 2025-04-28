
import { test, expect } from '@playwright/test';

// Mock MediaRecorder
class MockMediaRecorder {
  static supported = true;
  stream: MediaStream;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: any) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  mimeType = '';

  constructor(stream: MediaStream) {
    this.stream = stream;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob([], { type: 'audio/webm' }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob([], { type: 'audio/webm' }) });
    }
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

test('AudioRecorder can record and transcribe', async ({ page }) => {
  // Mock MediaRecorder, getUserMedia, and fetch
  await page.addInitScript(() => {
    // Mock MediaRecorder
    window.MediaRecorder = MockMediaRecorder as any;
    
    // Mock navigator.mediaDevices.getUserMedia
    navigator.mediaDevices.getUserMedia = async () => {
      const tracks = [
        new MediaStreamTrack(),
        new MediaStreamTrack()
      ];
      return new MediaStream(tracks);
    };
    
    // Mock navigator.mediaDevices.enumerateDevices
    navigator.mediaDevices.enumerateDevices = async () => {
      return [
        {
          deviceId: 'default',
          kind: 'audioinput',
          label: 'Default Microphone',
          groupId: 'default'
        }
      ];
    };
    
    // Mock fetch for transcription
    window.fetch = async (url, options) => {
      return {
        ok: true,
        status: 201,
        json: async () => ({ 
          noteId: 'test-note-id',
          recordingId: 'test-recording-id'
        })
      } as Response;
    };
    
    // Mock URL.createObjectURL
    URL.createObjectURL = () => 'mock://audio-url';
    URL.revokeObjectURL = () => {};
  });

  // Navigate to the audio recorder page
  await page.goto('/audio-recorder');
  
  // Wait for the page to load
  await page.waitForSelector('canvas');
  
  // Check that the record button is visible
  const recordButton = page.locator('button:has(.lucide-mic)');
  await expect(recordButton).toBeVisible();
  
  // Click the record button to start recording
  await recordButton.click();
  
  // Check that the status changes to recording
  await expect(page.getByText('Recording...')).toBeVisible();
  
  // Wait for 2 seconds of "recording"
  await page.waitForTimeout(2000);
  
  // Click the stop button
  const stopButton = page.locator('button:has(.lucide-stop-circle)');
  await expect(stopButton).toBeVisible();
  await stopButton.click();
  
  // Check that the transcribe button appears
  const transcribeButton = page.getByText('Transcribe');
  await expect(transcribeButton).toBeVisible();
  
  // Click the transcribe button
  await transcribeButton.click();
  
  // Check that the upload dialog appears
  await expect(page.getByText('Seu registro está sendo carregado na nuvem. Aguarde...')).toBeVisible();
  
  // Wait for navigation (should redirect to note)
  await page.waitForURL('**/notes/test-note-id');
  
  // Should be on the note page
  expect(page.url()).toContain('/notes/test-note-id');
});
