
import { GenerationId, PlaybackId } from "@/types/interrupt";
import { eventBus } from "./event-bus";
import { metricsTracker } from "./metrics";
import { voiceSessionManager } from "./voice-session-manager";
import { RimePlaybackAdapter } from "./playback/rime-playback-adapter";

export interface PlaybackItem {
  playbackId: PlaybackId;
  generationId: GenerationId;
  blob: Blob | null;
}

/**
 * Handles the sequencing and cancellation of synthesized audio playback.
 * Delegates actual hardware synthesis to the PlaybackAdapter.
 */
class PlaybackController {
  private queue: PlaybackItem[] = [];
  private isPlaying: boolean = false;
  private currentPlaybackId: PlaybackId | null = null;
  private stopRequestedAt: number | null = null;
  
  private adapter: RimePlaybackAdapter;

  constructor() {
    // Inject rime adapter
    const devAdapter = new RimePlaybackAdapter();
    devAdapter.onStopRequested = () => {
      this.stopRequestedAt = performance.now();
      metricsTracker.updateLatencyMeasurement({ playbackStopRequestedAt: this.stopRequestedAt });
      eventBus.emit("event:log", { eventType: "PLAYBACK_STOP_REQUESTED", timestamp: this.stopRequestedAt });
    };
    
    devAdapter.onActuallyStopped = () => {
      // If we aren't waiting for a stop (e.g. flushed), ignore stale callbacks
      if (!this.stopRequestedAt && !this.isPlaying) return;
      
      if (this.stopRequestedAt) {
        const actuallyStoppedAt = performance.now();
        metricsTracker.updateLatencyMeasurement({ playbackActuallyStoppedAt: actuallyStoppedAt });
        eventBus.emit("event:log", { eventType: "PLAYBACK_STOPPED", timestamp: actuallyStoppedAt });
        eventBus.emit("PLAYBACK_STOPPED", { timestamp: actuallyStoppedAt });
      }
      this.isPlaying = false;
      this.stopRequestedAt = null;
      eventBus.emit("playback:status", { status: "STOPPED", playbackId: null });
      
      this.processNext(); // continue queue
    };
    this.adapter = devAdapter;
  }

  public async playTestAudio(generationId: GenerationId): Promise<void> {
    this.enqueue({
      playbackId: `play_${crypto.randomUUID()}`,
      generationId,
      blob: null // null triggers tone in DevAdapter
    });
  }

  public enqueue(item: PlaybackItem): void {
    if (voiceSessionManager.isStale(item.generationId)) {
      metricsTracker.incrementDroppedResponses();
      eventBus.emit("STALE_RESPONSE_DROPPED", { 
        timestamp: performance.now(), 
        generationId: item.generationId 
      });
      return; 
    }

    this.queue.push(item);
    metricsTracker.updateQueueSizes(this.queue.length, 0); 
    
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) return;

    const item = this.queue.shift();
    if (!item) return;

    if (voiceSessionManager.isStale(item.generationId)) {
      this.processNext();
      return;
    }

    metricsTracker.updateQueueSizes(this.queue.length, 0);
    this.isPlaying = true;
    this.currentPlaybackId = item.playbackId;
    
    try {
      await this.adapter.play(item.blob);
      const now = performance.now();
      eventBus.emit("PLAYBACK_STARTED", { timestamp: now });
      eventBus.emit("playback:status", { status: "PLAYING", playbackId: this.currentPlaybackId });
      eventBus.emit("event:log", { eventType: "PLAYBACK_STARTED", timestamp: now });
    } catch (e) {
      console.warn("Playback interrupted or failed:", e);
      this.isPlaying = false;
      this.currentPlaybackId = null;
      this.processNext();
    }
  }

  public cancelPlayback(): void {
    if (this.isPlaying && this.currentPlaybackId) {
      metricsTracker.incrementCancelledPlayback();
      const ctx = voiceSessionManager.getActiveContext();
      eventBus.emit("playback:cancelled", { 
        playbackId: this.currentPlaybackId, 
        generationId: ctx ? ctx.generationId : "unknown" 
      });
    }
    
    this.currentPlaybackId = null;
    this.adapter.stop();
  }

  public flushAudioQueue(): void {
    const itemsFlushed = this.queue.length;
    if (itemsFlushed > 0) {
      metricsTracker.incrementQueueFlushes();
      eventBus.emit("QUEUE_FLUSHED", { timestamp: performance.now(), itemsFlushed });
    }
    
    this.queue = [];
    if (this.adapter) {
      this.adapter.stop();
    }
    this.isPlaying = false;
    // Do NOT clear stopRequestedAt, so asynchronous stop callbacks can complete latency calculations
    metricsTracker.updateQueueSizes(0, 0);
    eventBus.emit("event:log", { eventType: "AUDIO_QUEUE_FLUSHED", timestamp: performance.now() });
  }

  public getQueueSize(): number {
    return this.queue.length;
  }
}

export const playbackController = new PlaybackController();
