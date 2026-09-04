import { SessionId, TurnId } from "@/types/interrupt";
import { ConversationTurn, ConversationSummary } from "@/types/conversation";
import { metricsTracker } from "../metrics";

export class ConversationMemory {
  private recentTurns: ConversationTurn[] = [];
  private summaries = new Map<SessionId, ConversationSummary>();
  private activeTopic: string = "General Assistance";
  private lastInterruptionId: TurnId | null = null;
  private lastRecoveryId: TurnId | null = null;
  
  public addTurn(turn: ConversationTurn): void {
    this.recentTurns.push(turn);
    if (this.recentTurns.length > 50) {
      this.recentTurns.shift();
    }
    
    // Calculate naive memory usage
    const size = JSON.stringify(this.recentTurns).length;
    metricsTracker.updateMemoryUsage(size);
  }

  public getRecentTurns(limit: number = 10): ConversationTurn[] {
    return this.recentTurns.slice(-limit);
  }

  public getConversationLength(): number {
    return this.recentTurns.length;
  }

  public setSummary(sessionId: SessionId, summary: string, topic: string): void {
    this.summaries.set(sessionId, {
      sessionId,
      summary,
      topic,
      createdAt: performance.now(),
    });
    this.activeTopic = topic;
  }

  public getSummary(sessionId: SessionId): ConversationSummary | undefined {
    return this.summaries.get(sessionId);
  }

  public getActiveTopic(): string {
    return this.activeTopic;
  }

  public markInterruption(turnId: TurnId): void {
    this.lastInterruptionId = turnId;
    metricsTracker.incrementInterruptedGenerations();
  }

  public markRecovery(turnId: TurnId): void {
    this.lastRecoveryId = turnId;
    metricsTracker.incrementRecoveredTurns();
  }

  public getLastInterruption(): TurnId | null {
    return this.lastInterruptionId;
  }

  public getLastRecovery(): TurnId | null {
    return this.lastRecoveryId;
  }

  public clear(): void {
    this.recentTurns = [];
    this.summaries.clear();
    this.activeTopic = "General Assistance";
    this.lastInterruptionId = null;
    this.lastRecoveryId = null;
    metricsTracker.updateMemoryUsage(0);
  }
}

export const conversationMemory = new ConversationMemory();
