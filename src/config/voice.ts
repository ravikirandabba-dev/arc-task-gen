/**
 * Configuration for the voice engine tolerances, timeouts, and boundaries.
 */
export const VOICE_CONFIG = {
  vad: {
    // Minimum RMS audio level to be considered speech
    vadThreshold: 0.05,
    // Minimum consecutive ms above threshold to trigger interrupt
    vadMinSpeechMs: 150,
    // Minimum silence before allowing a new detection
    vadCooldownMs: 500,
  },
  interruption: {
    // Delay before resuming conversation after an interrupt
    recoveryDelayMs: 0, // Migrated to event-driven
  },
  testing: {
    // Maximum allowable latency from VAD detect to AudioContext silence
    interruptToSilenceThresholdMs: 150,
  },
  queue: {
    // Maximum items allowed in audio playback queue before backpressure is applied
    maxAudioQueueSize: 50,
    // Maximum generation tasks queued
    maxGenerationQueueSize: 10,
  },
  latency: {
    // Target maximum latency (ms) for reporting healthy status
    targetMaximumMs: 800,
  },
  audio: {
    sampleRate: 24000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
};
