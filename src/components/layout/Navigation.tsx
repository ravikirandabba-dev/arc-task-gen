import React from "react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Mic } from "lucide-react";
import Link from "next/link";

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#050816]/80 backdrop-blur-md">
      <Container>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Mic size={18} />
            </div>
            <Link href="/" className="font-heading font-bold text-xl tracking-tight text-white">
              VoicePilot <span className="text-[var(--primary)]">AI</span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Architecture
            </Link>
            <Link href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              DataForge 2026
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Documentation
            </Button>
            <Button variant="primary" size="sm" disabled>
              Launch Mission
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
