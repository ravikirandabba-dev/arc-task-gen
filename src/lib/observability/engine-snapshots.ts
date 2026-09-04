import { EngineSnapshot } from "@/types/observability";
import { EngineState } from "@/types/interrupt";
import { voiceSessionManager } from "../voice-session-manager";
import { metricsTracker } from "../metrics";
import { conversationMemory } from "../conversation/conversation-memory";

class EngineSnapshots {
  private snapshots: EngineSnapshot[] = [];

  public capture(triggerEvent: string, fsmState: EngineState): EngineSnapshot {
    const session = voiceSessionManager.getSession();
    const ctx = voiceSessionManager.getActiveContext();

    const snapshot: EngineSnapshot = {
      id: `snap_${crypto.randomUUID()}`,
      timestamp: performance.now(),
      triggerEvent,
      fsmState,
      activeSession: session ? {
        id: session.sessionId,
        startedAt: session.startedAt,
        updatedAt: performance.now(),
        turns: conversationMemory.getRecentTurns()
      } : null,
      activeTurn: ctx ? conversationMemory.getRecentTurns().find(t => t.turnId === ctx.turnId) || null : null,
      conversationState: conversationMemory.getActiveTopic(),
      provider: "DEVELOPMENT_LLM & ADAPTER",
      queues: {
        audioQueueSize: 0, // In Phase 9 architecture, PlaybackAdapter buffers handle sizing internally, just stubbing for UI mock
        generationQueueSize: 0
      },
      metrics: { ...metricsTracker.getMetrics() }
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  public getSnapshots(): EngineSnapshot[] {
    return [...this.snapshots];
  }

  public clear(): void {
    this.snapshots = [];
  }
}

export const engineSnapshots = new EngineSnapshots();
