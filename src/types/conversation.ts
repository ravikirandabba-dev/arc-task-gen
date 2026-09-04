import { SessionId, TurnId, GenerationId } from "./interrupt";

export type Role = "user" | "assistant" | "system";

export interface MessageMetadata {
  confidence?: number;
  language?: string;
  source?: string;
  [key: string]: unknown;
}

export interface BaseMessage {
  id: string;
  timestamp: number;
  turnId: TurnId;
  sessionId: SessionId;
  role: Role;
  content: string;
  metadata: MessageMetadata;
  interrupted: boolean;
  cancelled: boolean;
  recovered: boolean;
}

export interface UserMessage extends BaseMessage {
  role: "user";
  audioBlobId?: string; // Optional reference to the recording
}

export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  generationId: GenerationId;
}

export interface SystemMessage extends BaseMessage {
  role: "system";
}

export type ConversationMessage = UserMessage | AssistantMessage | SystemMessage;

export interface ConversationTurn {
  turnId: TurnId;
  sessionId: SessionId;
  startedAt: number;
  userMessage?: UserMessage;
  assistantMessage?: AssistantMessage;
  status: "active" | "completed" | "interrupted" | "cancelled";
}

export interface ConversationSession {
  id: SessionId;
  startedAt: number;
  updatedAt: number;
  turns: ConversationTurn[];
}

export interface ConversationSummary {
  sessionId: SessionId;
  topic: string;
  summary: string;
  createdAt: number;
}

export interface IntentAnalysis {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  language: string;
  priority: "low" | "normal" | "high" | "critical";
  estimatedComplexity: number;
  conversationCategory: string;
}

export interface AssistantResponse {
  id: string;
  text: string;
  priority: "low" | "normal" | "high" | "critical";
  interruptible: boolean;
  estimatedSpeechDuration: number; // in ms
  emotion: string;
  language: string;
  metadata: Record<string, unknown>;
  provider: string;
  createdAt: number;
  turnId: TurnId;
  sessionId: SessionId;
  generationId: GenerationId;
}
