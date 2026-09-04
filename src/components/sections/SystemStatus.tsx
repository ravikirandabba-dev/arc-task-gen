"use client";

import React from "react";
import { motion } from "framer-motion";
import { Container } from "../ui/Container";
import { GlassCard } from "../ui/GlassCard";
import { SectionHeading } from "../ui/SectionHeading";
import { MISSION_CONFIG, SystemStatus as StatusType } from "@/config/mission";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export function SystemStatus() {
  const getStatusIcon = (status: StatusType) => {
    switch (status) {
      case "healthy": return <CheckCircle2 size={18} className="text-green-400" />;
      case "pending": return <Clock size={18} className="text-yellow-400" />;
      case "offline": return <AlertCircle size={18} className="text-red-400" />;
    }
  };

  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "healthy": return "border-green-400/20 bg-green-400/5";
      case "pending": return "border-yellow-400/20 bg-yellow-400/5";
      case "offline": return "border-red-400/20 bg-red-400/5";
    }
  };

  return (
    <section className="py-24 relative z-20 bg-black/40">
      <Container>
        <SectionHeading title={MISSION_CONFIG.strings.systemStatus} align="center" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          {MISSION_CONFIG.systems.map((sys, i) => (
            <motion.div
              key={sys.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <GlassCard className={`flex flex-col items-center justify-center p-6 border ${getStatusColor(sys.status)} text-center gap-4`}>
                <div className="p-3 rounded-full bg-white/5">
                  {getStatusIcon(sys.status)}
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-white/90">{sys.name}</h4>
                  <p className="text-xs font-mono tracking-widest uppercase mt-1 opacity-70">
                    {sys.status}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
