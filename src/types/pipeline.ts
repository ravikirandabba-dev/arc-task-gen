import { GenerationId, TurnId, SessionId } from "./interrupt";

export type GenerationStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "ERROR";

export interface GenerationObject {
  id: GenerationId;
  turnId: TurnId;
  status: GenerationStatus;
  startedAt: number;
  finishedAt: number | null;
  latencyMs: number | null;
  provider: string;
  error?: Error;
}

export interface TurnHistory {
  turnId: TurnId;
  startedAt: number;
  generation: GenerationObject | null;
  recordingDurationMs: number | null;
}

export interface VoiceSession {
  sessionId: SessionId;
  startedAt: number;
  provider: string;
  turns: TurnHistory[];
}

export interface PlaybackAdapter {
  play(audioBlob: Blob | null): Promise<void>;
  stop(): void;
  flush(): void;
  dispose(): void;
}

import { AssistantResponse } from "./conversation";

export interface SpeechProvider {
  name: string;
  initialize(): Promise<boolean>;
  startListening(): void;
  stopListening(): void;
  startGeneration(turnId: TurnId, response: AssistantResponse): Promise<GenerationId>;
  cancelGeneration(generationId: GenerationId): void;
  play(generationId: GenerationId): Promise<void>;
  stop(): void;
  dispose(): void;
}
