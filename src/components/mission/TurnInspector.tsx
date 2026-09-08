"use client";

import React from "react";
import { GlassCard } from "../ui/GlassCard";
import { Cpu, Hash } from "lucide-react";
import { TurnContext } from "@/types/interrupt";

const sessionTimeOffset = typeof window !== 'undefined' ? Date.now() - performance.now() : 0;

interface TurnInspectorProps {
  context: TurnContext | null;
}

export function TurnInspector({ context }: TurnInspectorProps) {
  if (!context) {
    return (
      <GlassCard className="flex flex-col gap-4 border-white/5 opacity-50">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Cpu size={18} className="text-white/40" /> Turn Fencing
        </h3>
        <p className="text-sm font-mono text-white/40">NO ACTIVE TURN</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="flex flex-col gap-4 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 opacity-10 rounded-bl-full blur-xl" />
      
      <h3 className="font-heading font-semibold flex items-center gap-2 text-blue-400">
        <Cpu size={18} /> Turn Fencing Enclosure
      </h3>
      
      <div className="grid gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 flex items-center gap-1">
            <Hash size={10} /> Turn ID
          </span>
          <span className="text-sm font-mono text-white/90 truncate bg-black/40 px-2 py-1 rounded">
            {context.turnId}
          </span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 flex items-center gap-1">
            <Hash size={10} /> Generation ID
          </span>
          <span className="text-sm font-mono text-white/90 truncate bg-black/40 px-2 py-1 rounded">
            {context.generationId}
          </span>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-mono tracking-widest text-white/40 flex items-center gap-1">
            <Hash size={10} /> Timestamp
          </span>
          <span className="text-sm font-mono text-white/90 bg-black/40 px-2 py-1 rounded inline-block w-fit">
            {new Date(sessionTimeOffset + context.timestamp).toISOString().substring(11, 23)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
