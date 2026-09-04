import { GenerationId, TurnId } from "@/types/interrupt";
import { SpeechProvider } from "@/types/pipeline";
import { generationManager } from "../generation-manager";
import { playbackController } from "../playback-controller";

import { AssistantResponse } from "@/types/conversation";

export class DevelopmentSpeechProvider implements SpeechProvider {
  public name = "DEVELOPMENT_AUDIO_ADAPTER";

  public async initialize(): Promise<boolean> {
    return true; // No network init needed for dev adapter
  }

  public startListening(): void {
    // VAD handles listening in our local architecture
  }

  public stopListening(): void {
    // VAD stops
  }

  public async startGeneration(turnId: TurnId, response: AssistantResponse): Promise<GenerationId> {
    const generationId = `gen_${crypto.randomUUID()}`;
    generationManager.createGeneration(turnId, generationId, this.name);
    
    // Simulate network processing delay based on response duration
    const delay = response ? 100 : 100;
    setTimeout(() => {
      generationManager.markProcessing(generationId);
      setTimeout(() => {
        generationManager.markCompleted(generationId);
      }, delay); 
    }, 100);
    
    return generationId;
  }

  public cancelGeneration(generationId: GenerationId): void {
    generationManager.cancelGeneration(generationId);
  }

  public async play(generationId: GenerationId): Promise<void> {
    playbackController.enqueue({
      playbackId: `play_${crypto.randomUUID()}`,
      generationId,
      blob: null // null triggers tone
    });
  }

  public stop(): void {
    playbackController.cancelPlayback();
  }

  public dispose(): void {
    this.stop();
  }
}
