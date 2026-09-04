import { eventBus } from "../event-bus";
import { eventTimeline } from "./event-timeline";
import { EngineEvent } from "@/types/observability";
import { EngineState } from "@/types/interrupt";
import { voiceSessionManager } from "../voice-session-manager";
import { engineSnapshots } from "./engine-snapshots";

class EngineLogger {
  private activeFsmState: EngineState = EngineState.IDLE;
  private unsubscribe: (() => void) | null = null;

  public initialize(): void {
    if (this.unsubscribe) return;

    this.unsubscribe = eventBus.onAny((eventType, payload) => {
      this.logEvent(String(eventType), payload);
    });
  }

  public setFsmState(state: EngineState): void {
    this.activeFsmState = state;
  }

  private logEvent(eventType: string, payload: unknown): void {
    const p = payload as Record<string, unknown>;
    const timestamp = (p?.timestamp as number) || performance.now();
    const ctx = voiceSessionManager.getActiveContext();
    const session = voiceSessionManager.getSession();

    const engineEvent: EngineEvent = {
      id: `evt_${crypto.randomUUID()}`,
      timestamp,
      eventType,
      fsmState: this.activeFsmState,
      turnId: (p?.turnId as string) || ctx?.turnId,
      generationId: (p?.generationId as string) || ctx?.generationId,
      sessionId: (p?.sessionId as string) || session?.sessionId,
      latency: (p?.latencyMs as number) || (p?.latency as number),
      metadata: p || {}
    };

    eventTimeline.push(engineEvent);

    // Capture snapshots for key FSM boundaries or structural shifts
    if (
      eventType === "interruption:triggered" || 
      eventType === "TURN_RECOVERED" ||
      eventType === "LLM_GENERATION_STARTED" ||
      eventType === "LLM_GENERATION_COMPLETED" ||
      eventType === "playback:status" ||
      eventType === "SESSION_STARTED"
    ) {
      engineSnapshots.capture(eventType, this.activeFsmState);
    }
  }

  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

export const engineLogger = new EngineLogger();
