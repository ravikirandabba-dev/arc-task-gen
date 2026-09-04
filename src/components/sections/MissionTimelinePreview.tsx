"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { MISSION_CONFIG } from "@/config/mission";
import { useMissionStatus } from "@/hooks/useMissionStatus";
import { CheckCircle2, CircleDot, Circle } from "lucide-react";

export function MissionTimelinePreview() {
  const { currentPhase } = useMissionStatus();

  // Specifically requested phases to show
  const displayPhaseIds = ["registration", "problem_round", "presentation"];
  const displayPhases = MISSION_CONFIG.phases.filter(p => displayPhaseIds.includes(p.id));

  const getPhaseState = (phaseId: string) => {
    if (!currentPhase) return "pending";
    const phaseIndex = MISSION_CONFIG.phases.findIndex(p => p.id === phaseId);
    const currentIndex = MISSION_CONFIG.phases.findIndex(p => p.id === currentPhase.id);
    
    if (phaseIndex < currentIndex || currentPhase.id === "completed") return "completed";
    if (phaseIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <section className="py-24 bg-black/20 border-y border-white/5 relative z-20">
      <Container>
        <SectionHeading title={MISSION_CONFIG.strings.timelinePreview} align="left" />
        
        <div className="mt-16 flex flex-col md:flex-row justify-between relative max-w-4xl mx-auto">
          {/* Connector Line */}
          <div className="absolute top-6 left-8 right-8 h-[2px] bg-white/10 hidden md:block z-0" />
          
          {displayPhases.map((phase, index) => {
            const state = getPhaseState(phase.id);
            
            return (
              <motion.div 
                key={phase.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="flex flex-row md:flex-col items-center md:items-start gap-6 md:gap-4 relative z-10 mb-8 md:mb-0"
              >
                <div className="bg-[#050816] p-1 rounded-full border-4 border-transparent flex-shrink-0">
                  {state === "completed" && <CheckCircle2 size={32} className="text-[var(--accent)]" />}
                  {state === "active" && <CircleDot size={32} className="text-[var(--primary)] animate-pulse" />}
                  {state === "pending" && <Circle size={32} className="text-white/20" />}
                </div>
                
                <div className="flex flex-col">
                  <span className={`text-sm font-mono uppercase tracking-widest font-semibold mb-1 ${
                    state === "active" ? "text-[var(--primary)]" : 
                    state === "completed" ? "text-[var(--accent)]" : "text-white/40"
                  }`}>
                    {state === "active" ? "Current" : state === "completed" ? "Done" : "Upcoming"}
                  </span>
                  <span className="text-xl font-heading font-bold text-white/90">
                    {phase.name}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
