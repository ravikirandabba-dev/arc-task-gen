import { EngineState } from "@/types/interrupt";
import { eventBus } from "./event-bus";
import { voiceSessionManager } from "./voice-session-manager";
import { recordingManager } from "./recording-manager";
import { metricsTracker } from "./metrics";
import { RimeSpeechProvider } from "./providers/rime-speech-provider";
import { conversationEngine } from "./conversation/conversation-engine";
import { conversationMemory } from "./conversation/conversation-memory";
import { playbackController } from "./playback-controller";
import { abortControllerManager } from "./abort-controller-manager";

/**
 * The master engine coordinating the interruption and recovery orchestration sequence,
 * and standard conversational flow (Microphone -> Recording -> Provider -> Playback).
 */
class InterruptEngine {
  private currentState: EngineState = EngineState.IDLE;
  private interruptStartTime: number = 0;
  private provider = new RimeSpeechProvider();

  constructor() {
    this.setState(EngineState.IDLE);

    eventBus.on("vad:change", async (payload) => {
      if (payload.status === "DETECTED") {
        if (this.currentState === EngineState.LISTENING || this.currentState === EngineState.IDLE) {
          // Standard turn start
          voiceSessionManager.startTurn();
          this.setState(EngineState.THINKING);
          recordingManager.start();
        } else if (this.currentState === EngineState.SPEAKING || this.currentState === EngineState.THINKING) {
          // Interruption!
          this.interrupt();
          // After interrupt recovers to LISTENING, we want it to automatically capture this speech if it continues,
          // but VAD continuous detection logic handles re-triggering.
        }
      } else if (payload.status === "SILENT") {
        if (this.currentState === EngineState.THINKING) {
          // Capture context BEFORE async operation to prevent stale closure race conditions
          const ctx = voiceSessionManager.getActiveContext();
          const session = voiceSessionManager.getSession();
          
          // Finish recording, send to Conversation Layer
          const blob = await recordingManager.stop();
          
          // Verify we are still in THINKING state and context hasn't been invalidated by rapid interrupt
          if (ctx && session && this.currentState === EngineState.THINKING && !voiceSessionManager.isStale(ctx.generationId)) {
            if (!blob) {
              // Revert back to listening if recording was empty
              this.setState(EngineState.LISTENING);
              voiceSessionManager.startTurn();
              return;
            }
            try {
              // Brain Layer Processing (STT -> LLM)
              const response = await conversationEngine.processUserAudio(
                blob, 
                ctx.turnId, 
                session.sessionId, 
                ctx.generationId
              );
              
              // Only proceed if not stale and we got a valid response
              if (response && !voiceSessionManager.isStale(ctx.generationId)) {
                // Speech Provider (TTS)
                try {
                  await this.provider.startGeneration(ctx.turnId, response);
                  this.setState(EngineState.SPEAKING);
                  await this.provider.play(ctx.generationId);
                } catch (providerErr) {
                  console.error("Provider synthesis failed", providerErr);
                  this.setState(EngineState.LISTENING);
                  voiceSessionManager.startTurn();
                }
              }
            } catch (err) {
              console.warn("Conversation pipeline aborted", err);
              if (this.currentState === EngineState.THINKING) {
                this.setState(EngineState.LISTENING);
                voiceSessionManager.startTurn();
              }
            }
          }
        }
      }
    });

    eventBus.on("PLAYBACK_STOPPED", () => {
      if (this.currentState === EngineState.RECOVERING) {
        this.completeRecovery();
      } else if (this.currentState === EngineState.SPEAKING) {
        this.setState(EngineState.LISTENING);
        voiceSessionManager.startTurn();
      }
    });

    eventBus.on("PLAYBACK_STARTED", () => {
      if (this.currentState !== EngineState.INTERRUPTED && 
          this.currentState !== EngineState.RECOVERING) {
        this.setState(EngineState.SPEAKING);
      }
    });
  }

