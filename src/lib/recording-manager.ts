import { eventBus } from "./event-bus";
import { microphoneManager } from "./microphone-manager";
import { metricsTracker } from "./metrics";

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private recordingStart: number | null = null;
  private resolveRecording: ((blob: Blob | null) => void) | null = null;

  public start(): void {
    const stream = microphoneManager.getStream();
    if (!stream) {
      eventBus.emit("event:log", { eventType: "RECORDING_FAILED", timestamp: performance.now(), data: { reason: "Microphone stream unavailable" }});
      console.warn("Cannot start recording, microphone stream unavailable.");
      return;
    }

    try {
      this.chunks = [];
      
      const mimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      let selectedMime = '';
      for (const mime of mimes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      
      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        if (this.resolveRecording) {
          if (this.chunks.length > 0) {
            const blob = new Blob(this.chunks, { type: selectedMime || 'audio/webm' });
            this.resolveRecording(blob);
          } else {
            this.resolveRecording(null);
          }
          this.resolveRecording = null;
        }
      };

      this.mediaRecorder.start(100); // 100ms chunks
      this.recordingStart = performance.now();
      
      eventBus.emit("RECORDING_STARTED", { timestamp: this.recordingStart });
      eventBus.emit("event:log", { eventType: "RECORDING_STARTED", timestamp: this.recordingStart });
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
    }
  }

  public stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        resolve(null);
        return;
      }
      this.resolveRecording = resolve;
      
      const now = performance.now();
      if (this.recordingStart) {
        const duration = now - this.recordingStart;
        metricsTracker.addRecordingDuration(duration);
        this.recordingStart = null;
      }

      this.mediaRecorder.stop();
      
      // We don't have the blob size synchronously, but we can emit the event logic
      eventBus.emit("RECORDING_STOPPED", { timestamp: now, durationMs: 0, blobSize: 0 });
      eventBus.emit("event:log", { eventType: "RECORDING_STOPPED", timestamp: now });
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.resolveRecording = null; // discard
      this.mediaRecorder.stop();
      
      const now = performance.now();
      eventBus.emit("RECORDING_STOPPED", { timestamp: now, durationMs: 0, blobSize: 0 });
      eventBus.emit("event:log", { eventType: "RECORDING_CANCELLED", timestamp: now });
    }
    this.chunks = [];
    this.recordingStart = null;
  }

  public dispose(): void {
    this.cancel();
    this.mediaRecorder = null;
  }
}

export const recordingManager = new RecordingManager();
