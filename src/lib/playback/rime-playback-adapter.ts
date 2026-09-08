import { PlaybackAdapter } from "@/types/pipeline";
import { eventBus } from "../event-bus";
import { metricsTracker } from "../metrics";

export class RimePlaybackAdapter implements PlaybackAdapter {
  private audioContext: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private playbackStart: number | null = null;
  public onStopRequested?: () => void;
  public onActuallyStopped?: () => void;

  public async play(audioBlob: Blob | null): Promise<void> {
    if (!this.audioContext || this.audioContext.state === "closed") {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextConstructor();
    }
    
    this.playbackStart = performance.now();
    
    if (audioBlob && audioBlob.size > 0) {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      if (!this.playbackStart) {
        return;
      }
      
      const currentSource = this.audioContext.createBufferSource();
      this.source = currentSource;
      this.source.buffer = audioBuffer;
      this.source.connect(this.audioContext.destination);
      
      this.source.onended = () => this.handleEnded(currentSource);
      this.source.start(0);
      
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(console.error);
      }
    } else {
      // Fallback test tone for simulation UI (when explicitly testing interrupts)
      const currentOsc = this.audioContext.createOscillator();
      this.oscillator = currentOsc;
      this.oscillator.type = "sine";
      this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
      
      this.oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      this.oscillator.onended = () => {
        if (this.oscillator !== currentOsc) return;
        this.handleEnded();
      };
      this.oscillator.start();
      this.oscillator.stop(this.audioContext.currentTime + 3);
      
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(console.error);
      }
    }
  }

  public stop(): void {
    if (this.onStopRequested) this.onStopRequested();
    
    if (this.playbackStart) {
      metricsTracker.addPlaybackDuration(performance.now() - this.playbackStart);
      this.playbackStart = null;
    }
    
    let needsFallback = false;
    
    if (this.source) {
      needsFallback = true;
      try { this.source.stop(); } catch { /* ignored */ }
    }
    if (this.oscillator) {
      needsFallback = true;
      try { this.oscillator.stop(); } catch { /* ignored */ }
    }
    
    // Hardware safety fallback: if Windows/Chrome drops the onended event, force clearance
    if (needsFallback) {
      setTimeout(() => {
        if (this.source || this.oscillator) {
          this.handleEnded();
        }
      }, 25); // 25ms tolerance for hardware silence confirmation
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

  private handleEnded(sourceToHandle?: AudioBufferSourceNode): void {
    if (sourceToHandle && sourceToHandle !== this.source) {
      return;
    }
    
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
