import { eventTimeline } from "./event-timeline";
import { EngineEvent } from "@/types/observability";

export class ReplayEngine {
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private timer: NodeJS.Timeout | null = null;
  private listeners: Array<(event: EngineEvent, index: number) => void> = [];

  public play(speed: number = 1): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.tick(speed);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  public resume(speed: number = 1): void {
    this.play(speed);
  }

  public stepForward(): void {
    this.pause();
    this.advance(1);
  }

  public stepBackward(): void {
    this.pause();
    this.advance(-1);
  }

  public seek(index: number): void {
    const events = eventTimeline.getEvents();
    if (index >= 0 && index < events.length) {
      this.currentIndex = index;
      this.notifyListeners(events[this.currentIndex]);
    }
  }

  public jumpToInterruption(): void {
    const events = eventTimeline.getEvents();
    const index = events.findIndex((e, i) => i > this.currentIndex && e.eventType === "interruption:triggered");
    if (index !== -1) this.seek(index);
  }

  public jumpToRecovery(): void {
    const events = eventTimeline.getEvents();
    const index = events.findIndex((e, i) => i > this.currentIndex && e.eventType === "TURN_RECOVERED");
    if (index !== -1) this.seek(index);
  }

  public onStep(callback: (event: EngineEvent, index: number) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private advance(delta: number): void {
    const events = eventTimeline.getEvents();
    const nextIndex = this.currentIndex + delta;
    if (nextIndex >= 0 && nextIndex < events.length) {
      this.currentIndex = nextIndex;
      this.notifyListeners(events[this.currentIndex]);
    } else {
      this.pause(); // Reached end or beginning
    }
  }

  private tick(speed: number): void {
    if (!this.isPlaying) return;
    
    const events = eventTimeline.getEvents();
    if (this.currentIndex < events.length - 1) {
      const currentEvent = events[this.currentIndex];
      const nextEvent = events[this.currentIndex + 1];
      const delay = (nextEvent.timestamp - currentEvent.timestamp) / speed;
      
      this.timer = setTimeout(() => {
        this.advance(1);
        if (this.isPlaying) this.tick(speed);
      }, Math.max(delay, 10)); // Min 10ms step
    } else {
      this.pause();
    }
  }

  private notifyListeners(event: EngineEvent): void {
    this.listeners.forEach(cb => cb(event, this.currentIndex));
  }
}

export const replayEngine = new ReplayEngine();
