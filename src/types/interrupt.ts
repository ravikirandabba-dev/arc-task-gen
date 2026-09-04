/**
 * Strongly typed identifiers to prevent crossing IDs.
 */
export type TurnId = string;
export type GenerationId = string;
export type PlaybackId = string;
export type SessionId = string;
export type ConversationId = string;

/**
 * Representation of a distinct interaction cycle.
 */
export interface TurnContext {
  turnId: TurnId;
  generationId: GenerationId;
  timestamp: number;
}

/**
 * Valid states of the interruption and recovery engine.
 */
export enum EngineState {
  IDLE = "IDLE",
  LISTENING = "LISTENING",
  THINKING = "THINKING",
  SPEAKING = "SPEAKING",
  INTERRUPTED = "INTERRUPTED",
  RECOVERING = "RECOVERING"
}

export type MicStatus = "ON" | "OFF" | "DENIED";
export type VADStatus = "DETECTED" | "SILENT";
export type PlaybackStatus = "PLAYING" | "STOPPED";

export interface LatencyMeasurement {
  interruptDetectedAt: number | null;
  playbackStopRequestedAt: number | null;
  playbackActuallyStoppedAt: number | null;
  interruptionToSilenceMs: number | null;
}

/**
 * Interruption metrics for engineering observability.
 */
export interface EngineMetrics {
  interruptionCount: number;
  averageLatencyMs: number;
  fastestLatencyMs?: number | null;
  slowestLatencyMs?: number | null;
  cancelledPlaybackCount: number;
  droppedStaleResponsesCount: number;
  recoveryDurationMs: number;
  audioQueueSize: number;
  generationQueueSize: number;
  queueFlushesCount?: number;
  cancelledGenerationsCount?: number;
  recordingDurationMs: number;
  playbackDurationMs: number;
  speechDetectionCount: number;
  microphoneUptimeMs: number;
  
  // Phase 8 Conversation Intelligence Metrics
  conversationDurationMs: number;
  averageGenerationLatencyMs: number;
  averageResponseSizeBytes: number;
  interruptedGenerationsCount: number;
  recoveredTurnsCount: number;
  conversationCount: number;
  memoryUsageBytes: number;
  latestPromptSizeBytes: number;
  
  lastLatencyMeasurement: LatencyMeasurement | null;
}

/**
 * Payload structures for the event bus.
 */
export type EngineEventPayloads = {
  "state:change": { previous: EngineState; current: EngineState };
  "turn:new": TurnContext;
  "interruption:triggered": { latencyMs: number; turnId: TurnId; timestamp: number };
  "stale:dropped": { turnId: TurnId; generationId: GenerationId };
  "playback:cancelled": { playbackId: PlaybackId; generationId: GenerationId };
  "metrics:update": EngineMetrics;
  "event:log": { eventType: string; timestamp: number; data?: unknown };
  "vad:change": { status: VADStatus; rms: number };
  "mic:status": { status: MicStatus };
  "playback:status": { status: PlaybackStatus; playbackId: PlaybackId | null };
  "demo:scene": { sceneNumber: number; title: string };
  // Phase 7 Events
  "RECORDING_STARTED": { timestamp: number };
  "RECORDING_STOPPED": { timestamp: number; durationMs: number; blobSize: number };
  "SPEECH_DETECTED": { timestamp: number };
  "SPEECH_ENDED": { timestamp: number };
  "GENERATION_STARTED": { timestamp: number; generationId: GenerationId };
  "GENERATION_CANCELLED": { timestamp: number; generationId: GenerationId };
  "PLAYBACK_STARTED": { timestamp: number };
  "PLAYBACK_STOPPED": { timestamp: number };
  "RECOVERY_STARTED": { timestamp: number };
  "RECOVERY_FINISHED": { timestamp: number };
  "SESSION_STARTED": { timestamp: number; sessionId: SessionId };
  // Phase 8 Events
  "CONVERSATION_INTENT_ANALYZED": { timestamp: number; intent: string; confidence: number };
  "PROMPT_GENERATED": { timestamp: number; sizeBytes: number };
  "LLM_GENERATION_STARTED": { timestamp: number };
  "LLM_GENERATION_COMPLETED": { timestamp: number; latencyMs: number; sizeBytes: number };
  "TURN_RECOVERED": { timestamp: number; turnId: TurnId };
  // Phase 9 Event Types
  "MIC_ENABLED": { timestamp: number };
  "MIC_DISABLED": { timestamp: number };
  "MIC_PERMISSION_GRANTED": { timestamp: number };
  "MIC_PERMISSION_DENIED": { timestamp: number; error: string };
  "VAD_STARTED": { timestamp: number };
  "VAD_STOPPED": { timestamp: number };
  "TURN_INVALIDATED": { timestamp: number; turnId: TurnId };
  "QUEUE_FLUSHED": { timestamp: number; itemsFlushed: number };
  "STALE_RESPONSE_DROPPED": { timestamp: number; generationId: GenerationId };
  "SESSION_FINISHED": { timestamp: number; sessionId: SessionId };
};
