"use client";

import React from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { useInterrupt } from "@/hooks/useInterrupt";
import { TurnInspector } from "./TurnInspector";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Activity, ShieldAlert, FastForward, Clock, Gauge, Database, Trash2 } from "lucide-react";
import { EngineState } from "@/types/interrupt";

export function InterruptDebugger() {
  const { state, metrics, activeContext, actions } = useInterrupt();

  const getStateColor = (s: EngineState) => {
    switch (s) {
      case EngineState.IDLE: return "text-white/50";
      case EngineState.LISTENING: return "text-green-400";
      case EngineState.THINKING: return "text-purple-400";
      case EngineState.SPEAKING: return "text-[var(--primary)]";
      case EngineState.INTERRUPTED: return "text-red-400";
      case EngineState.RECOVERING: return "text-orange-400";
      default: return "text-white";
    }
  };

  return (
    <section className="py-24 relative z-20 bg-[#02040a]">
      <Container>
        <SectionHeading 
          title="Interruption & Recovery Engine" 
          subtitle="Provider-agnostic core validating strict Turn Fencing and queue purging." 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          
          {/* Controls & Simulators */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <h3 className="font-heading font-semibold text-lg text-white mb-2">Simulate Events</h3>
            
            <Button onClick={actions.simulateStartSpeaking} className="w-full justify-start" variant="secondary">
              Start Speaking
            </Button>
            <Button onClick={actions.simulateInterrupt} className="w-full justify-start bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white border border-red-500/30">
              <ShieldAlert size={16} className="mr-2" /> Trigger Interrupt
            </Button>
            <Button onClick={actions.simulateRapidInterruptions} className="w-full justify-start" variant="outline">
              <FastForward size={16} className="mr-2" /> Rapid Interruptions (x5)
            </Button>
            <Button onClick={actions.simulateStaleResponse} className="w-full justify-start border-orange-500/30 text-orange-400 hover:bg-orange-500/20" variant="outline">
              <Clock size={16} className="mr-2" /> Generate Stale Response
            </Button>
            <Button onClick={actions.simulateQueueMultiple} className="w-full justify-start" variant="outline">
              <Database size={16} className="mr-2" /> Queue Multiple Buffers
            </Button>
            
            <div className="mt-8">
              <TurnInspector context={activeContext} />
            </div>
          </div>

          {/* Engine State & Metrics */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Live State Tracker */}
            <GlassCard className="md:col-span-2 flex flex-col items-center justify-center py-12 border-white/10 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-white/40 uppercase tracking-widest">
                <Activity size={14} /> FSM Engine State
              </div>
              <div className={`text-4xl md:text-5xl font-heading font-bold animate-in fade-in zoom-in duration-300 ${getStateColor(state)}`}>
                {state}
              </div>
            </GlassCard>

            {/* Metrics */}
            <GlassCard className="flex flex-col gap-2 border-red-500/10">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <ShieldAlert size={12} /> Interruptions Handled
              </div>
              <div className="text-3xl font-heading font-bold text-white">
                {metrics.interruptionCount}
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2 border-orange-500/10">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <Gauge size={12} /> Avg Recovery Latency
              </div>
              <div className="text-3xl font-heading font-bold text-white">
                {metrics.averageLatencyMs} <span className="text-sm font-sans text-white/40 font-normal">ms</span>
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <Trash2 size={12} /> Dropped Stale Responses
              </div>
              <div className="text-3xl font-heading font-bold text-orange-400">
                {metrics.droppedStaleResponsesCount}
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <Trash2 size={12} /> Cancelled Playbacks
              </div>
              <div className="text-3xl font-heading font-bold text-red-400">
                {metrics.cancelledPlaybackCount}
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <Database size={12} /> Audio Queue Depth
              </div>
              <div className="text-3xl font-heading font-bold text-white">
                {metrics.audioQueueSize}
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 flex items-center gap-1 mb-2">
                <Clock size={12} /> Last Recovery Duration
              </div>
              <div className="text-3xl font-heading font-bold text-white">
                {metrics.recoveryDurationMs} <span className="text-sm font-sans text-white/40 font-normal">ms</span>
              </div>
            </GlassCard>

          </div>
        </div>
      </Container>
    </section>
  );
}
