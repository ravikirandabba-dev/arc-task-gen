"use client";

import React from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { useJudgeMode } from "@/hooks/useJudgeMode";
import { useInterrupt } from "@/hooks/useInterrupt";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { Play, Pause, SkipForward, RotateCcw, XSquare, PlayCircle, ShieldCheck } from "lucide-react";
import { VOICE_CONFIG } from "@/config/voice";
import { ExtendedEngineMetrics } from "@/lib/metrics";

export function JudgeMode() {
  const { sceneNumber, sceneTitle, isPaused, actions } = useJudgeMode();
  const { state, metrics } = useInterrupt();
  const extMetrics = metrics as ExtendedEngineMetrics;

  const threshold = VOICE_CONFIG.testing.interruptToSilenceThresholdMs;
  const avgLatency = extMetrics.averageLatencyMs || 0;
  const isPass = avgLatency > 0 && avgLatency <= threshold;

  return (
    <section className="py-24 relative z-20 bg-[#02040a] border-y border-white/5">
      <Container>
        <SectionHeading 
          title="Judge Mode (Automated Demo)" 
          subtitle="Guided visualization of the true interruption and recovery sequence without requiring microphone access." 
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-12">
          
          {/* Controls */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <GlassCard className="flex flex-col gap-4">
               <h3 className="font-heading font-semibold text-lg text-white mb-2">Demo Controls</h3>
               
               {sceneNumber === 0 ? (
                 <Button onClick={actions.beginDemo} className="w-full justify-start border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/40">
                   <PlayCircle size={16} className="mr-2" /> Begin Demo
                 </Button>
               ) : (
                 <>
                   {!isPaused ? (
                     <Button onClick={actions.pause} className="w-full justify-start" variant="secondary">
                       <Pause size={16} className="mr-2" /> Pause
                     </Button>
                   ) : (
                     <Button onClick={actions.resume} className="w-full justify-start border-green-500/30 text-green-400 hover:bg-green-500/20" variant="outline">
                       <Play size={16} className="mr-2" /> Resume
                     </Button>
                   )}
                   <Button onClick={actions.skipScene} className="w-full justify-start" variant="outline">
                     <SkipForward size={16} className="mr-2" /> Skip Scene
                   </Button>
                   <Button onClick={actions.restart} className="w-full justify-start" variant="outline">
                     <RotateCcw size={16} className="mr-2" /> Restart
                   </Button>
                   <Button onClick={actions.exitDemo} className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/20" variant="outline">
                     <XSquare size={16} className="mr-2" /> Exit Demo
                   </Button>
                 </>
               )}
            </GlassCard>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {sceneNumber > 0 && sceneNumber < 9 && (
              <GlassCard className="flex flex-col items-center justify-center py-12 border-purple-500/20 relative overflow-hidden h-64">
                <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-mono text-purple-400/50 uppercase tracking-widest">
                  Scene {sceneNumber} / 8
                </div>
                <div className="text-3xl md:text-4xl font-heading font-bold animate-in fade-in zoom-in duration-300 text-white text-center">
                  {sceneTitle}
                </div>
                <div className="mt-8 text-sm font-mono text-white/50 uppercase tracking-widest flex gap-8">
                   <span>Engine: {state}</span>
                   <span>Latency: {extMetrics.lastLatencyMeasurement?.interruptionToSilenceMs ?? '--'}ms</span>
                </div>
              </GlassCard>
            )}

            {sceneNumber === 9 && (
              <GlassCard className={`flex flex-col py-8 ${isPass ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck size={24} className={isPass ? 'text-green-400' : 'text-red-400'} />
                  <h3 className="font-heading font-bold text-2xl text-white">Engineering Summary</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Avg Latency</span>
                    <span className="text-2xl font-bold text-white">{avgLatency}ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Fastest</span>
                    <span className="text-2xl font-bold text-white">{extMetrics.fastestLatencyMs ?? '--'}ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Slowest</span>
                    <span className="text-2xl font-bold text-white">{extMetrics.slowestLatencyMs ?? '--'}ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Recovery</span>
                    <span className="text-2xl font-bold text-white">{extMetrics.recoveryDurationMs}ms</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-orange-400/70 uppercase">Dropped Stale</span>
                    <span className="text-2xl font-bold text-orange-400">{extMetrics.droppedStaleResponsesCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-red-400/70 uppercase">Queue Flushes</span>
                    <span className="text-2xl font-bold text-red-400">{extMetrics.queueFlushesCount ?? 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Aborted Gens</span>
                    <span className="text-2xl font-bold text-white">{extMetrics.cancelledGenerationsCount ?? 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono text-white/50 uppercase">Threshold</span>
                    <span className="text-2xl font-bold text-white">&le; {threshold}ms</span>
                  </div>
                </div>

                <div className={`mt-4 py-4 px-6 rounded text-xl font-bold tracking-widest uppercase text-center ${isPass ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                  {isPass ? "PASS" : "FAIL"}
                </div>
              </GlassCard>
            )}

            {sceneNumber === 0 && (
               <GlassCard className="flex flex-col items-center justify-center py-20 border-white/5 text-white/30 h-64">
                 <PlayCircle size={48} className="mb-4 opacity-20" />
                 <p className="font-heading text-lg">Click Begin Demo to start the automated sequence.</p>
               </GlassCard>
            )}

          </div>
        </div>
      </Container>
    </section>
  );
}
