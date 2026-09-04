# Architecture Overview

VoicePilot AI uses an **Event-Driven, Service-Oriented Architecture** inside a React client wrapper.

## Core Philosophy
1. **Decoupled Providers**: All external APIs (STT, LLM, TTS) are hidden behind polymorphic Typescript interfaces (`SpeechProvider`, `LLMProvider`).
2. **Event Bus Centralization**: The UI does not drive the voice engine. The voice engine runs entirely in singleton memory and pushes discrete events (`"VAD_STARTED"`, `"PLAYBACK_STOPPED"`) through a central `EventBus`. The React UI subscribes to this bus.
3. **Fencing and Staleness**: Asynchronous AI generation introduces race conditions. We use a deterministic `TurnId` and `GenerationId` pairing. Any generation that completes *after* a turn is invalidated is discarded ("fenced") natively by the architecture.

## Interaction Flow
- `MicrophoneManager` streams `AnalyserNode` levels.
- The VAD interval triggers `vad:change` -> `DETECTED`.
- `InterruptEngine` listens, immediately stops `PlaybackController`, and marks the old Turn as Stale.
- Upon `vad:change` -> `SILENT`, the `RecordingManager` finalizes a Blob and passes it to the `ConversationEngine`.
- The `ConversationEngine` builds the prompt, calls the LLM, and dispatches the `AssistantResponse` back to the `InterruptEngine`.
- `InterruptEngine` delegates synthesis to the `SpeechProvider`, which streams audio to the `PlaybackController`.

## State Management
We use a Finite State Machine (FSM) defined in `EngineState` (`IDLE`, `LISTENING`, `THINKING`, `SPEAKING`, `INTERRUPTED`, `RECOVERING`). React components map purely to these explicit states, preventing UI drift.
