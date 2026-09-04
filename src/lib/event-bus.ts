import { EngineEventPayloads } from "@/types/interrupt";

type EventCallback<T> = (payload: T) => void;

/**
 * Type-safe central event bus decoupling the voice engine modules.
 */
class EventBus {
  private listeners: {
    [K in keyof EngineEventPayloads]?: Array<(payload: EngineEventPayloads[K]) => void>;
  } = {};
  
  private wildcardListeners: Array<(type: keyof EngineEventPayloads, payload: unknown) => void> = [];

  /**
   * Subscribe to a specific engine event.
   */
  public on<K extends keyof EngineEventPayloads>(
    event: K,
    callback: EventCallback<EngineEventPayloads[K]>
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners[event]) {
        // @ts-expect-error Type matching complex discriminated unions
        this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
      }
    };
  }

  public onAny(callback: (type: keyof EngineEventPayloads, payload: unknown) => void): () => void {
    this.wildcardListeners.push(callback);
    return () => {
      this.wildcardListeners = this.wildcardListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit an engine event to all subscribers.
   */
  public emit<K extends keyof EngineEventPayloads>(
    event: K,
    payload: EngineEventPayloads[K]
  ): void {
    if (this.listeners[event]) {
      this.listeners[event]!.forEach((cb) => {
        try {
          cb(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
    
    this.wildcardListeners.forEach(cb => {
      try {
        cb(event, payload);
      } catch (error) {
        console.error(`Error in wildcard event listener for ${event}:`, error);
      }
    });
  }
}

// Export singleton
export const eventBus = new EventBus();
