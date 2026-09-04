import { ConversationTurn } from "@/types/conversation";
import { conversationMemory } from "./conversation-memory";
import { metricsTracker } from "../metrics";
import { eventBus } from "../event-bus";

export interface PromptPayload {
  systemPrompt: string;
  messages: Array<{ role: string; content: string }>;
}

export class PromptBuilder {
  private baseSystemPrompt = `You are VoicePilot AI, a highly intelligent conversational assistant.
You respond concisely and naturally, as your output will be synthesized into speech.
Do not use markdown formatting that cannot be spoken natively.
`;

  public buildPrompt(activeTurns: ConversationTurn[], latestUserInput: string): PromptPayload {
    const messages = [];

    // Filter out stale or cancelled turns from context window
    const validTurns = activeTurns.filter(t => t.status !== "cancelled");

    for (const turn of validTurns) {
      if (turn.userMessage) {
        let content = turn.userMessage.content;
        if (turn.status === "interrupted") {
          content += " [User interrupted the assistant here]";
        }
        messages.push({ role: "user", content });
      }
      
      if (turn.assistantMessage && turn.status !== "interrupted") {
        messages.push({ role: "assistant", content: turn.assistantMessage.content });
      }
    }

    // Append the very latest user input
    messages.push({ role: "user", content: latestUserInput });

    const payload: PromptPayload = {
      systemPrompt: this.baseSystemPrompt + `\nCurrent Topic: ${conversationMemory.getActiveTopic()}`,
      messages
    };

    const sizeBytes = JSON.stringify(payload).length;
    metricsTracker.updatePromptSize(sizeBytes);
    eventBus.emit("PROMPT_GENERATED", { timestamp: performance.now(), sizeBytes });

    return payload;
  }
}

export const promptBuilder = new PromptBuilder();
