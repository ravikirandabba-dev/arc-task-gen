import { GenerationId } from "@/types/interrupt";

/**
 * Manages native AbortControllers bound to specific generation lifecycles.
 * Essential for terminating pending fetch/Websocket tasks mid-flight.
 */
class AbortControllerManager {
  private controllers: Map<GenerationId, AbortController> = new Map();

  /**
   * Retrieves or creates an AbortController for a specific generation task.
   */
  public getController(id: GenerationId): AbortController {
    let controller = this.controllers.get(id);
    if (!controller) {
      controller = new AbortController();
      this.controllers.set(id, controller);
    }
    return controller;
  }

  /**
   * Removes an AbortController without aborting it (used upon success).
   */
  public remove(id: GenerationId): void {
    this.controllers.delete(id);
  }

  /**
   * Aborts a specific generation task.
   */
  public abort(id: GenerationId): void {
    const controller = this.controllers.get(id);
    if (controller) {
      controller.abort();
      this.controllers.delete(id);
    }
  }

  /**
   * Aborts all tracked generation tasks, typically used during a hard interruption flush.
   */
  public abortAll(): void {
    let abortedCount = 0;
    this.controllers.forEach((controller) => {
      controller.abort();
      abortedCount++;
    });
    this.controllers.clear();
    
    if (abortedCount > 0) {
      import("./metrics").then(m => {
        for(let i=0; i<abortedCount; i++) m.metricsTracker.incrementCancelledGenerations();
      });
    }
  }
}

export const abortControllerManager = new AbortControllerManager();
