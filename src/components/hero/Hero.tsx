"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { MISSION_CONFIG } from "@/config/mission";

export function Hero() {
  return (
    <div className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden">
      {/* Orbital Lighting Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] opacity-30 mix-blend-screen"
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--primary)] blur-[128px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--secondary)] blur-[128px] rounded-full" />
        </motion.div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay" />
        
        {/* Gradient fade to bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background to-transparent" />
      </div>
      
      <Container className="relative z-10 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl flex flex-col items-center gap-6"
        >
          <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs tracking-widest font-mono text-white/70 uppercase">
            {MISSION_CONFIG.hero.title}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold font-heading tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-sm pb-2">
            {MISSION_CONFIG.hero.product}
          </h1>
          
          <p className="text-xl md:text-2xl text-[var(--primary)] font-medium tracking-tight">
            {MISSION_CONFIG.hero.subtitle}
          </p>
          
          <p className="text-lg text-white/50 max-w-2xl font-sans font-light mt-4 leading-relaxed">
            {MISSION_CONFIG.hero.description}
          </p>
          
        </motion.div>

        {/* Floating elements indicating live status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-16 w-full max-w-lg h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
      </Container>
    </div>
  );
}
