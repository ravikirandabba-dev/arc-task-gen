import { GenerationId, TurnId } from "@/types/interrupt";
import { SpeechProvider } from "@/types/pipeline";
import { generationManager } from "../generation-manager";
import { playbackController } from "../playback-controller";
import { abortControllerManager } from "../abort-controller-manager";
import { voiceSessionManager } from "../voice-session-manager";
import { eventBus } from "../event-bus";
import { AssistantResponse } from "@/types/conversation";

export class RimeSpeechProvider implements SpeechProvider {
  public name = "RIME_SPEECH_PROVIDER";

  public async initialize(): Promise<boolean> {
    // Return true to indicate we're ready (the backend has the API key)
    return true;
  }

  public startListening(): void {}
  public stopListening(): void {}

  public async startGeneration(turnId: TurnId, response: AssistantResponse): Promise<GenerationId> {
    const generationId = `gen_${crypto.randomUUID()}`;
    generationManager.createGeneration(turnId, generationId, this.name);
    
    // Get the AbortController for this generation
    const abortController = abortControllerManager.getController(generationId);

    const generateAudio = async () => {
      try {
        generationManager.markProcessing(generationId);

        const res = await fetch("/api/speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: response.text,
            speaker: "peak",
            modelId: "mistv2"
          }),
          signal: abortController.signal
        });

        if (!res.ok) {
          throw new Error(`Rime API failed with status: ${res.status}`);
        }

        const blob = await res.blob();
        generationManager.markCompleted(generationId);
        
        // First audio byte received - we can log it instead of putting it in LatencyMeasurement
        eventBus.emit("event:log", { eventType: "FIRST_AUDIO_BYTE", timestamp: performance.now() });

        if (!voiceSessionManager.isStale(generationId)) {
          eventBus.emit("event:log", { eventType: "RIME_CONNECTED", timestamp: performance.now() });
          playbackController.enqueue({
            playbackId: `play_${crypto.randomUUID()}`,
            generationId,
            blob
          });
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") {
          eventBus.emit("event:log", { eventType: "GENERATION_ABORTED", timestamp: performance.now() });
        } else {
          eventBus.emit("event:log", { eventType: "GENERATION_ERROR", timestamp: performance.now(), data: e });
        }
        generationManager.cancelGeneration(generationId);
        // Ensure the engine doesn't get permanently stuck in SPEAKING state if network fails
        if (!voiceSessionManager.isStale(generationId)) {
          eventBus.emit("PLAYBACK_STOPPED", { timestamp: performance.now() });
        }
      } finally {
        abortControllerManager.remove(generationId);
      }
    };

    // Fire and forget
    generateAudio();
    
    return generationId;
  }

  public cancelGeneration(generationId: GenerationId): void {
    abortControllerManager.abort(generationId);
    generationManager.cancelGeneration(generationId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async play(_generationId: GenerationId): Promise<void> {
    // Normally enqueueing happens in startGeneration when audio is ready.
    // If play is called directly, we might handle it differently,
    // but the pipeline design here relies on startGeneration enqueuing it.
  }

  public stop(): void {
    playbackController.cancelPlayback();
  }

  public dispose(): void {
    this.stop();
  }
}
