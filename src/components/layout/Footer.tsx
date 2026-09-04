import React from "react";
import { Container } from "../ui/Container";

export function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#050816] relative z-20">
      <Container className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-heading font-bold text-lg text-white/90">VoicePilot AI</span>
          <span className="text-sm text-white/40">The Future of Voice Productivity</span>
        </div>
        
        <div className="text-sm text-white/30 font-mono">
          &copy; {new Date().getFullYear()} DataForge Hackathon Submission
        </div>
      </Container>
    </footer>
  );
}
