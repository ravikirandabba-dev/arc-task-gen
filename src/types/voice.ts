/**
 * Enums representing the distinct states of the full-duplex voice engine.
 */
export enum VoiceEngineState {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  PROCESSING = "PROCESSING",
  SPEAKING = "SPEAKING",
  INTERRUPTED = "INTERRUPTED",
  RECOVERING = "RECOVERING",
  ERROR = "ERROR",
}

/**
 * Unique identifiers for conversation tracking.
 */
export interface ConversationIdentity {
  sessionId: string;
  turnId: string;
  generationId: string;
}

/**
 * Metadata for a single conversational turn.
 */
export interface TurnContext extends ConversationIdentity {
  startTime: number;
  lastUpdated: number;
  isStale: boolean;
}

/**
 * Represents a discrete chunk of audio data.
 */
export interface AudioChunk {
  id: string;
  generationId: string;
  data: Float32Array | ArrayBuffer;
  durationMs: number;
  timestamp: number;
}

/**
 * A generic queue item for either generation tasks or audio chunks.
 */
export interface QueueItem<T> {
  id: string;
  priority: number;
  generationId: string;
  payload: T;
  enqueuedAt: number;
}

/**
 * Context provided when an interruption occurs.
 */
export interface InterruptContext {
  interruptedTurnId: string;
  timestamp: number;
  reason: "user_speech" | "system_override" | "timeout";
  preservedAudioDurationMs: number;
}

/**
 * State provided to React UI components.
 */
export interface VoiceContextState {
  currentState: VoiceEngineState;
  audioQueueSize: number;
  generationQueueSize: number;
  activeGenerationId: string | null;
  playbackLatencyMs: number;
  isMicrophoneActive: boolean;
  currentTurnId: string | null;
  lastInterruptContext: InterruptContext | null;
  errorMessage: string | null;
}
