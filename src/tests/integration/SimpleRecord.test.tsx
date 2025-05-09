
import { render, waitFor } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import SimpleRecord from '@/pages/SimpleRecord';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock necessary dependencies
vi.mock('@/hooks/useRecording', () => ({
  useRecording: () => ({
    isRecording: false,
    isPaused: false,
    audioUrl: null,
    mediaStream: null,
    isSaving: false,
    isTranscribing: false,
    isSystemAudio: false,
    handleStartRecording: vi.fn(),
    handleStopRecording: vi.fn(),
    handlePauseRecording: vi.fn(),
    handleResumeRecording: vi.fn(),
    handleDelete: vi.fn(),
    setIsSystemAudio: vi.fn(),
    audioDevices: [
      { deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' }
    ],
    selectedDeviceId: 'default',
    setSelectedDeviceId: vi.fn(),
  }),
}));

describe('SimpleRecord Component Integration', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <SimpleRecord />
      </BrowserRouter>
    );
  });

  it('should render all main components', () => {
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // Device select
    expect(screen.getByRole('switch')).toBeInTheDocument(); // System audio toggle
    expect(screen.getByRole('button', { name: /mic/i })).toBeInTheDocument(); // Record button
  });

  it('should handle device selection', async () => {
    const deviceSelect = screen.getByRole('combobox');
    await userEvent.click(deviceSelect);
    
    const defaultOption = screen.getByText('Default Microphone');
    expect(defaultOption).toBeInTheDocument();
  });

  it('should handle system audio toggle', async () => {
    const systemAudioToggle = screen.getByRole('switch');
    await userEvent.click(systemAudioToggle);
    
    expect(systemAudioToggle).toBeChecked();
  });

  it('should show loading state during processing', async () => {
    // Mock the saving state
    vi.mock('@/hooks/useRecording', () => ({
      useRecording: () => ({
        isRecording: false,
        isSaving: true,
        isTranscribing: false,
        audioUrl: null,
        mediaStream: null,
        isPaused: false,
        handleStartRecording: vi.fn(),
        handleStopRecording: vi.fn(),
        handlePauseRecording: vi.fn(),
        handleResumeRecording: vi.fn(),
        handleDelete: vi.fn(),
        setIsSystemAudio: vi.fn(),
        audioDevices: [
          { deviceId: 'default', label: 'Default Microphone', kind: 'audioinput' }
        ],
        selectedDeviceId: 'default',
        setSelectedDeviceId: vi.fn(),
      }),
    }));

    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });
  });
});
