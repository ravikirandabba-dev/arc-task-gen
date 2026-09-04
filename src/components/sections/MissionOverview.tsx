"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { GlassCard } from "../ui/GlassCard";
import { SectionHeading } from "../ui/SectionHeading";
import { useMissionStatus } from "@/hooks/useMissionStatus";
import { MISSION_CONFIG } from "@/config/mission";
import { Clock, Rocket, Server, Activity, Mic, ShieldCheck } from "lucide-react";

export function MissionOverview() {
  const { currentPhase, countdown } = useMissionStatus();

  const pad = (num: number) => String(num).padStart(2, "0");

  const cards = [
    {
      title: "Mission Phase",
      value: currentPhase ? currentPhase.name : "Initializing...",
      icon: <Rocket size={20} />,
      color: "text-[var(--primary)]"
    },
    {
      title: "Countdown",
      value: `${pad(countdown.days)}:${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`,
      icon: <Clock size={20} />,
      color: "text-[var(--accent)]"
    },
    {
      title: "Build Status",
      value: MISSION_CONFIG.metrics.buildStatus,
      icon: <Activity size={20} />,
      color: "text-green-400"
    },
    {
      title: "Repository",
      value: MISSION_CONFIG.metrics.repositoryStatus,
      icon: <ShieldCheck size={20} />,
      color: "text-blue-400"
    },
    {
      title: "Voice Engine",
      value: MISSION_CONFIG.metrics.voiceEngine,
      icon: <Mic size={20} />,
      color: "text-yellow-400"
    },
    {
      title: "Rime TTS",
      value: MISSION_CONFIG.metrics.rimeEngine,
      icon: <Server size={20} />,
      color: "text-yellow-400"
    }
  ];

  return (
    <section className="py-24 relative z-20">
      <Container>
        <SectionHeading title={MISSION_CONFIG.strings.missionOverview} align="center" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GlassCard className="flex flex-col gap-4 h-full border-white/10 hover:border-white/20 hover:bg-white/[0.08] group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.02] rounded-bl-full transition-transform group-hover:scale-110 ${card.color}`} />
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                    {card.icon}
                  </div>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-white/50">{card.title}</h4>
                </div>
                <div className="text-2xl font-bold font-heading text-white/90">
                  {card.value}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
