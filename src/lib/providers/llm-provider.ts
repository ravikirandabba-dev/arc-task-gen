import { PromptPayload } from "../conversation/prompt-builder";
import { AssistantResponse } from "@/types/conversation";
import { TurnId, SessionId, GenerationId } from "@/types/interrupt";

export interface LLMProvider {
  name: string;
  initialize(): Promise<boolean>;
  generate(
    prompt: PromptPayload, 
    turnId: TurnId, 
    sessionId: SessionId, 
    generationId: GenerationId
  ): Promise<AssistantResponse>;
  cancel(generationId: GenerationId): void;
  dispose(): void;
}
