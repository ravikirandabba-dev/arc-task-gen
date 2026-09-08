import { interruptEngine } from "./interrupt-engine";
import { playbackController } from "./playback-controller";
import { eventBus } from "./event-bus";
import { metricsTracker } from "./metrics";
import { EngineState } from "@/types/interrupt";

class JudgeOrchestrator {
  private isRunning = false;
  private isPaused = false;
  private currentScene = 0;
  private resolveStep: (() => void) | null = null;
  private sceneQueue: (() => Promise<void>)[] = [];

  constructor() {
    this.buildScenes();
  }

  private buildScenes() {
    this.sceneQueue = [
      // Scene 1: Mission Brief
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 1, title: "Mission Brief & Initialization" });
        await this.delay(2000);
      },
      // Scene 2: Voice engine begins speaking
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 2, title: "Commencing Duplex Generation" });
        metricsTracker.reset();
        
        eventBus.emit("vad:change", { status: "DETECTED", rms: 0 });
        await this.delay(200);
        eventBus.emit("vad:change", { status: "SILENT", rms: 0 });

        await this.waitForState(EngineState.SPEAKING);
        await this.delay(1000); 
      },
      // Scene 3: Inject simulated user interruption
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 3, title: "Injecting Micro-latency Interruption" });
        await this.delay(500);
        // Emulate true VAD detection during speaking
        eventBus.emit("vad:change", { status: "DETECTED", rms: 0 });
      },
      // Scene 4: Playback stops & calculate latency
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 4, title: "Hardware Playback Terminated" });
        await this.waitForState(EngineState.RECOVERING);
        await this.delay(800); 
      },
      // Scene 5: Recovery
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 5, title: "State Reconciliation & Flushing" });
        await this.delay(1000);
        // Release VAD silence to resume listening
        eventBus.emit("vad:change", { status: "SILENT", rms: 0 });
      },
      // Scene 6: Listening resumes
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 6, title: "Resumed Active Listening" });
        await this.waitForState(EngineState.LISTENING);
        await this.delay(800);
      },
      // Scene 7: Second generation
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 7, title: "Initiating Follow-up Turn" });
        eventBus.emit("vad:change", { status: "DETECTED", rms: 0 });
        await this.delay(200);
        eventBus.emit("vad:change", { status: "SILENT", rms: 0 });
        await this.waitForState(EngineState.THINKING);
        await this.delay(1000);
      },
      // Scene 8: Reject stale generation
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 8, title: "Strict Turn Fencing (Stale Rejection)" });
        playbackController.enqueue({
          playbackId: `play_stale_${crypto.randomUUID()}`,
          generationId: `gen_stale_${crypto.randomUUID()}`,
          blob: null
        });
        await this.delay(1500);
      },
      // Scene 9: Summary
      async () => {
        eventBus.emit("demo:scene", { sceneNumber: 9, title: "Engineering Summary" });
      }
    ];
  }

  public async startDemo() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.currentScene = 0;

    for (let i = this.currentScene; i < this.sceneQueue.length; i++) {
      if (!this.isRunning) break;
      this.currentScene = i;
      await this.checkPaused();
      if (!this.isRunning) break;
      
      try {
        await this.sceneQueue[i]();
      } catch (err) {
        console.error("Demo scene aborted", err);
      }
    }
    
    this.isRunning = false;
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    if (this.resolveStep) {
      this.resolveStep();
      this.resolveStep = null;
    }
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.resolveStep) {
      this.resolveStep();
      this.resolveStep = null;
    }
    eventBus.emit("demo:scene", { sceneNumber: 0, title: "Demo Aborted" });
  }

  public skipScene() {
    if (this.resolveStep) {
      this.resolveStep();
      this.resolveStep = null;
    }
  }

  private async checkPaused() {
    if (this.isPaused) {
      return new Promise<void>((resolve) => {
        this.resolveStep = resolve;
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const internalResolve = () => {
        resolve();
      };
      const timeoutId = setTimeout(internalResolve, ms);
      this.resolveStep = () => {
        clearTimeout(timeoutId);
        resolve();
      };
    });
  }

  private waitForState(targetState: EngineState): Promise<void> {
    return new Promise((resolve) => {
      if (interruptEngine.getState() === targetState) {
        resolve();
        return;
      }
      
      const unsubscribe = eventBus.on("state:change", (payload) => {
        if (payload.current === targetState) {
          unsubscribe();
          resolve();
        }
      });
      
      // Fallback skip
      this.resolveStep = () => {
        unsubscribe();
        resolve();
      };
    });
  }
}

export const judgeOrchestrator = new JudgeOrchestrator();
