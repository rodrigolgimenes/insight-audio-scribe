
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Create a proper MediaRecorder mock
const MockMediaRecorder = vi.fn(() => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive'
})) as unknown as {
  new (stream: MediaStream, options?: MediaRecorderOptions): MediaRecorder;
  prototype: MediaRecorder;
  isTypeSupported(type: string): boolean;
};

MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

// Assign the mock to global MediaRecorder
global.MediaRecorder = MockMediaRecorder;

// Mock Web Audio API
class AudioContextMock {
  createMediaStreamSource = vi.fn().mockReturnValue({
    connect: vi.fn()
  });
  createAnalyser = vi.fn().mockReturnValue({
    connect: vi.fn(),
    disconnect: vi.fn(),
    getByteFrequencyData: vi.fn()
  });
}

global.AudioContext = vi.fn().mockImplementation(() => new AudioContextMock());

// Mock URL methods
global.URL.createObjectURL = vi.fn();
global.URL.revokeObjectURL = vi.fn();

// Create a MediaDevices mock
const mockMediaDevices = {
  getUserMedia: vi.fn().mockResolvedValue({}),
  enumerateDevices: vi.fn().mockResolvedValue([])
};

// Mock navigator.mediaDevices using Object.defineProperty
Object.defineProperty(navigator, 'mediaDevices', {
  get: () => mockMediaDevices,
  configurable: true
});
