"use client";

import { useEffect, useState } from "react";
import { judgeOrchestrator } from "@/lib/judge-orchestrator";
import { eventBus } from "@/lib/event-bus";

export function useJudgeMode() {
  const [sceneNumber, setSceneNumber] = useState(0);
  const [sceneTitle, setSceneTitle] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  
  useEffect(() => {
    const unsub = eventBus.on("demo:scene", (payload) => {
      setSceneNumber(payload.sceneNumber);
      setSceneTitle(payload.title);
    });
    return unsub;
  }, []);

  return {
    sceneNumber,
    sceneTitle,
    isPaused,
    actions: {
      beginDemo: () => judgeOrchestrator.startDemo(),
      pause: () => { judgeOrchestrator.pause(); setIsPaused(true); },
      resume: () => { judgeOrchestrator.resume(); setIsPaused(false); },
      restart: () => { judgeOrchestrator.stop(); setTimeout(() => judgeOrchestrator.startDemo(), 100); },
      skipScene: () => judgeOrchestrator.skipScene(),
      exitDemo: () => judgeOrchestrator.stop(),
    }
  };
}
