import { EngineEvent, TimelineFilter } from "@/types/observability";
import { TurnId, SessionId } from "@/types/interrupt";

class EventTimeline {
  private events: EngineEvent[] = [];

  public push(event: EngineEvent): void {
    this.events.push(event);
  }

  public getEvents(filter?: TimelineFilter): EngineEvent[] {
    if (!filter) return [...this.events];

    return this.events.filter(e => {
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      if (filter.turnId && e.turnId !== filter.turnId) return false;
      if (filter.sessionId && e.sessionId !== filter.sessionId) return false;
      if (filter.generationId && e.generationId !== filter.generationId) return false;
      return true;
    });
  }

  public groupByTurn(): Record<TurnId, EngineEvent[]> {
    return this.events.reduce((acc, event) => {
      if (event.turnId) {
        if (!acc[event.turnId]) acc[event.turnId] = [];
        acc[event.turnId].push(event);
      }
      return acc;
    }, {} as Record<TurnId, EngineEvent[]>);
  }

  public groupBySession(): Record<SessionId, EngineEvent[]> {
    return this.events.reduce((acc, event) => {
      if (event.sessionId) {
        if (!acc[event.sessionId]) acc[event.sessionId] = [];
        acc[event.sessionId].push(event);
      }
      return acc;
    }, {} as Record<SessionId, EngineEvent[]>);
  }

  public clear(): void {
    this.events = [];
  }
}

export const eventTimeline = new EventTimeline();
