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
    const handlers = this.listeners[event] ?? [];
    const typedHandlers = handlers as Array<EventCallback<EngineEventPayloads[K]>>;
    typedHandlers.push(callback);
    // Bypass TS compiler limitation: mapping generic unions to indexed arrays resolves to 'never'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.listeners as any)[event] = typedHandlers;

    // Return unsubscribe function
    return () => {
      const currentHandlers = this.listeners[event];
      if (currentHandlers) {
        const index = (currentHandlers as Array<unknown>).indexOf(callback);
        if (index > -1) {
          currentHandlers.splice(index, 1);
        }
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
    console.log(`[EVENT_BUS] emit: ${event}`, typeof payload === 'object' ? JSON.stringify(payload) : payload);
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
