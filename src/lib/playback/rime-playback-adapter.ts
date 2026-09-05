import { PlaybackAdapter } from "@/types/pipeline";
import { eventBus } from "../event-bus";
import { metricsTracker } from "../metrics";

export class RimePlaybackAdapter implements PlaybackAdapter {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private playbackStart: number | null = null;
  public onStopRequested?: () => void;
  public onActuallyStopped?: () => void;

  public async play(audioBlob: Blob | null): Promise<void> {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    
    this.playbackStart = performance.now();
    
    if (audioBlob && audioBlob.size > 0) {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.connect(this.audioContext.destination);
      
      this.source.onended = () => this.handleEnded();
      this.source.start(0);
    } else {
      console.warn("RimePlaybackAdapter received null or empty blob. Skipping playback.");
      this.handleEnded();
    }
  }

  public stop(): void {
    if (this.onStopRequested) this.onStopRequested();
    
    if (this.playbackStart) {
      metricsTracker.addPlaybackDuration(performance.now() - this.playbackStart);
      this.playbackStart = null;
    }
    
    if (this.source) {
      try { this.source.stop(); } catch { /* ignored */ }
    }
  }

  public flush(): void {
    this.stop();
  }

  public dispose(): void {
    this.stop();
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private handleEnded(): void {
    if (this.playbackStart) {
      metricsTracker.addPlaybackDuration(performance.now() - this.playbackStart);
      this.playbackStart = null;
    }
    
    this.source = null;
    
    if (this.onActuallyStopped) {
      this.onActuallyStopped();
    }
    
    eventBus.emit("event:log", { eventType: "HARDWARE_SILENCED", timestamp: performance.now() });
  }
}
