import { TurnId, SessionId, GenerationId, EngineState } from "./interrupt";
import { ConversationTurn, ConversationSession } from "./conversation";

export interface EngineEvent {
  id: string;
  timestamp: number;
  eventType: string;
  turnId?: TurnId;
  generationId?: GenerationId;
  sessionId?: SessionId;
  fsmState: EngineState;
  latency?: number;
  metadata: Record<string, unknown>;
}

export interface EngineSnapshot {
  id: string;
  timestamp: number;
  triggerEvent: string;
  fsmState: EngineState;
  activeSession: ConversationSession | null;
  activeTurn: ConversationTurn | null;
  conversationState: string;
  provider: string;
  queues: {
    audioQueueSize: number;
    generationQueueSize: number;
  };
  metrics: Record<string, unknown>;
}

export type TimelineFilter = {
  eventType?: string;
  turnId?: TurnId;
  sessionId?: SessionId;
  generationId?: GenerationId;
};

export interface ExportData {
  version: string;
  exportedAt: number;
  metrics: Record<string, unknown>;
  events: EngineEvent[];
  snapshots: EngineSnapshot[];
}
