import { TurnId, GenerationId, TurnContext } from "@/types/interrupt";
import { VoiceSession } from "@/types/pipeline";
import { eventBus } from "./event-bus";
import { metricsTracker } from "./metrics";

class VoiceSessionManager {
  private activeSession: VoiceSession | null = null;
  private activeTurnId: TurnId | null = null;
  private activeGenerationId: GenerationId | null = null;

  public startSession(providerName: string): VoiceSession {
    const sessionId = `sess_${crypto.randomUUID()}`;
    const now = performance.now();
    
    this.activeSession = {
      sessionId,
      startedAt: now,
      provider: providerName,
      turns: []
    };
    
    eventBus.emit("SESSION_STARTED", { timestamp: now, sessionId });
    eventBus.emit("event:log", { eventType: "SESSION_STARTED", timestamp: now, data: { sessionId } });
    return this.activeSession;
  }

  public endSession(): void {
    this.activeSession = null;
    this.activeTurnId = null;
    this.activeGenerationId = null;
  }

  public getSession(): VoiceSession | null {
    return this.activeSession;
  }

  /**
   * Starts a brand new conversational turn, implicitly fencing off all prior operations.
   */
  public startTurn(): TurnContext {
    this.activeTurnId = `turn_${crypto.randomUUID()}`;
    this.activeGenerationId = `gen_${crypto.randomUUID()}`;
    const now = performance.now();

    const context: TurnContext = {
      turnId: this.activeTurnId,
      generationId: this.activeGenerationId,
      timestamp: now,
    };

    if (this.activeSession) {
      this.activeSession.turns.push({
        turnId: this.activeTurnId,
        startedAt: now,
        generation: null,
        recordingDurationMs: null,
      });
    }

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
      timestamp: performance.now(),
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
    const currentContext = this.getActiveContext();
    if (currentContext) {
      eventBus.emit("TURN_INVALIDATED", {
        timestamp: performance.now(),
        turnId: currentContext.turnId
      });
    }
    this.activeTurnId = null;
    this.activeGenerationId = null;
  }
}

export const voiceSessionManager = new VoiceSessionManager();
// Provide backward compatibility for internal imports temporarily
export const turnManager = voiceSessionManager;
