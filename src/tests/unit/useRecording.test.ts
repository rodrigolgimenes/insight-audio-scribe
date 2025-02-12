
import { renderHook, act } from '@testing-library/react-hooks';
import { useRecording } from '@/hooks/useRecording';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('useRecording Hook', () => {
  let mockMediaStream: MediaStream;
  let mockMediaRecorder: MediaRecorder;

  beforeEach(() => {
    // Mock MediaStream
    mockMediaStream = {
      getTracks: vi.fn().mockReturnValue([
        { stop: vi.fn() }
      ]),
      getAudioTracks: vi.fn().mockReturnValue([
        { enabled: true, label: 'Mock Audio Track' }
      ])
    } as unknown as MediaStream;

    // Mock MediaRecorder
    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      state: 'inactive',
      ondataavailable: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as unknown as MediaRecorder;

    // Mock navigator.mediaDevices
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          deviceId: 'mock-device-1',
          kind: 'audioinput',
          label: 'Mock Microphone 1'
        }
      ])
    } as unknown as MediaDevices;

    // Mock MediaRecorder global
    global.MediaRecorder = vi.fn().mockImplementation(() => mockMediaRecorder);
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRecording());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.audioUrl).toBeNull();
    expect(result.current.mediaStream).toBeNull();
  });

  it('should start recording when handleStartRecording is called', async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.handleStartRecording();
    });

    expect(result.current.isRecording).toBe(true);
    expect(result.current.mediaStream).toBeTruthy();
    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('should stop recording when handleStopRecording is called', async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.handleStartRecording();
      await result.current.handleStopRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.mediaStream).toBeNull();
  });

  it('should handle pause and resume recording', async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.handleStartRecording();
      result.current.handlePauseRecording();
    });

    expect(result.current.isPaused).toBe(true);

    act(() => {
      result.current.handleResumeRecording();
    });

    expect(result.current.isPaused).toBe(false);
  });

  it('should handle device selection', async () => {
    const { result } = renderHook(() => useRecording());
    const mockDeviceId = 'mock-device-1';

    act(() => {
      result.current.setSelectedDeviceId(mockDeviceId);
    });

    expect(result.current.selectedDeviceId).toBe(mockDeviceId);
  });

  it('should clean up resources on delete', async () => {
    const { result } = renderHook(() => useRecording());

    await act(async () => {
      await result.current.handleStartRecording();
      result.current.handleDelete();
    });

    expect(result.current.isRecording).toBe(false);
    expect(result.current.mediaStream).toBeNull();
    expect(result.current.audioUrl).toBeNull();
  });
});
