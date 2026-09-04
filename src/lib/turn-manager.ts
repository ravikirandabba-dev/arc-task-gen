import { TurnId, GenerationId, TurnContext } from "@/types/interrupt";
import { eventBus } from "./event-bus";
import { metricsTracker } from "./metrics";

/**
 * Ensures strict Turn Fencing boundaries. 
 * Only the newest generation may produce playback. Older generations automatically become stale.
 */
class TurnManager {
  private activeTurnId: TurnId | null = null;
  private activeGenerationId: GenerationId | null = null;

  /**
   * Starts a brand new conversational turn, implicitly fencing off all prior operations.
   */
  public startTurn(): TurnContext {
    this.activeTurnId = `turn_${crypto.randomUUID()}`;
    this.activeGenerationId = `gen_${crypto.randomUUID()}`;

    const context: TurnContext = {
      turnId: this.activeTurnId,
      generationId: this.activeGenerationId,
      timestamp: Date.now(),
    };

    eventBus.emit("turn:new", context);
    return context;
  }

  /**
   * Returns the IDs for the current active turn.
   */
  public getActiveContext(): TurnContext | null {
    if (!this.activeTurnId || !this.activeGenerationId) return null;
    return {
      turnId: this.activeTurnId,
      generationId: this.activeGenerationId,
      timestamp: Date.now(),
    };
  }

  /**
   * Verifies if a given generation ID belongs to the ACTIVE turn boundary.
   * If not, it is considered stale.
   */
  public isStale(generationId: GenerationId): boolean {
    const isStale = generationId !== this.activeGenerationId;
    if (isStale && this.activeTurnId) {
      metricsTracker.incrementDroppedStale();
      eventBus.emit("stale:dropped", { 
        turnId: this.activeTurnId, 
        generationId 
      });
    }
    return isStale;
  }

  /**
   * Invalidates the current turn context explicitly during an interruption.
   */
  public invalidateCurrentTurn(): void {
    this.activeTurnId = null;
    this.activeGenerationId = null;
  }
}

export const turnManager = new TurnManager();
