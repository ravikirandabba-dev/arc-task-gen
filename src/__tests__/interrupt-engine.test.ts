import { interruptEngine } from "@/lib/interrupt-engine";
import { voiceSessionManager } from "@/lib/voice-session-manager";
import { playbackController } from "@/lib/playback-controller";
import { eventBus } from "@/lib/event-bus";
import { EngineState } from "@/types/interrupt";

jest.mock("@/lib/metrics", () => ({
  metricsTracker: {
    updateLatencyMeasurement: jest.fn(),
    recordRecovery: jest.fn(),
    recordInterruption: jest.fn(),
    updateQueueSizes: jest.fn(),
    getSnapshot: jest.fn(() => ({ lastLatencyMeasurement: {} })),
    incrementDroppedStale: jest.fn(),
    incrementDroppedResponses: jest.fn(),
    incrementCancelledPlayback: jest.fn(),
    incrementQueueFlushes: jest.fn(),
  }
}));

describe("InterruptEngine & VoiceSessionManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    voiceSessionManager.endSession();
    interruptEngine["setState"](EngineState.IDLE);
  });

  it("VoiceSessionManager is the single source of truth for new turn creation", () => {
    const turn1 = voiceSessionManager.startTurn();
    const turn2 = voiceSessionManager.startTurn();
    expect(turn1.turnId).not.toEqual(turn2.turnId);
    expect(voiceSessionManager.getActiveContext()?.turnId).toEqual(turn2.turnId);
  });

  it("should reject stale generations", () => {
    const turn1 = voiceSessionManager.startTurn();
    voiceSessionManager.startTurn(); // creates new turn, fencing out turn1
    expect(voiceSessionManager.isStale(turn1.generationId)).toBe(true);
  });

  it("should trigger interrupt while thinking", () => {
    interruptEngine["setState"](EngineState.THINKING);
    interruptEngine.interrupt();
    expect(interruptEngine.getState()).toBe(EngineState.LISTENING);
  });

  it("should trigger interrupt while speaking", () => {
    interruptEngine["setState"](EngineState.SPEAKING);
    interruptEngine.interrupt();
    expect(interruptEngine.getState()).toBe(EngineState.RECOVERING);
    
    // Simulate playback stopped event
    eventBus.emit("PLAYBACK_STOPPED", { timestamp: Date.now() });
    expect(interruptEngine.getState()).toBe(EngineState.LISTENING);
  });

  it("should ignore rapid repeated interrupts", () => {
    interruptEngine["setState"](EngineState.SPEAKING);
    interruptEngine.interrupt();
    expect(interruptEngine.getState()).toBe(EngineState.RECOVERING);
    
    // Second interrupt should be ignored
    interruptEngine.interrupt();
    expect(interruptEngine.getState()).toBe(EngineState.RECOVERING);
  });

  it("should flush queue on interrupt", () => {
    const flushSpy = jest.spyOn(playbackController, "flushAudioQueue");
    interruptEngine["setState"](EngineState.SPEAKING);
    interruptEngine.interrupt();
    expect(flushSpy).toHaveBeenCalled();
  });
  
  it("should maintain consistent event sequence", () => {
    const emitSpy = jest.spyOn(eventBus, "emit");
    interruptEngine["setState"](EngineState.SPEAKING);
    interruptEngine.interrupt();
    
    // Ensure state:change to INTERRUPTED happens
    expect(emitSpy).toHaveBeenCalledWith("state:change", expect.objectContaining({
      current: EngineState.INTERRUPTED
    }));
  });
});
