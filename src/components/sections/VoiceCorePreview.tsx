"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { MISSION_CONFIG } from "@/config/mission";

type VoiceState = "Idle" | "Listening" | "Thinking" | "Speaking" | "Interrupted";

export function VoiceCorePreview() {
  const [activeState, setActiveState] = useState<VoiceState>("Idle");
  
  // Cycle states automatically for the preview
  useEffect(() => {
    const states: VoiceState[] = ["Idle", "Listening", "Thinking", "Speaking", "Interrupted"];
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % states.length;
      setActiveState(states[index]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const stateColors: Record<VoiceState, string> = {
    Idle: "bg-white/10 shadow-none",
    Listening: "bg-[var(--primary)] shadow-[0_0_40px_var(--primary)]",
    Thinking: "bg-[var(--secondary)] shadow-[0_0_40px_var(--secondary)]",
    Speaking: "bg-[var(--accent)] shadow-[0_0_40px_var(--accent)]",
    Interrupted: "bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
  };

  return (
    <section className="py-24 relative z-20">
      <Container>
        <SectionHeading 
          title={MISSION_CONFIG.strings.voiceCore} 
          subtitle="Visualizing the future of full-duplex interruptions. (Simulated Preview)"
          align="center" 
        />
        
        <div className="mt-16 max-w-3xl mx-auto border border-white/10 bg-black/40 backdrop-blur-2xl rounded-3xl p-8 md:p-16 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          
          {/* Subtle background glow based on state */}
          <div className={`absolute inset-0 opacity-20 blur-3xl transition-colors duration-700 ${stateColors[activeState]}`} />
          
          <div className="relative h-48 flex items-center justify-center w-full">
            <AnimatePresence mode="wait">
              {activeState === "Idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-24 h-24 rounded-full border-4 border-white/20"
                />
              )}
              {activeState === "Listening" && (
                <motion.div
                  key="listening"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 1.5, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute w-full h-full rounded-full border-2 border-[var(--primary)] opacity-50"
                  />
                </motion.div>
              )}
              {activeState === "Thinking" && (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-4"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -20, 0] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      className="w-6 h-6 rounded-full bg-[var(--secondary)]"
                    />
                  ))}
                </motion.div>
              )}
              {activeState === "Speaking" && (
                <motion.div
                  key="speaking"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-24 h-24 rounded-full bg-[var(--accent)] flex items-center justify-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-full h-full rounded-full bg-[var(--accent)]"
                  />
                </motion.div>
              )}
              {activeState === "Interrupted" && (
                <motion.div
                  key="interrupted"
                  initial={{ opacity: 0, scale: 1.2 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-24 h-24 rounded-xl bg-red-500 rotate-45 flex items-center justify-center overflow-hidden"
                >
                   <div className="w-32 h-2 bg-black -rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-4">
            {(["Idle", "Listening", "Thinking", "Speaking", "Interrupted"] as VoiceState[]).map((state) => (
              <button
                key={state}
                onClick={() => setActiveState(state)}
                className={`px-4 py-2 rounded-full text-sm font-mono tracking-wider transition-all duration-300 ${
                  activeState === state 
                    ? "bg-white text-black font-bold" 
                    : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {state}
              </button>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
