"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { GlassCard } from "../ui/GlassCard";
import { useInterrupt } from "@/hooks/useInterrupt";
import { eventBus } from "@/lib/event-bus";
import { MicStatus, VADStatus } from "@/types/interrupt";
import { Terminal, Hash, Activity } from "lucide-react";
import { ExtendedEngineMetrics } from "@/lib/metrics";
import { engineLogger } from "@/lib/observability/engine-logger";
import { exportSystem } from "@/lib/observability/export-system";
import { replayEngine } from "@/lib/observability/replay-engine";

export function DeveloperDiagnostics() {
  const { state, metrics, activeContext } = useInterrupt();
  const extMetrics = metrics as ExtendedEngineMetrics;

  const [micStatus, setMicStatus] = useState<MicStatus>("OFF");
  const [vadStatus, setVadStatus] = useState<VADStatus>("SILENT");
  const [sessionId, setSessionId] = useState<string>("NONE");
  const [events, setEvents] = useState<{eventType: string, timestamp: number, data?: Record<string, unknown> | unknown}[]>([]);

  const activeIntent = useMemo(() => {
    return (events.find(e => e.eventType === "CONVERSATION_INTENT_ANALYZED")?.data as { intent?: string })?.intent || 'General';
  }, [events]);

  useEffect(() => {
    engineLogger.initialize();
    
    const unsubMic = eventBus.on("mic:status", (p) => setMicStatus(p.status));
    const unsubVad = eventBus.on("vad:change", (p) => setVadStatus(p.status));
    const unsubSess = eventBus.on("SESSION_STARTED", (p) => setSessionId(p.sessionId));
    const unsubLog = eventBus.on("event:log", (p) => {
      setEvents((prev) => [{ eventType: p.eventType, timestamp: p.timestamp, data: p.data }, ...prev].slice(0, 30));
    });
    
    // Also track direct intent events
    const unsubIntent = eventBus.on("CONVERSATION_INTENT_ANALYZED", (p) => {
       setEvents((prev) => [{ eventType: "CONVERSATION_INTENT_ANALYZED", timestamp: p.timestamp, data: { intent: p.intent } }, ...prev].slice(0, 30));
    });

    return () => {
      unsubMic();
      unsubVad();
      unsubSess();
      unsubLog();
      unsubIntent();
    };
  }, []);

  useEffect(() => {
    engineLogger.setFsmState(state);
  }, [state]);

  const handleExport = () => {
    const report = exportSystem.exportEngineeringReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ENGINEERING_REPORT.md';
    a.click();
  };

  return (
    <section id="architecture" className="py-24 relative z-20 bg-[#000000]">
      <Container>
        <div className="flex justify-between items-start mb-12">
          <SectionHeading 
            title="Developer Diagnostics" 
            subtitle="Real-time metrics, pipeline events, and engine state from the Phase 8 layer." 
          />
          <button 
            aria-label="Export Engineering Report"
            onClick={handleExport}
            className="px-4 py-2 border border-purple-500/30 text-purple-400 font-mono text-sm hover:bg-purple-500/10 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors mt-8"
          >
            Export Report
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          
          <div className="lg:col-span-1 flex flex-col gap-4">
             <GlassCard className="flex flex-col gap-4 border-blue-500/20">
               <h3 className="font-heading font-semibold text-lg text-blue-400 flex items-center gap-2">
                 <Hash size={16} /> Identifiers
               </h3>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Session ID</span>
                 <span className="text-sm font-mono text-white/90 truncate">{sessionId}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Turn ID</span>
                 <span className="text-sm font-mono text-white/90 truncate">{activeContext?.turnId || 'NONE'}</span>
               </div>
               <div className="flex flex-col gap-1">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Generation ID</span>
                 <span className="text-sm font-mono text-white/90 truncate">{activeContext?.generationId || 'NONE'}</span>
               </div>
               <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-white/10">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Topic</span>
                 <span className="text-sm font-mono text-purple-400 truncate">{activeIntent}</span>
               </div>
               <div className="flex flex-col gap-1 mt-2">
                 <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">Provider</span>
                 <span className="text-sm font-mono text-green-400 truncate">DEVELOPMENT_LLM & ADAPTER</span>
               </div>
             </GlassCard>
             
             <GlassCard className="flex flex-col gap-4 border-purple-500/20">
               <h3 className="font-heading font-semibold text-lg text-purple-400 flex items-center gap-2">
                 <Activity size={16} /> Pipeline Status
               </h3>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-mono uppercase text-white/50">Engine State</span>
                 <span className="text-sm font-bold text-white">{state}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-mono uppercase text-white/50">Microphone</span>
                 <span className="text-sm font-bold text-white">{micStatus}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-mono uppercase text-white/50">VAD</span>
                 <span className="text-sm font-bold text-white">{vadStatus}</span>
               </div>
               <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                 <span className="text-xs font-mono uppercase text-white/50">Prompt Size</span>
                 <span className="text-sm font-bold text-white">{(extMetrics.latestPromptSizeBytes / 1024).toFixed(2)} KB</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-mono uppercase text-white/50">Memory Usage</span>
                 <span className="text-sm font-bold text-white">{(extMetrics.memoryUsageBytes / 1024).toFixed(2)} KB</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-mono uppercase text-white/50">Response Size</span>
                 <span className="text-sm font-bold text-white">{(extMetrics.averageResponseSizeBytes / 1024).toFixed(2)} KB</span>
               </div>
             </GlassCard>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Conv Length</div>
              <div className="text-3xl font-bold text-white">{extMetrics.conversationCount}</div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Avg Gen Latency</div>
              <div className="text-3xl font-bold text-white">{extMetrics.averageGenerationLatencyMs}ms</div>
            </GlassCard>
            
            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Recovered Turns</div>
              <div className="text-3xl font-bold text-white">{extMetrics.recoveredTurnsCount}</div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Avg Recovery</div>
              <div className="text-3xl font-bold text-white">{extMetrics.recoveryDurationMs}ms</div>
            </GlassCard>
            
            <GlassCard className="md:col-span-4 flex flex-col gap-2 h-72 overflow-y-auto mt-4 border-white/5">
              <div className="flex items-center justify-between sticky top-0 bg-[#000000] pb-2 border-b border-white/5 z-10">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/50">
                  <Terminal size={14} /> Pipeline Event Log
                </div>
                <div className="flex items-center gap-2">
                  <button aria-label="Step Backward" onClick={() => replayEngine.stepBackward()} className="px-2 py-1 text-[10px] uppercase font-mono border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500">Step Back</button>
                  <button aria-label="Play Replay" onClick={() => replayEngine.play(1)} className="px-2 py-1 text-[10px] uppercase font-mono border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500">Play</button>
                  <button aria-label="Pause Replay" onClick={() => replayEngine.pause()} className="px-2 py-1 text-[10px] uppercase font-mono border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500">Pause</button>
                  <button aria-label="Step Forward" onClick={() => replayEngine.stepForward()} className="px-2 py-1 text-[10px] uppercase font-mono border border-white/20 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-purple-500">Step Fwd</button>
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                {events.map((ev, i) => (
                  <div key={i} className="flex gap-4 text-sm font-mono items-center hover:bg-white/5 px-2 py-1 rounded">
                     <span className="text-white/30 shrink-0 w-24">{(ev.timestamp / 1000).toFixed(3)}s</span>
                     <span className={`
                       ${ev.eventType.includes('STALE') ? 'text-orange-400' : ''}
                       ${ev.eventType.includes('INTERRUPT') ? 'text-red-400' : ''}
                       ${ev.eventType.includes('MIC') ? 'text-green-400' : ''}
                       ${ev.eventType.includes('PLAYBACK') ? 'text-blue-400' : ''}
                       ${ev.eventType.includes('GENERATION') ? 'text-purple-400' : ''}
                       ${ev.eventType.includes('RECORDING') ? 'text-yellow-400' : 'text-white/80'}
                     `}>{ev.eventType}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
          
        </div>
      </Container>
    </section>
  );
}


