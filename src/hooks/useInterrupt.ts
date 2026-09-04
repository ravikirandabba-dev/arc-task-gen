"use client";

import { useEffect, useState } from "react";
import { EngineState, EngineMetrics, TurnContext } from "@/types/interrupt";
import { eventBus } from "@/lib/event-bus";
import { interruptEngine } from "@/lib/interrupt-engine";
import { metricsTracker } from "@/lib/metrics";
import { turnManager } from "@/lib/turn-manager";
import { playbackController } from "@/lib/playback-controller";

/**
 * Connects the React view layer to the decoupled event-driven Interrupt Engine.
 */
export function useInterrupt() {
  const [engineState, setEngineState] = useState<EngineState>(interruptEngine.getState());
  const [metrics, setMetrics] = useState<EngineMetrics>(metricsTracker.getSnapshot());
  const [activeContext, setActiveContext] = useState<TurnContext | null>(turnManager.getActiveContext());

  useEffect(() => {
    const unsubState = eventBus.on("state:change", (payload) => {
      setEngineState(payload.current);
    });

    const unsubTurn = eventBus.on("turn:new", (payload) => {
      setActiveContext(payload);
    });

    const unsubMetrics = eventBus.on("metrics:update", (payload) => {
      setMetrics(payload);
    });

    // Invalidation event watcher
    const unsubInterrupt = eventBus.on("interruption:triggered", () => {
      setActiveContext(turnManager.getActiveContext());
    });

    return () => {
      unsubState();
      unsubTurn();
      unsubMetrics();
      unsubInterrupt();
    };
  }, []);

  // --- Simulation Actions ---

  const simulateStartSpeaking = () => {
    if (engineState === EngineState.IDLE) {
      turnManager.startTurn();
    }
    interruptEngine.startThinking();
  };

  const simulateInterrupt = () => {
    interruptEngine.interrupt();
  };

  const simulateRapidInterruptions = () => {
    let count = 0;
    const interval = setInterval(() => {
      if (count % 2 === 0) {
        simulateStartSpeaking();
      } else {
        interruptEngine.interrupt();
      }
      count++;
      if (count > 9) clearInterval(interval);
    }, 300); // Trigger an interrupt/start every 300ms
  };

  const simulateStaleResponse = () => {
    const context = turnManager.getActiveContext();
    if (!context) {
      turnManager.startTurn();
    }
    
    // Grab the generation ID right now
    const initialContext = turnManager.getActiveContext()!;
    
    // Force a new turn to make the previous one stale
    setTimeout(() => {
      turnManager.startTurn();
    }, 200);

    // Attempt to enqueue playback using the original stale generation ID
    setTimeout(() => {
      playbackController.enqueue({
        playbackId: `play_${crypto.randomUUID()}`,
        generationId: initialContext.generationId,
        blob: null
      });
    }, 600);
  };

  const simulateQueueMultiple = () => {
    const ctx = turnManager.getActiveContext();
    if (!ctx) return;

    for (let i = 0; i < 5; i++) {
      playbackController.enqueue({
        playbackId: `play_${crypto.randomUUID()}`,
        generationId: ctx.generationId,
        blob: null
      });
    }
  };

  return {
    state: engineState,
    metrics,
    activeContext,
    actions: {
      simulateStartSpeaking,
      simulateInterrupt,
      simulateRapidInterruptions,
      simulateStaleResponse,
      simulateQueueMultiple,
    }
  };
}
