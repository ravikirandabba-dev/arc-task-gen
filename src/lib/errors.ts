export class VoiceEngineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "VoiceEngineError";
  }
}

export class ProviderError extends VoiceEngineError {
  constructor(message: string, public readonly providerName: string) {
    super(message, "PROVIDER_FAILED");
    this.name = "ProviderError";
  }
}

export class PlaybackError extends VoiceEngineError {
  constructor(message: string) {
    super(message, "PLAYBACK_FAILED");
    this.name = "PlaybackError";
  }
}

export class RecoveryError extends VoiceEngineError {
  constructor(message: string) {
    super(message, "RECOVERY_FAILED");
    this.name = "RecoveryError";
  }
}
