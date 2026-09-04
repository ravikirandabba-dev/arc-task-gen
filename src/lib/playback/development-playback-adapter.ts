import { PlaybackAdapter } from "@/types/pipeline";
import { eventBus } from "../event-bus";
import { metricsTracker } from "../metrics";

export class DevelopmentPlaybackAdapter implements PlaybackAdapter {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private playbackStart: number | null = null;
  public onStopRequested?: () => void;
  public onActuallyStopped?: () => void;

  public async play(audioBlob: Blob | null): Promise<void> {
    if (!this.audioContext || this.audioContext.state === "closed") {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    
    this.playbackStart = performance.now();
    
    if (audioBlob && audioBlob.size > 0) {
      // Play real audio Blob
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.connect(this.audioContext.destination);
      
      this.source.onended = () => this.handleEnded();
      this.source.start(0);
    } else {
      // Fallback test tone
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      
      this.oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.oscillator.onended = () => this.handleEnded();
      this.oscillator.start();
      this.oscillator.stop(this.audioContext.currentTime + 3);
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
    if (this.oscillator) {
      try { this.oscillator.stop(); } catch { /* ignored */ }
    }
  }

  public flush(): void {
    // Adapter itself has no queue, just stops current.
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
    this.oscillator = null;
    
    if (this.onActuallyStopped) {
      this.onActuallyStopped();
    }
    
    eventBus.emit("event:log", { eventType: "HARDWARE_SILENCED", timestamp: performance.now() });
  }
}
