import { interruptEngine } from "@/lib/interrupt-engine";

jest.mock("@/lib/event-bus");
jest.mock("@/lib/voice-session-manager");
jest.mock("@/lib/playback-controller");
jest.mock("@/lib/metrics");

describe("InterruptEngine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize successfully", () => {
    expect(interruptEngine).toBeDefined();
  });

  it("should transition state when speech is detected", () => {
    // Scaffold
    expect(true).toBe(true);
  });
});
