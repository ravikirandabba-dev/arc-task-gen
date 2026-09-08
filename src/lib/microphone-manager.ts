import { eventBus } from "./event-bus";
import { VOICE_CONFIG } from "@/config/voice";
import { metricsTracker } from "./metrics";

/**
 * Manages the microphone lifecycle, avoiding memory leaks, handling user permissions,
 * and performing basic VAD (Voice Activity Detection).
 */
class MicrophoneManager {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  
  private isCheckingVAD: boolean = false;
  private vadConsecutiveMs: number = 0;
  private vadSilenceConsecutiveMs: number = 0;
  private vadLastTime: number = 0;
  private vadActive: boolean = false;
  private lastSilenceTime: number = 0;
  private animationFrameId: number | null = null;
  
  private uptimeStart: number | null = null;

  public async enable(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: VOICE_CONFIG.audio.echoCancellation,
          noiseSuppression: VOICE_CONFIG.audio.noiseSuppression,
          autoGainControl: VOICE_CONFIG.audio.autoGainControl,
        } 
      });
      
      this.uptimeStart = performance.now();
      eventBus.emit("MIC_PERMISSION_GRANTED", { timestamp: this.uptimeStart });
      eventBus.emit("MIC_ENABLED", { timestamp: this.uptimeStart });
      eventBus.emit("mic:status", { status: "ON" });
      eventBus.emit("event:log", { eventType: "MIC_PERMISSION_GRANTED", timestamp: this.uptimeStart });

      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      
      this.startVAD();
      return true;
    } catch (err) {
      console.error("Microphone access denied or unavailable", err);
      eventBus.emit("MIC_PERMISSION_DENIED", { timestamp: performance.now(), error: (err as Error).message || "Denied" });
      eventBus.emit("mic:status", { status: "DENIED" });
      eventBus.emit("event:log", { eventType: "MIC_PERMISSION_DENIED", timestamp: performance.now() });
      return false;
    }
  }

  public disable(): void {
    this.stopVAD();
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.uptimeStart) {
      metricsTracker.addMicrophoneUptime(performance.now() - this.uptimeStart);
      this.uptimeStart = null;
    }
    
    eventBus.emit("MIC_DISABLED", { timestamp: performance.now() });
    eventBus.emit("mic:status", { status: "OFF" });
    eventBus.emit("event:log", { eventType: "MIC_DISABLED", timestamp: performance.now() });
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  private startVAD(): void {
    if (!this.analyser) return;
    
    eventBus.emit("VAD_STARTED", { timestamp: performance.now() });
    
    this.isCheckingVAD = true;
    this.vadLastTime = performance.now();
    this.lastSilenceTime = performance.now();
    
    const dataArray = new Float32Array(this.analyser.fftSize);
    
    const checkVAD = () => {
      if (!this.isCheckingVAD || !this.analyser) return;
      
      const now = performance.now();
      const deltaMs = now - this.vadLastTime;
      this.vadLastTime = now;

      this.analyser.getFloatTimeDomainData(dataArray);
      
      let sumSquares = 0.0;
      for (const amplitude of dataArray) {
        sumSquares += amplitude * amplitude;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      
      if (rms > VOICE_CONFIG.vad.vadThreshold) {
        this.vadSilenceConsecutiveMs = 0;
        if (!this.vadActive && (now - this.lastSilenceTime > VOICE_CONFIG.vad.vadCooldownMs)) {
          this.vadConsecutiveMs += deltaMs;
          if (this.vadConsecutiveMs >= VOICE_CONFIG.vad.vadMinSpeechMs) {
            this.vadActive = true;
            metricsTracker.incrementSpeechDetection();
            eventBus.emit("vad:change", { status: "DETECTED", rms });
            eventBus.emit("SPEECH_DETECTED", { timestamp: now });
            eventBus.emit("event:log", { eventType: "SPEECH_DETECTED", timestamp: now });
          }
        }
      } else {
        this.vadConsecutiveMs = 0;
        if (this.vadActive) {
          this.vadSilenceConsecutiveMs += deltaMs;
          if (this.vadSilenceConsecutiveMs >= VOICE_CONFIG.vad.vadCooldownMs) {
            this.vadActive = false;
            this.lastSilenceTime = now;
            eventBus.emit("vad:change", { status: "SILENT", rms });
            eventBus.emit("SPEECH_ENDED", { timestamp: now });
            eventBus.emit("event:log", { eventType: "SPEECH_ENDED", timestamp: now });
          }
        }
      }
      
      this.animationFrameId = requestAnimationFrame(checkVAD);
    };
    
    checkVAD();
  }

  private stopVAD(): void {
    this.isCheckingVAD = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    eventBus.emit("VAD_STOPPED", { timestamp: performance.now() });
    if (this.vadActive) {
      this.vadActive = false;
      eventBus.emit("vad:change", { status: "SILENT", rms: 0 });
    }
  }
}

export const microphoneManager = new MicrophoneManager();
