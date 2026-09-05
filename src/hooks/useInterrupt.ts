"use client";

import { useState, useEffect } from "react";
import { EngineState, EngineMetrics, TurnContext } from "@/types/interrupt";
import { eventBus } from "@/lib/event-bus";
import { interruptEngine } from "@/lib/interrupt-engine";
import { metricsTracker } from "@/lib/metrics";
import { voiceSessionManager } from "@/lib/voice-session-manager";
import { playbackController } from "@/lib/playback-controller";

/**
 * Connects the React view layer to the decoupled event-driven Interrupt Engine.
 */
export function useInterrupt() {
  const [engineState, setEngineState] = useState<EngineState>(interruptEngine.getState());
  const [metrics, setMetrics] = useState<EngineMetrics>(metricsTracker.getSnapshot());
  const [activeContext, setActiveContext] = useState<TurnContext | null>(voiceSessionManager.getActiveContext());

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
      setActiveContext(voiceSessionManager.getActiveContext());
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
    eventBus.emit("vad:change", {
      status: "DETECTED",
      rms: 0,
    });

    setTimeout(() => {
      eventBus.emit("vad:change", {
        status: "SILENT",
        rms: 0,
      });
    }, 1800);
  };

  const simulateInterrupt = () => {
    interruptEngine.interrupt();
  };

  const simulateRapidInterruptions = () => {
    let i = 0;

    const interval = setInterval(() => {
      eventBus.emit("vad:change", {
        status: i % 2 === 0 ? "DETECTED" : "SILENT",
        rms: 0,
      });

      i++;

      if (i > 8) clearInterval(interval);
    }, 400);
  };

  const simulateStaleResponse = () => {
    const context = voiceSessionManager.getActiveContext();
    if (!context) {
      voiceSessionManager.startTurn();
    }
    
    // Grab the generation ID right now
    const initialContext = voiceSessionManager.getActiveContext()!;
    
    // Force a new turn to make the previous one stale
    setTimeout(() => {
      voiceSessionManager.startTurn();
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
    const ctx = voiceSessionManager.getActiveContext();
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
