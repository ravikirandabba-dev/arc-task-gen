import { EngineMetrics, LatencyMeasurement } from "@/types/interrupt";
import { eventBus } from "./event-bus";

export interface ExtendedEngineMetrics extends EngineMetrics {
  fastestLatencyMs: number | null;
  slowestLatencyMs: number | null;
  queueFlushesCount: number;
  cancelledGenerationsCount: number;
  maxGenerationLatencyMs: number;
  minGenerationLatencyMs: number;
  p95GenerationLatencyMs: number;
  droppedResponsesCount: number;
}

/**
 * Singleton managing engineering observability and metrics tracking.
 */
class MetricsTracker {
  private metrics: ExtendedEngineMetrics = {
    interruptionCount: 0,
    averageLatencyMs: 0,
    fastestLatencyMs: null,
    slowestLatencyMs: null,
    cancelledPlaybackCount: 0,
    droppedStaleResponsesCount: 0,
    recoveryDurationMs: 0,
    audioQueueSize: 0,
    generationQueueSize: 0,
    queueFlushesCount: 0,
    cancelledGenerationsCount: 0,
    recordingDurationMs: 0,
    playbackDurationMs: 0,
    speechDetectionCount: 0,
    microphoneUptimeMs: 0,
    conversationDurationMs: 0,
    averageGenerationLatencyMs: 0,
    averageResponseSizeBytes: 0,
    interruptedGenerationsCount: 0,
    recoveredTurnsCount: 0,
    conversationCount: 0,
    memoryUsageBytes: 0,
    latestPromptSizeBytes: 0,
    maxGenerationLatencyMs: 0,
    minGenerationLatencyMs: 0,
    p95GenerationLatencyMs: 0,
    droppedResponsesCount: 0,
    lastLatencyMeasurement: null,
  };

  private generationLatencies: number[] = [];
  private responseSizes: number[] = [];
  private latencies: number[] = [];
  private recoveryDurations: number[] = [];

  public recordInterruption(latencyMs: number): void {
    this.metrics.interruptionCount++;
    if (latencyMs > 0) {
      this.latencies.push(latencyMs);
      
      if (this.metrics.fastestLatencyMs === null || latencyMs < this.metrics.fastestLatencyMs) {
        this.metrics.fastestLatencyMs = Math.round(latencyMs);
      }
      if (this.metrics.slowestLatencyMs === null || latencyMs > this.metrics.slowestLatencyMs) {
        this.metrics.slowestLatencyMs = Math.round(latencyMs);
      }
      
      if (this.latencies.length > 100) this.latencies.shift();
      const sum = this.latencies.reduce((a, b) => a + b, 0);
      this.metrics.averageLatencyMs = Math.round(sum / this.latencies.length);
    }
    this.broadcast();
  }

  public updateLatencyMeasurement(measurement: Partial<LatencyMeasurement>): void {
    if (!this.metrics.lastLatencyMeasurement) {
      this.metrics.lastLatencyMeasurement = {
        interruptDetectedAt: null,
        playbackStopRequestedAt: null,
        playbackActuallyStoppedAt: null,
        interruptionToSilenceMs: null,
      };
    }
    this.metrics.lastLatencyMeasurement = {
      ...this.metrics.lastLatencyMeasurement,
      ...measurement,
    };
    this.broadcast();
  }

  public incrementCancelledPlayback(): void {
    this.metrics.cancelledPlaybackCount++;
    this.broadcast();
  }

  public incrementDroppedStale(): void {
    this.metrics.droppedStaleResponsesCount++;
    this.broadcast();
  }
  
  public addRecordingDuration(ms: number): void {
    this.metrics.recordingDurationMs += ms;
    this.broadcast();
  }

  public addPlaybackDuration(ms: number): void {
    this.metrics.playbackDurationMs += ms;
    this.broadcast();
  }
  
  public incrementSpeechDetection(): void {
    this.metrics.speechDetectionCount++;
    this.broadcast();
  }
  
  public addMicrophoneUptime(ms: number): void {
    this.metrics.microphoneUptimeMs += ms;
    this.broadcast();
  }

  public incrementConversationCount(): void {
    this.metrics.conversationCount++;
    this.broadcast();
  }

  public addConversationDuration(ms: number): void {
    this.metrics.conversationDurationMs += ms;
    this.broadcast();
  }