  private setState(newState: EngineState) {
    const previous = this.currentState;
    this.currentState = newState;
    eventBus.emit("state:change", { previous, current: newState });
  }

  public getState(): EngineState {
    return this.currentState;
  }

  /**
   * The core interruption sequence.
   */
  public interrupt(): void {
    if (this.currentState === EngineState.INTERRUPTED || this.currentState === EngineState.RECOVERING) {
      return; 
    }

    const wasSpeaking = this.currentState === EngineState.SPEAKING;
    this.interruptStartTime = performance.now();
    
    // Clear the previous measurement and start a new one
    metricsTracker.updateLatencyMeasurement({ 
      interruptDetectedAt: this.interruptStartTime,
      playbackStopRequestedAt: null,
      playbackActuallyStoppedAt: null,
      interruptionToSilenceMs: null
    });
    
    eventBus.emit("event:log", { eventType: "INTERRUPTION_DETECTED", timestamp: this.interruptStartTime });

    this.setState(EngineState.INTERRUPTED);
    
    // 1. Invalidate active turn to block incoming asynchronous callbacks.
    const activeCtx = voiceSessionManager.getActiveContext();
    if (activeCtx) {
      conversationEngine.handleInterruption(activeCtx.turnId);
      voiceSessionManager.invalidateCurrentTurn();
      eventBus.emit("interruption:triggered", { latencyMs: 0, turnId: activeCtx.turnId, timestamp: this.interruptStartTime });
    }

    // 2. Stop Hardware Playback immediately.
    this.setState(EngineState.RECOVERING);
    this.flushAudioQueue();

    // 3. Abort network generations & recording
    recordingManager.cancel();
    if (activeCtx) {
       conversationEngine.cancelGeneration(activeCtx.generationId);
       this.provider.cancelGeneration(activeCtx.generationId);
    }
    
    // Fallback abort all just in case
    this.abortGeneration();

    // 4. Flush all queues
    this.flushAudioQueue();
    this.flushGenerationQueue();

    // 5. Begin structural recovery (state already set)
    
    if (!wasSpeaking) {
      this.completeRecovery();
    }
  }

  public abortGeneration(): void {
    abortControllerManager.abortAll();
    eventBus.emit("event:log", { eventType: "GENERATION_ABORTED", timestamp: performance.now() });
  }

  public flushAudioQueue(): void {
    playbackController.flushAudioQueue();
  }

  public flushGenerationQueue(): void {
    metricsTracker.updateQueueSizes(playbackController.getQueueSize(), 0);
  }

  /**
   * Completes system stability and transitions back to the Listening phase.
   */
  private completeRecovery(): void {
    if (this.currentState !== EngineState.RECOVERING) return;
    
    const recoveryDuration = performance.now() - this.interruptStartTime;
    metricsTracker.recordRecovery(recoveryDuration);
    
    eventBus.emit("event:log", { eventType: "RECOVERY_COMPLETE", timestamp: performance.now() });
    
    // Finalize metrics calculation for this interruption loop
    const snapshot = metricsTracker.getSnapshot();
    if (snapshot.lastLatencyMeasurement) {
      const { interruptDetectedAt, playbackActuallyStoppedAt } = snapshot.lastLatencyMeasurement;
      if (interruptDetectedAt && playbackActuallyStoppedAt) {
        const latency = playbackActuallyStoppedAt - interruptDetectedAt;
        metricsTracker.updateLatencyMeasurement({ interruptionToSilenceMs: latency });
        metricsTracker.recordInterruption(latency);
      }
    }

    // The engine is fully stabilized. Let the system resume standard listening.
    const lastInterruption = conversationMemory.getLastInterruption();
    if (lastInterruption) {
      conversationEngine.handleRecovery(lastInterruption);
    }
    
    voiceSessionManager.startTurn();
    this.setState(EngineState.LISTENING);
    eventBus.emit("event:log", { eventType: "LISTENING_RESUMED", timestamp: performance.now() });
  }

}

export const interruptEngine = new InterruptEngine();
