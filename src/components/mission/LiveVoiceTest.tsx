"use client";

import React, { useEffect, useState } from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { useInterrupt } from "@/hooks/useInterrupt";
import { TurnInspector } from "./TurnInspector";
import { GlassCard } from "../ui/GlassCard";
import { Button } from "../ui/Button";
import { microphoneManager } from "@/lib/microphone-manager";
import { playbackController } from "@/lib/playback-controller";
import { voiceSessionManager } from "@/lib/voice-session-manager";
import { eventBus } from "@/lib/event-bus";
import { VOICE_CONFIG } from "@/config/voice";
import { Mic, MicOff, ShieldAlert, FastForward, Clock, FileText } from "lucide-react";
import { MicStatus, VADStatus, PlaybackStatus } from "@/types/interrupt";

export function LiveVoiceTest() {
  const { state, metrics, activeContext, actions } = useInterrupt();
  
  const [micStatus, setMicStatus] = useState<MicStatus>("OFF");
  const [vadStatus, setVadStatus] = useState<VADStatus>("SILENT");
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("STOPPED");
  const [rimeConnected, setRimeConnected] = useState<boolean>(false);
  const [events, setEvents] = useState<{eventType: string, timestamp: number}[]>([]);

  useEffect(() => {
    const unsubMic = eventBus.on("mic:status", (p) => setMicStatus(p.status));
    const unsubVad = eventBus.on("vad:change", (p) => setVadStatus(p.status));
    const unsubPlay = eventBus.on("playback:status", (p) => setPlaybackStatus(p.status));
    const unsubLog = eventBus.on("event:log", (p) => {
      if (p.eventType === "RIME_CONNECTED") {
        setRimeConnected(true);
      }
      setEvents((prev) => [{ eventType: p.eventType, timestamp: p.timestamp }, ...prev].slice(0, 20));
    });

    return () => {
      unsubMic();
      unsubVad();
      unsubPlay();
      unsubLog();
      microphoneManager.disable();
    };
  }, []);

  const handleToggleMic = async () => {
    if (micStatus === "ON") {
      microphoneManager.disable();
    } else {
      await microphoneManager.enable();
    }
  };

  const startTestAudio = () => {
    let ctx = voiceSessionManager.getActiveContext();
    if (!ctx) {
      ctx = voiceSessionManager.startTurn();
    }
    playbackController.playTestAudio(ctx.generationId);
  };

  const latency = metrics.lastLatencyMeasurement?.interruptionToSilenceMs ?? 0;
  const threshold = VOICE_CONFIG.testing.interruptToSilenceThresholdMs;
  const isMeasured = metrics.lastLatencyMeasurement?.interruptionToSilenceMs != null;
  const isPass = isMeasured && latency <= threshold;

  return (
    <section className="py-24 relative z-20 bg-[#02040a]">
      <Container>
        <SectionHeading 
          title="Live Voice Test" 
          subtitle="Real browser microphone integration with full-duplex interruption engine." 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          
          {/* Controls */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <GlassCard className="flex flex-col gap-4">
               <h3 className="font-heading font-semibold text-lg text-white mb-2">Hardware Setup</h3>
               <Button onClick={handleToggleMic} variant={micStatus === "ON" ? "outline" : "primary"} className="w-full justify-start">
                 {micStatus === "ON" ? <Mic size={16} className="mr-2 text-green-400" /> : <MicOff size={16} className="mr-2" />}
                 {micStatus === "ON" ? "Disable Microphone" : "Enable Microphone"}
               </Button>
               <div className="text-xs font-mono text-white/50">
                 Provider: {rimeConnected ? <span className="text-green-400 font-bold tracking-widest">RIME CONNECTED</span> : "RIME SPEECH PROVIDER"}
               </div>
            </GlassCard>

            <h3 className="font-heading font-semibold text-lg text-white mb-2 mt-4">Simulation</h3>
            <Button onClick={startTestAudio} className="w-full justify-start border-blue-500/30 text-blue-400 hover:bg-blue-500/20" variant="outline">
              Start Test Audio
            </Button>
            <Button onClick={actions.simulateInterrupt} className="w-full justify-start bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-white border border-red-500/30">
              <ShieldAlert size={16} className="mr-2" /> Manual Interrupt
            </Button>
            <Button onClick={actions.simulateRapidInterruptions} className="w-full justify-start" variant="outline">
              <FastForward size={16} className="mr-2" /> Rapid Interruptions (x5)
            </Button>
            <Button onClick={actions.simulateStaleResponse} className="w-full justify-start border-orange-500/30 text-orange-400 hover:bg-orange-500/20" variant="outline">
              <Clock size={16} className="mr-2" /> Generate Stale Response
            </Button>
            
            <div className="mt-8">
              <TurnInspector context={activeContext} />
            </div>
          </div>

          {/* Metrics & Telemetry */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Statuses */}
            <GlassCard className="flex flex-col gap-2">
               <div className="text-xs font-mono uppercase text-white/50">Microphone</div>
               <div className={`text-xl font-bold ${micStatus === 'ON' ? 'text-green-400' : micStatus === 'DENIED' ? 'text-red-400' : 'text-white'}`}>{micStatus}</div>
            </GlassCard>
            
            <GlassCard className="flex flex-col gap-2">
               <div className="text-xs font-mono uppercase text-white/50">Playback</div>
               <div className={`text-xl font-bold ${playbackStatus === 'PLAYING' ? 'text-blue-400' : 'text-white'}`}>{playbackStatus}</div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
               <div className="text-xs font-mono uppercase text-white/50">Voice Activity</div>
               <div className={`text-xl font-bold ${vadStatus === 'DETECTED' ? 'text-green-400 animate-pulse' : 'text-white/50'}`}>{vadStatus}</div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2 border-white/10">
              <div className="text-xs font-mono uppercase text-white/50">FSM State</div>
              <div className={`text-xl font-bold text-white`}>{state}</div>
            </GlassCard>

            {/* Test Acceptance */}
            <GlassCard className={`md:col-span-2 flex flex-col items-center justify-center py-8 border ${isMeasured ? (isPass ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5') : 'border-white/10'}`}>
              <div className="text-xs font-mono uppercase tracking-widest text-white/50 mb-2">
                Acceptance Threshold: &le; {threshold}ms
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-heading font-bold text-white">
                  {isMeasured ? Math.round(latency) : "--"}
                </span>
                <span className="text-xl text-white/50 font-sans">ms</span>
              </div>
              <div className={`px-4 py-1 rounded text-sm font-bold tracking-widest uppercase ${!isMeasured ? 'bg-white/10 text-white/50' : isPass ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                {!isMeasured ? "NOT MEASURED" : isPass ? "PASS" : "FAIL"}
              </div>
            </GlassCard>

            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Dropped Stale Responses</div>
              <div className="text-2xl font-bold text-orange-400">{metrics.droppedStaleResponsesCount}</div>
            </GlassCard>
            
            <GlassCard className="flex flex-col gap-2">
              <div className="text-xs font-mono uppercase text-white/50 mb-1">Cancelled Playbacks</div>
              <div className="text-2xl font-bold text-red-400">{metrics.cancelledPlaybackCount}</div>
            </GlassCard>

            {/* Event Log */}
            <GlassCard className="md:col-span-2 flex flex-col gap-2 h-64 overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-white/50 sticky top-0 bg-[#02040a] pb-2 border-b border-white/5 z-10">
                <FileText size={14} /> Event Log
              </div>
              <div className="flex flex-col gap-1 mt-2">
                {events.map((ev, i) => (
                  <div key={i} className="flex gap-4 text-sm font-mono items-center">
                     <span className="text-white/30 shrink-0 w-24">{(ev.timestamp / 1000).toFixed(3)}s</span>
                     <span className={`
                       ${ev.eventType.includes('STALE') ? 'text-orange-400' : ''}
                       ${ev.eventType.includes('INTERRUPT') ? 'text-red-400' : ''}
                       ${ev.eventType.includes('MIC') ? 'text-green-400' : ''}
                       ${ev.eventType.includes('PLAYBACK') ? 'text-blue-400' : 'text-white/80'}
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