  public recordGenerationLatency(ms: number): void {
    this.generationLatencies.push(ms);
    if (this.generationLatencies.length > 100) this.generationLatencies.shift();
    
    const sorted = [...this.generationLatencies].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    this.metrics.averageGenerationLatencyMs = Math.round(sum / sorted.length);
    this.metrics.minGenerationLatencyMs = sorted[0] || 0;
    this.metrics.maxGenerationLatencyMs = sorted[sorted.length - 1] || 0;
    
    const p95Index = Math.floor(sorted.length * 0.95);
    this.metrics.p95GenerationLatencyMs = sorted[p95Index] || 0;
    
    this.broadcast();
  }

  public incrementDroppedResponses(): void {
    this.metrics.droppedResponsesCount++;
    this.broadcast();
  }

  public incrementCancelledGenerations(): void {
    this.metrics.cancelledGenerationsCount++;
    this.broadcast();
  }

  public incrementQueueFlushes(): void {
    this.metrics.queueFlushesCount++;
    this.broadcast();
  }

  public recordResponseSize(bytes: number): void {
    this.responseSizes.push(bytes);
    if (this.responseSizes.length > 100) this.responseSizes.shift();
    const sum = this.responseSizes.reduce((a, b) => a + b, 0);
    this.metrics.averageResponseSizeBytes = Math.round(sum / this.responseSizes.length);
    this.broadcast();
  }

  public incrementInterruptedGenerations(): void {
    this.metrics.interruptedGenerationsCount++;
    this.broadcast();
  }

  public incrementRecoveredTurns(): void {
    this.metrics.recoveredTurnsCount++;
    this.broadcast();
  }

  public updateMemoryUsage(bytes: number): void {
    this.metrics.memoryUsageBytes = bytes;
    this.broadcast();
  }

  public updatePromptSize(bytes: number): void {
    this.metrics.latestPromptSizeBytes = bytes;
    this.broadcast();
  }

  public recordRecovery(durationMs: number): void {
    this.recoveryDurations.push(durationMs);
    if (this.recoveryDurations.length > 100) this.recoveryDurations.shift();
    const sum = this.recoveryDurations.reduce((a, b) => a + b, 0);
    this.metrics.recoveryDurationMs = Math.round(sum / this.recoveryDurations.length);
    this.broadcast();
  }

  public updateQueueSizes(audio: number, generation: number): void {
    this.metrics.audioQueueSize = audio;
    this.metrics.generationQueueSize = generation;
    this.broadcast();
  }

  public getMetrics(): ExtendedEngineMetrics {
    return { ...this.metrics, lastLatencyMeasurement: this.metrics.lastLatencyMeasurement ? { ...this.metrics.lastLatencyMeasurement } : null };
  }

  public getSnapshot(): ExtendedEngineMetrics {
    return this.getMetrics();
  }
  
  public reset(): void {
    this.metrics = {
      interruptionCount: 0,
      averageLatencyMs: 0,
      fastestLatencyMs: null,
      slowestLatencyMs: null,
      cancelledPlaybackCount: 0,
      droppedStaleResponsesCount: 0,
      recoveryDurationMs: 0,
      audioQueueSize: 0,
      generationQueueSize: 0,
      queueFlushesCount: 0,
      cancelledGenerationsCount: 0,
      recordingDurationMs: 0,
      playbackDurationMs: 0,
      speechDetectionCount: 0,
      microphoneUptimeMs: 0,
      conversationDurationMs: 0,
      averageGenerationLatencyMs: 0,
      averageResponseSizeBytes: 0,
      interruptedGenerationsCount: 0,
      recoveredTurnsCount: 0,
      conversationCount: 0,
      memoryUsageBytes: 0,
      latestPromptSizeBytes: 0,
      maxGenerationLatencyMs: 0,
      minGenerationLatencyMs: 0,
      p95GenerationLatencyMs: 0,
      droppedResponsesCount: 0,
      lastLatencyMeasurement: null,
    };
    this.latencies = [];
    this.recoveryDurations = [];
    this.generationLatencies = [];
    this.responseSizes = [];
    this.broadcast();
  }

  private broadcast(): void {
    eventBus.emit("metrics:update", this.metrics);
  }
}

export const metricsTracker = new MetricsTracker();
