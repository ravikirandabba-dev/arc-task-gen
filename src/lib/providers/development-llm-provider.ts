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
      if (lower.includes("hello")) return "Hello! Systems are fully operational. How can I assist you?";
      if (lower.includes("status")) return "All core diagnostic pipelines are functioning within expected parameters.";
    }
    return "I am processing your request through the simulated development pipeline.";
  }
}
