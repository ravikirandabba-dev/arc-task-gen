import { TurnContext } from "@/types/voice";

/**
 * Manages the conversation identity, tracking turns, generations, and sessions to prevent race conditions.
 */
export class ConversationManager {
  private currentSessionId: string;
  private currentTurnId: string | null = null;
  private currentGenerationId: string | null = null;
  private turnHistory: Map<string, TurnContext> = new Map();

  constructor() {
    this.currentSessionId = crypto.randomUUID();
  }

  /**
   * Starts a new conversational turn.
   */
  public startNewTurn(): string {
    this.currentTurnId = crypto.randomUUID();
    this.currentGenerationId = null; // Reset until TTS begins
    
    const turnContext: TurnContext = {
      sessionId: this.currentSessionId,
      turnId: this.currentTurnId,
      generationId: "",
      startTime: Date.now(),
      lastUpdated: Date.now(),
      isStale: false,
    };
    
    this.turnHistory.set(this.currentTurnId, turnContext);
    return this.currentTurnId;
  }

  /**
   * Registers a new generation ID for the current turn.
   */
  public setGenerationId(generationId: string): void {
    if (!this.currentTurnId) throw new Error("No active turn to bind generation ID.");
    
    this.currentGenerationId = generationId;
    const ctx = this.turnHistory.get(this.currentTurnId);
    if (ctx) {
      ctx.generationId = generationId;
      ctx.lastUpdated = Date.now();
    }
  }

  /**
   * Checks if a provided generation ID is stale compared to the active generation.
   */
  public isStale(generationId: string): boolean {
    return this.currentGenerationId !== generationId;
  }

  /**
   * Marks a specific turn as stale (e.g., during an interruption).
   */
  public markTurnStale(turnId: string): void {
    const ctx = this.turnHistory.get(turnId);
    if (ctx) {
      ctx.isStale = true;
      ctx.lastUpdated = Date.now();
    }
  }

  /**
   * Gets the active session ID.
   */
  public getSessionId(): string {
    return this.currentSessionId;
  }

  /**
   * Gets the active turn ID.
   */
  public getTurnId(): string | null {
    return this.currentTurnId;
  }

  /**
   * Gets the active generation ID.
   */
  public getGenerationId(): string | null {
    return this.currentGenerationId;
  }
}
