export type SystemStatus = "healthy" | "pending" | "offline";
export type MissionPhaseId = "registration" | "problem_round" | "submission" | "presentation" | "completed";

export interface MissionPhase {
  id: MissionPhaseId;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

export interface SystemComponent {
  id: string;
  name: string;
  status: SystemStatus;
}

export const MISSION_CONFIG = {
  hero: {
    title: "MISSION CONTROL",
    product: "VoicePilot AI",
    subtitle: "The Future of Voice Productivity",
    description: "A full-duplex voice-native productivity assistant built for seamless interruption and intelligent recovery.",
  },
  strings: {
    missionOverview: "Mission Overview",
    missionStatus: "Mission Status",
    currentPhase: "Current Phase",
    timelinePreview: "Timeline Preview",
    voiceCore: "Voice Core Preview",
    systemStatus: "System Status",
    engineeringStatus: "Engineering Status",
  },
  phases: [
    { id: "registration", name: "Registration", startDate: "2026-08-01T00:00:00Z", endDate: "2026-08-31T23:59:59Z" },
    { id: "problem_round", name: "Problem Round", startDate: "2026-09-01T00:00:00Z", endDate: "2026-09-15T23:59:59Z" },
    { id: "submission", name: "Submission", startDate: "2026-09-16T00:00:00Z", endDate: "2026-09-20T23:59:59Z" },
    { id: "presentation", name: "Presentation", startDate: "2026-09-21T00:00:00Z", endDate: "2026-09-25T23:59:59Z" }
  ] as MissionPhase[],
  systems: [
    { id: "frontend", name: "Frontend Core", status: "healthy" },
    { id: "api", name: "API Gateway", status: "healthy" },
    { id: "voice", name: "Duplex Voice Engine", status: "pending" },
    { id: "rime", name: "Rime TTS Sync", status: "pending" },
    { id: "testing", name: "Acceptance Testing", status: "offline" }
  ] as SystemComponent[],
  metrics: {
    buildStatus: "Passing",
    repositoryStatus: "Clean",
    voiceEngine: "Awaiting Ph2",
    rimeEngine: "Awaiting Ph2"
  }
};
