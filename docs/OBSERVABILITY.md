# Observability System

For the DataForge Hackathon, we constructed a forensic audibility layer to mathematically prove the efficiency of our Interruption Engine.

## Subsystems
1. **EngineLogger**: Connects to the global Event Bus wildcard (`onAny`), structuring all system shifts into `EngineEvent` objects (timestamp, FSM state, Turn Context).
2. **EventTimeline**: An in-memory ledger storing the chronological sequence of all captured `EngineEvent`s.
3. **EngineSnapshots**: Triggered during major structural events (Interruptions, Recoveries), these capture a frozen snapshot of exact queue sizes, metric counts, and context states for debugging.
4. **ReplayEngine**: A NodeJS temporal chronometer that can step forward/backward through the `EventTimeline`, natively mocking FSM shifts back to the Developer UI.
5. **ExportSystem**: Transpiles the in-memory ledgers into downloadable JSON, CSV, or formatted Markdown Reports.

## Core Metrics Captured
- `p95GenerationLatencyMs`
- `maxGenerationLatencyMs`
- `droppedResponsesCount`
- `cancelledGenerationsCount`
- `queueFlushCount`
