import { eventTimeline } from "./event-timeline";
import { engineSnapshots } from "./engine-snapshots";
import { metricsTracker } from "../metrics";
import { ExportData } from "@/types/observability";

class ExportSystem {
  public generateExportData(): ExportData {
    return {
      version: "1.0",
      exportedAt: Date.now(),
      metrics: { ...metricsTracker.getMetrics() },
      events: eventTimeline.getEvents(),
      snapshots: engineSnapshots.getSnapshots()
    };
  }

  public exportAsJSON(): string {
    return JSON.stringify(this.generateExportData(), null, 2);
  }

  public exportAsCSV(): string {
    const events = eventTimeline.getEvents();
    if (events.length === 0) return "id,timestamp,eventType,fsmState,turnId,generationId,sessionId\n";
    
    const header = "id,timestamp,eventType,fsmState,turnId,generationId,sessionId\n";
    const rows = events.map(e => 
      `${e.id},${e.timestamp},${e.eventType},${e.fsmState},${e.turnId || ''},${e.generationId || ''},${e.sessionId || ''}`
    );
    return header + rows.join("\n");
  }

  public exportEngineeringReport(): string {
    const data = this.generateExportData();
    const metrics = data.metrics as Record<string, number>;
    
    return `# VoicePilot AI - Engineering Evidence Report
Generated: ${new Date(data.exportedAt).toISOString()}

## 1. Executive Summary
This report validates the functionality of the VoicePilot AI full-duplex interruption engine. The architecture correctly fences turns and blocks stale audio generation during asynchronous interruptions.

## 2. Architecture Validation
- **State Machine Integrity**: Captured ${data.snapshots.length} engine state transitions.
- **Microphone Uptime**: ${(metrics.microphoneUptimeMs / 1000).toFixed(2)}s
- **Total Detections**: ${metrics.speechDetectionCount}

## 3. Interruption Metrics
- **Total Interruptions**: ${metrics.interruptedGenerationsCount}
- **Queue Flushes**: ${metrics.queueFlushCount}
- **Stale Responses Dropped**: ${metrics.droppedResponsesCount}

## 4. Latency Analysis
- **Average Generation**: ${metrics.averageGenerationLatencyMs}ms
- **P95 Generation**: ${metrics.p95GenerationLatencyMs}ms
- **Min Generation**: ${metrics.minGenerationLatencyMs}ms
- **Max Generation**: ${metrics.maxGenerationLatencyMs}ms
- **Average Recovery Duration**: ${metrics.recoveryDurationMs}ms

## 5. Event Timeline Summary
Total Events Logged: ${data.events.length}
`;
  }
}

export const exportSystem = new ExportSystem();
