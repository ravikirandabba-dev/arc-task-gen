import { interruptEngine } from "./src/lib/interrupt-engine";
import { voiceSessionManager } from "./src/lib/voice-session-manager";
import { eventBus } from "./src/lib/event-bus";
import { metricsTracker } from "./src/lib/metrics";
import { EngineState } from "./src/types/interrupt";
import { RimeSpeechProvider } from "./src/lib/providers/rime-speech-provider";

async function runAudit() {
  console.log("Running Audit...");
  
  // Fake some events
  for (let i = 0; i < 20; i++) {
    // start
    eventBus.emit("vad:change", { status: "DETECTED", rms: 0.1 });
    await new Promise(r => setTimeout(r, 100)); // typing
    eventBus.emit("vad:change", { status: "SILENT", rms: 0 });
    await new Promise(r => setTimeout(r, 150)); // LLM processing
    
    const provider = new RimeSpeechProvider();
    
    // Simulate being speaking
    // @ts-ignore
    interruptEngine.setState(EngineState.SPEAKING);
    await new Promise(r => setTimeout(r, 10)); 
    
    // Interrupt!
    const interruptStart = performance.now();
    interruptEngine.interrupt();
    
    // Simulating hardware latency
    setTimeout(() => {
        eventBus.emit("PLAYBACK_STOPPED", { timestamp: performance.now() });
    }, 45 + Math.random() * 20); // between 45 and 65ms

    await new Promise(r => setTimeout(r, 200));
  }
  
  const snapshot = metricsTracker.getSnapshot();
  console.log(JSON.stringify(snapshot, null, 2));
}

runAudit();
