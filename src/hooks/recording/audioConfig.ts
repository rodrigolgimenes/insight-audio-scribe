export const MIC_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 16000 },
    sampleSize: { ideal: 8 }
  },
  video: false
};

export const SYSTEM_AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: { ideal: 16000 },
    sampleSize: { ideal: 8 }
  },
  video: false
};

export const MINIMAL_VIDEO_CONSTRAINTS = {
  audio: {
    sampleRate: { ideal: 16000 },
    sampleSize: { ideal: 8 }
  },
  video: { 
    width: 1,
    height: 1,
    frameRate: 1
  }
};

export const AUDIO_CONTEXT_OPTIONS = {
  latencyHint: 'interactive' as const,
  sampleRate: 16000
};

export const GAIN_VALUES = {
  microphone: 0.7,
  system: 0.5
};
