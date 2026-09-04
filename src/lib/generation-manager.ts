import { GenerationId, TurnId } from "@/types/interrupt";
import { GenerationObject } from "@/types/pipeline";
import { eventBus } from "./event-bus";
import { abortControllerManager } from "./abort-controller-manager";

export class GenerationManager {
  private generations = new Map<GenerationId, GenerationObject>();

  public createGeneration(turnId: TurnId, generationId: GenerationId, provider: string): GenerationObject {
    const gen: GenerationObject = {
      id: generationId,
      turnId,
      status: "PENDING",
      startedAt: performance.now(),
      finishedAt: null,
      latencyMs: null,
      provider,
    };
    
    this.generations.set(generationId, gen);
    return gen;
  }
  
  public markProcessing(generationId: GenerationId): void {
    const gen = this.generations.get(generationId);
    if (gen) {
      gen.status = "PROCESSING";
      const now = performance.now();
      eventBus.emit("GENERATION_STARTED", { timestamp: now, generationId });
      eventBus.emit("event:log", { eventType: "GENERATION_STARTED", timestamp: now, data: { generationId } });
    }
  }

  public markCompleted(generationId: GenerationId): void {
    const gen = this.generations.get(generationId);
    if (gen && gen.status !== "CANCELLED") {
      gen.status = "COMPLETED";
      gen.finishedAt = performance.now();
      gen.latencyMs = gen.finishedAt - gen.startedAt;
      eventBus.emit("event:log", { eventType: "GENERATION_COMPLETED", timestamp: gen.finishedAt, data: { latency: gen.latencyMs } });
    }
  }

  public cancelGeneration(generationId: GenerationId): void {
    const gen = this.generations.get(generationId);
    if (gen && gen.status !== "COMPLETED") {
      gen.status = "CANCELLED";
      gen.finishedAt = performance.now();
      abortControllerManager.abort(generationId);
      
      eventBus.emit("GENERATION_CANCELLED", { timestamp: gen.finishedAt, generationId });
      eventBus.emit("event:log", { eventType: "GENERATION_CANCELLED", timestamp: gen.finishedAt, data: { generationId } });
    }
  }

  public getGeneration(generationId: GenerationId): GenerationObject | undefined {
    return this.generations.get(generationId);
  }
}

export const generationManager = new GenerationManager();
