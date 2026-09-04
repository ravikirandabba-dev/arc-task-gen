import { Navigation } from "@/components/layout/Navigation";
import { Hero } from "@/components/hero/Hero";
import { MissionOverview } from "@/components/sections/MissionOverview";
import { LiveVoiceTest } from "@/components/mission/LiveVoiceTest";
import { JudgeMode } from "@/components/mission/JudgeMode";
import { DeveloperDiagnostics } from "@/components/mission/DeveloperDiagnostics";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="flex-grow flex flex-col relative bg-background selection:bg-[var(--primary)] selection:text-black">
      <Navigation />
      <Hero />
      <MissionOverview />
      <DeveloperDiagnostics />
      <JudgeMode />
      <LiveVoiceTest />
      <Footer />
    </main>
  );
}
