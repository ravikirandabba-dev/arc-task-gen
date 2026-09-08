import { LLMProvider } from "./llm-provider";
import { PromptPayload } from "../conversation/prompt-builder";
import { AssistantResponse } from "@/types/conversation";
import { TurnId, SessionId, GenerationId } from "@/types/interrupt";
import { eventBus } from "../event-bus";
import { metricsTracker } from "../metrics";

export class DevelopmentLLMProvider implements LLMProvider {
  public name = "DEVELOPMENT_LLM";
  private activeGenerations = new Map<GenerationId, NodeJS.Timeout>();

  public async initialize(): Promise<boolean> {
    return true;
  }

  public async generate(
    prompt: PromptPayload, 
    turnId: TurnId, 
    sessionId: SessionId, 
    generationId: GenerationId
  ): Promise<AssistantResponse> {
    const startTime = performance.now();
    eventBus.emit("LLM_GENERATION_STARTED", { timestamp: startTime });

    return new Promise((resolve) => {
      // Simulate deterministic generation latency
      const timeoutId = setTimeout(() => {
        this.activeGenerations.delete(generationId);
        
        const now = performance.now();
        const latencyMs = now - startTime;
        
        const text = this.getMockResponse(prompt);
        const responseSize = new Blob([text]).size;
        
        metricsTracker.recordGenerationLatency(latencyMs);
        metricsTracker.recordResponseSize(responseSize);
        
        eventBus.emit("LLM_GENERATION_COMPLETED", { 
          timestamp: now, 
          latencyMs,
          sizeBytes: responseSize
        });

        const response: AssistantResponse = {
          id: `resp_${crypto.randomUUID()}`,
          text,
          priority: "normal",
          interruptible: true,
          estimatedSpeechDuration: text.length * 60, // roughly 60ms per character
          emotion: "neutral",
          language: "en",
          metadata: {},
          provider: this.name,
          createdAt: now,
          turnId,
          sessionId,
          generationId
        };
        
        resolve(response);
      }, 400); // 400ms mock latency

      this.activeGenerations.set(generationId, timeoutId);
    });
  }

  public cancel(generationId: GenerationId): void {
    const timeoutId = this.activeGenerations.get(generationId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeGenerations.delete(generationId);
    }
  }

  public dispose(): void {
    this.activeGenerations.forEach((timeoutId) => clearTimeout(timeoutId));
    this.activeGenerations.clear();
  }

  private getMockResponse(prompt: PromptPayload): string {
    const lastUser = prompt.messages[prompt.messages.length - 1];
    if (lastUser && lastUser.role === "user") {
      const lower = lastUser.content.toLowerCase();
      if (lower.includes("carbonara")) return "To make the carbonara, first boil a large pot of salted water. Then, cook 8 ounces of spaghetti until al dente.";
      if (lower.includes("cheese")) return "You will need 1 cup of freshly grated Pecorino Romano cheese, mixed with two large eggs and black pepper.";
      if (lower.includes("next")) return "While the pasta is cooking, fry 4 ounces of guanciale in a skillet until crispy. Do not drain the fat.";
    }
    return "I am ready for the next cooking instruction. What would you like to do?";
  }
}

